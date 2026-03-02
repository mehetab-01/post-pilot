# PostPilot

AI-powered social media content generator and auto-poster for five platforms.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude-Sonnet_4-D97706?style=flat-square&logo=anthropic&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

---

## Features

- **AI content generation** — Describe a topic once; get platform-native posts for X, LinkedIn, Reddit, Instagram, and WhatsApp simultaneously
- **8 tone presets** — Professional, Casual, Witty, Inspirational, Educational, Controversial, Storytelling, Minimalist
- **One-click post actions** — Regenerate, Enhance (more engaging), and Humanize (remove AI-sounding language) per platform
- **Direct publishing** — Post to X (Twitter), LinkedIn, and Reddit with a single click
- **Instagram and WhatsApp** — Copy-to-clipboard and pre-filled WhatsApp deep link for platforms that restrict API access
- **Post history** — Full history with platform, status, and search filters; re-use any post as a template
- **Multi-user** — JWT auth with per-user API key storage encrypted at rest with Fernet (AES-128-CBC)
- **Premium dark UI** — Smooth animations via GSAP and Framer Motion, responsive on all screen sizes

---

## Screenshots

*Screenshots coming soon.*

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET and FERNET_KEY (see Environment Variables below)

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Default URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| OpenAPI schema | http://localhost:8000/openapi.json |

---

## API Key Setup

PostPilot requires a Claude API key for content generation. Platform posting keys are optional — add only the ones you want to use.

