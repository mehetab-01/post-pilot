"""
Razorpay billing endpoints – create orders, verify payments, manage subscriptions.
"""

import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings as cfg
from app.database import get_db
from app.limiter import limiter
from app.models.models import Payment, User
from app.plans import PLAN_CONFIG, get_plan_config
from app.security import get_current_user

router = APIRouter(prefix="/api/billing", tags=["billing"])


# ── Pricing tables (amounts in paise) ─────────────────────────────────────────

PRICING_INR = {
    "starter": {"monthly": 49900, "yearly": 479900},
    "pro":     {"monthly": 149900, "yearly": 1439900},
}

PRICING_USD = {
    "starter": {"monthly": 600, "yearly": 6000},      # $6 / $60
    "pro":     {"monthly": 1800, "yearly": 18000},     # $18 / $180
}

# ── Razorpay client (lazy init) ──────────────────────────────────────────────

_rz_client: Optional[razorpay.Client] = None


def _get_razorpay() -> razorpay.Client:
    global _rz_client
    if _rz_client is None:
        if not cfg.RAZORPAY_KEY_ID or not cfg.RAZORPAY_KEY_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
            )
        _rz_client = razorpay.Client(auth=(cfg.RAZORPAY_KEY_ID, cfg.RAZORPAY_KEY_SECRET))
    return _rz_client


# ── Schemas ──────────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    plan: str                  # starter | pro
    billing_cycle: str         # monthly | yearly
    currency: str = "INR"      # INR | USD


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str
    billing_cycle: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    plan: str
    expires_at: Optional[str] = None


class BillingStatusResponse(BaseModel):
    plan: str
    billing_cycle: Optional[str] = None
    plan_started_at: Optional[str] = None
    plan_expires_at: Optional[str] = None
    plan_cancelled: bool = False
    next_billing_date: Optional[str] = None
    last_payment_amount: Optional[int] = None
    last_payment_currency: Optional[str] = None
    payments: list = []


# ── Helpers ──────────────────────────────────────────────────────────────────

def _verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature using HMAC-SHA256."""
    msg = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(
        cfg.RAZORPAY_KEY_SECRET.encode(), msg, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def _activate_plan(user: User, plan: str, billing_cycle: str, db: Session) -> None:
    """Set user to the given paid plan with fresh quota."""
    plan_cfg = get_plan_config(plan)
    now = datetime.utcnow()
    days = 365 if billing_cycle == "yearly" else 30

    user.plan = plan
    user.generations_limit = plan_cfg["generations_limit"]
    user.generations_used = 0
    user.plan_started_at = now
    user.plan_expires_at = now + timedelta(days=days)
    user.billing_cycle_start = now
    user.billing_cycle = billing_cycle
    user.plan_cancelled = False
    db.commit()


def check_plan_expiry(user: User, db: Session) -> None:
    """If user's paid plan has expired, downgrade to free."""
    if user.plan in ("free", None):
        return
    if user.plan_expires_at and user.plan_expires_at < datetime.utcnow():
        free_cfg = get_plan_config("free")
        user.plan = "free"
        user.generations_limit = free_cfg["generations_limit"]
        user.generations_used = 0
        user.billing_cycle = None
        user.plan_cancelled = False
        user.razorpay_order_id = None
        user.razorpay_payment_id = None
        db.commit()


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/create-order", response_model=CreateOrderResponse)
@limiter.limit("3/minute")
def create_order(
    request: Request,
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = payload.plan.lower().strip()
    cycle = payload.billing_cycle.lower().strip()
    currency = payload.currency.upper().strip()

    if plan not in ("starter", "pro"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="plan must be 'starter' or 'pro'",
        )
    if cycle not in ("monthly", "yearly"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="billing_cycle must be 'monthly' or 'yearly'",
        )

    # Choose pricing table
    if currency == "USD":
        amount = PRICING_USD[plan][cycle]
    else:
        currency = "INR"
        amount = PRICING_INR[plan][cycle]

    rz = _get_razorpay()
    order = rz.order.create({
        "amount": amount,
        "currency": currency,
        "receipt": f"pp_{current_user.id}_{plan}_{cycle}",
        "notes": {
            "user_id": str(current_user.id),
            "plan": plan,
            "billing_cycle": cycle,
        },
    })

    # Persist order in payments table as "created"
    payment = Payment(
        user_id=current_user.id,
        razorpay_order_id=order["id"],
        amount=amount,
        currency=currency,
        plan=plan,
        billing_cycle=cycle,
        status="created",
    )
    db.add(payment)
    current_user.razorpay_order_id = order["id"]
    db.commit()

    return CreateOrderResponse(
        order_id=order["id"],
        amount=amount,
        currency=currency,
        key_id=cfg.RAZORPAY_KEY_ID,
    )


@router.post("/verify-payment", response_model=VerifyPaymentResponse)
def verify_payment(
    payload: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Verify the Razorpay signature
    if not _verify_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    ):
        # Update payment record to failed
        pay = (
            db.query(Payment)
            .filter(Payment.razorpay_order_id == payload.razorpay_order_id)
            .first()
        )
        if pay:
            pay.status = "failed"
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed — invalid signature.",
        )

    plan = payload.plan.lower().strip()
    cycle = payload.billing_cycle.lower().strip()

    if plan not in PLAN_CONFIG or plan == "free":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan for payment verification.",
        )

    # 2. Update payment record
    pay = (
        db.query(Payment)
        .filter(Payment.razorpay_order_id == payload.razorpay_order_id)
        .first()
    )
    if pay:
        pay.razorpay_payment_id = payload.razorpay_payment_id
        pay.status = "paid"

    # 3. Activate plan
    _activate_plan(current_user, plan, cycle, db)

    # 4. Store payment reference on user
    current_user.razorpay_payment_id = payload.razorpay_payment_id
    db.commit()

    return VerifyPaymentResponse(
        success=True,
        plan=plan,
        expires_at=current_user.plan_expires_at.isoformat() if current_user.plan_expires_at else None,
    )


