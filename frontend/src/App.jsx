import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Eager — always needed
import Login    from '@/pages/Login'
import Register from '@/pages/Register'
import Landing  from '@/pages/Landing'

// Lazy — loaded only when first visited
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const History   = lazy(() => import('@/pages/History'))
const Settings  = lazy(() => import('@/pages/Settings'))

// ── Lenis smooth scroll ───────────────────────────────────────────────────────
function LenisProvider() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
  return null
}

// ── Suspense fallback ─────────────────────────────────────────────────────────
function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <LoadingSpinner size={36} />
    </div>
  )
}

// ── Route guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageFallback />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Public routes redirect authenticated users to the dashboard
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageFallback />
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// ── Animated routes ───────────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public pages */}
        <Route path="/"         element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected app pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageFallback />}>
                  <Dashboard />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageFallback />}>
                  <History />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageFallback />}>
                  <Settings />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LenisProvider />
        <AnimatedRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#27272a',
              color: '#e4e4e7',
              border: '1px solid #3f3f46',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: { iconTheme: { primary: '#f59e0b', secondary: '#27272a' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#27272a' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