| Platform | Required for | Where to get it |
|----------|-------------|-----------------|
| **Anthropic Claude** | AI content generation | [console.anthropic.com](https://console.anthropic.com) |
| **X / Twitter** | Direct tweet/thread posting | [developer.x.com](https://developer.x.com) → Create app → OAuth 1.0a Read & Write |
| **LinkedIn** | Direct post publishing | [developer.linkedin.com](https://developer.linkedin.com) → Create app → Share on LinkedIn product |
| **Reddit** | Direct subreddit posting | [reddit.com/prefs/apps](https://reddit.com/prefs/apps) → Create script app |
| **Instagram** | Direct posting (optional) | Meta Business → Instagram Graph API (clipboard mode works without keys) |
| **WhatsApp** | N/A | No key needed — uses the `wa.me` deep link |

Add keys via the Settings page in the app. All values are encrypted with Fernet before being stored in SQLite.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | No | SQLite path (default: `sqlite:///./postpilot.db`) |
| `JWT_SECRET` | **Yes** | Secret for JWT signing — use a long random string |
| `JWT_ALGORITHM` | No | JWT algorithm (default: `HS256`) |
| `JWT_EXPIRE_DAYS` | No | Token expiry in days (default: `7`) |
| `FERNET_KEY` | **Yes** | Symmetric key for API key encryption — generate once and keep |
| `UPLOAD_DIR` | No | Media upload directory (default: `./uploads`) |

Generate a `FERNET_KEY`:

```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

Generate a `JWT_SECRET`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend (`frontend/.env`)

No frontend environment variables are required. The Vite dev server proxies all `/api` requests to `http://localhost:8000`.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 19 |
| Build tool | Vite | 7 |
| CSS framework | Tailwind CSS | v4 |
| Animation | GSAP + Framer Motion | 3.14 / 12 |
| Smooth scroll | Lenis | 1.3 |
| HTTP client | Axios | 1.13 |
| Routing | React Router | 7 |
| Icons | Lucide React + React Icons | — |
| Backend framework | FastAPI | 0.115 |
| ASGI server | Uvicorn | 0.30 |
| ORM | SQLAlchemy | 2.0 (sync) |
| Database | SQLite | — |
| Auth | python-jose (JWT) + passlib (bcrypt) | — |
| Encryption | cryptography (Fernet) | 43 |
| AI | Anthropic Python SDK | 0.40 |
| Twitter | Tweepy | 4.14 |
| Reddit | PRAW | 7.8 |
| LinkedIn | httpx | 0.27 |
| File I/O | aiofiles | 24.1 |

---

## Project Structure

```
postpilot/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration, startup
│   │   ├── config.py            # Settings loaded from .env via python-dotenv
│   │   ├── database.py          # SQLAlchemy engine, SessionLocal, get_db()
│   │   ├── security.py          # JWT helpers, get_current_user dependency
│   │   ├── models/
│   │   │   └── models.py        # ORM models: User, ApiKey, Post, Media
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic request/response schemas
│   │   ├── routes/
│   │   │   ├── auth.py          # /api/auth — register, login, me
│   │   │   ├── settings.py      # /api/settings — key CRUD + connection test
│   │   │   ├── generate.py      # /api/generate — generate, regenerate, enhance, humanize
│   │   │   ├── post.py          # /api/post — post to single platform or all
│   │   │   ├── history.py       # /api/history — list, get, delete
│   │   │   └── media.py         # /api/media — upload, serve, delete
│   │   └── services/
│   │       ├── encryption.py    # Fernet encrypt/decrypt
│   │       ├── claude_service.py    # Anthropic async client, prompt construction
│   │       ├── twitter_service.py   # Tweepy v2 tweet and thread posting
│   │       ├── linkedin_service.py  # LinkedIn UGC API v2 via httpx
│   │       └── reddit_service.py    # PRAW subreddit posting
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── App.jsx              # Router, Lenis, lazy pages, AnimatePresence
│   │   ├── main.jsx
│   │   ├── index.css            # Tailwind @theme tokens, shimmer, noise texture
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  # Auth state, login/register/logout
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance, Bearer interceptor, API helpers
│   │   │   ├── generate.js      # Content generation wrappers
│   │   │   ├── history.js       # Post history wrappers
│   │   │   └── settings.js      # API key management wrappers
│   │   ├── hooks/
│   │   │   └── useApi.js        # Generic loading/error hook
│   │   ├── components/
│   │   │   ├── layout/          # Layout, Sidebar (mobile-responsive), PageTransition
│   │   │   ├── ui/              # Button, Input, Card, Badge, Modal, Toast, LoadingSpinner
│   │   │   ├── dashboard/       # ContextInput, PlatformSelector, PostPreview, PublishModal, …
│   │   │   ├── history/         # HistoryCard, HistoryFilters, HistoryList, EmptyState
│   │   │   └── settings/        # PlatformKeySection, KeyInput, SetupGuide, StatusSidebar, …
│   │   └── pages/
│   │       ├── Dashboard.jsx    # Main content creation page
│   │       ├── History.jsx      # Post history with filters
│   │       ├── Settings.jsx     # API key management
│   │       ├── Login.jsx
│   │       └── Register.jsx
│   ├── index.html
│   └── vite.config.js           # Tailwind plugin, @ alias, /api proxy
├── .gitignore
└── README.md
```

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Bearer | Get the current user's info |

### Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/settings/keys` | Bearer | Save API keys for a platform |
| `GET` | `/api/settings/keys` | Bearer | List all saved keys (masked) |
| `DELETE` | `/api/settings/keys/{platform}` | Bearer | Delete all keys for a platform |
| `POST` | `/api/settings/keys/test` | Bearer | Test connectivity for a platform |

### Generate

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/generate` | Bearer | Generate posts for multiple platforms |
| `POST` | `/api/generate/regenerate` | Bearer | Regenerate a single platform's post |
| `POST` | `/api/generate/enhance` | Bearer | Rewrite a post to be more engaging |
| `POST` | `/api/generate/humanize` | Bearer | Strip AI-sounding language from a post |

### Post

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/post/all` | Bearer | Publish posts to all selected platforms |
| `POST` | `/api/post/{platform}` | Bearer | Publish a post to a single platform |

### History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/history` | Bearer | List post history (`limit`, `offset` params) |
| `GET` | `/api/history/{id}` | Bearer | Get a single post record |
| `DELETE` | `/api/history/{id}` | Bearer | Delete a post from history |

### Media

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/media/upload` | Bearer | Upload a media file (max 50 MB) |
| `GET` | `/api/media/{id}` | Bearer | Serve an uploaded file |
| `DELETE` | `/api/media/{id}` | Bearer | Delete a media file |

---

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Follow the existing code style — no linter config is included, so match the surrounding code.
3. Keep backend and frontend changes in separate commits when possible.
4. Test your changes end-to-end before opening a pull request.
5. Open a pull request with a clear description of what changed and why.

Bug reports and feature requests are welcome via GitHub Issues.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