@router.get("/status", response_model=BillingStatusResponse)
def billing_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_plan_expiry(current_user, db)

    # Fetch payment history
    payments = (
        db.query(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .limit(20)
        .all()
    )
    payment_list = [
        {
            "id": p.id,
            "order_id": p.razorpay_order_id,
            "payment_id": p.razorpay_payment_id,
            "amount": p.amount,
            "currency": p.currency,
            "plan": p.plan,
            "billing_cycle": p.billing_cycle,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in payments
    ]

    # Last paid payment
    last_paid = next((p for p in payments if p.status == "paid"), None)

    return BillingStatusResponse(
        plan=current_user.plan or "free",
        billing_cycle=current_user.billing_cycle,
        plan_started_at=current_user.plan_started_at.isoformat() if current_user.plan_started_at else None,
        plan_expires_at=current_user.plan_expires_at.isoformat() if current_user.plan_expires_at else None,
        plan_cancelled=bool(current_user.plan_cancelled),
        next_billing_date=current_user.plan_expires_at.isoformat() if current_user.plan_expires_at and not current_user.plan_cancelled else None,
        last_payment_amount=last_paid.amount if last_paid else None,
        last_payment_currency=last_paid.currency if last_paid else None,
        payments=payment_list,
    )


@router.post("/webhook", include_in_schema=False)
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Razorpay server-to-server webhook — safety net for when the browser closes
    before verify-payment completes.
    Set RAZORPAY_WEBHOOK_SECRET in .env to enable signature verification.
    """
    body = await request.body()

    # Verify webhook signature if secret is configured
    if cfg.RAZORPAY_WEBHOOK_SECRET:
        sig = request.headers.get("x-razorpay-signature", "")
        expected = hmac.new(
            cfg.RAZORPAY_WEBHOOK_SECRET.encode(), body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json as _json
    try:
        event = _json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event.get("event")

    if event_type == "payment.captured":
        payload = event.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payload.get("order_id")
        payment_id = payload.get("id")
        notes = payload.get("notes", {})
        user_id = notes.get("user_id")
        plan = notes.get("plan")
        billing_cycle = notes.get("billing_cycle", "monthly")

        if user_id and plan and plan in PLAN_CONFIG and plan != "free":
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user and user.plan != plan:
                _activate_plan(user, plan, billing_cycle, db)
                # Update payment record if it exists
                pay = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
                if pay and pay.status != "paid":
                    pay.razorpay_payment_id = payment_id
                    pay.status = "paid"
                    db.commit()

    elif event_type == "payment.failed":
        payload = event.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payload.get("order_id")
        if order_id:
            pay = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
            if pay and pay.status == "created":
                pay.status = "failed"
                db.commit()

    return {"status": "ok"}


@router.post("/cancel")
def cancel_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.plan in ("free", None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already on the Free plan.",
        )
    current_user.plan_cancelled = True
    db.commit()
    return {
        "message": f"Your {current_user.plan.title()} plan will remain active until {current_user.plan_expires_at.strftime('%b %d, %Y') if current_user.plan_expires_at else 'the end of the billing period'}. After that you'll be on the Free plan.",
        "plan": current_user.plan,
        "expires_at": current_user.plan_expires_at.isoformat() if current_user.plan_expires_at else None,
    }
