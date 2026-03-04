import axios from 'axios'

const TOKEN_KEY = 'postpilot_token'

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach Bearer token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      // Redirect to login if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Token helpers ─────────────────────────────────────────────────────────────
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (username, password, email) =>
    api.post('/api/auth/register', { username, password, email }),

  login: (username, password) =>
    api.post('/api/auth/login', { username, password }),

  me: () => api.get('/api/auth/me'),

  deleteAccount: (confirmation) =>
    api.delete('/api/auth/account', { data: { confirmation } }),
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  saveKeys: (platform, keys) =>
    api.post('/api/settings/keys', { platform, keys }),

  getKeys: () => api.get('/api/settings/keys'),

  deleteKeys: (platform) => api.delete(`/api/settings/keys/${platform}`),

  testConnection: (platform) =>
    api.post('/api/settings/keys/test', { platform }),
}

// ── Generate ──────────────────────────────────────────────────────────────────
export const generateApi = {
  generate: (context, platforms, additional_instructions) =>
    api.post('/api/generate', { context, platforms, additional_instructions }),

  regenerate: (platform, context, tone, options) =>
    api.post('/api/generate/regenerate', { platform, context, tone, options }),

  enhance: (platform, content, tone, additional_instructions = null) =>
    api.post('/api/generate/enhance', { platform, content, tone, additional_instructions }),

  humanize: (platform, content, tone) =>
    api.post('/api/generate/humanize', { platform, content, tone }),
}

// ── Post ──────────────────────────────────────────────────────────────────────
export const postApi = {
  postToPlatform: (platform, content, post_id, media_ids, options) =>
    api.post(`/api/post/${platform}`, { content, post_id, media_ids, options }),

  postAll: (posts) => api.post('/api/post/all', { posts }),
}

// ── History ───────────────────────────────────────────────────────────────────
export const historyApi = {
  list: (limit = 20, offset = 0) =>
    api.get('/api/history', { params: { limit, offset } }),

  get: (id) => api.get(`/api/history/${id}`),

  delete: (id) => api.delete(`/api/history/${id}`),
}

// ── Media ─────────────────────────────────────────────────────────────────────
export const mediaApi = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getUrl: (id) => `/api/media/${id}`,

  delete: (id) => api.delete(`/api/media/${id}`),
}

// ── Analyze ───────────────────────────────────────────────────────────────────
export const analyzeApi = {
  humanizeScore: (content, platform) =>
    api.post('/api/analyze/humanize-score', { content, platform }),

  originalityCheck: (content, platform) =>
    api.post('/api/analyze/originality-check', { content, platform }),
}

// ── Templates ─────────────────────────────────────────────────────────────────
export const templatesApi = {
  list: (category) =>
    api.get('/api/templates', { params: category && category !== 'all' ? { category } : {} }),
  get: (id) => api.get(`/api/templates/${id}`),
  create: (data) => api.post('/api/templates', data),
  update: (id, data) => api.put(`/api/templates/${id}`, data),
  delete: (id) => api.delete(`/api/templates/${id}`),
  use: (id) => api.post(`/api/templates/${id}/use`),
}

// ── Usage / Plans ─────────────────────────────────────────────────────────────
export const usageApi = {
  getUsage: () => api.get('/api/usage'),
  upgrade: (plan) => api.post('/api/upgrade', { plan }),
}

// ── Billing / Razorpay ────────────────────────────────────────────────────────
export const billingApi = {
  createOrder: (plan, billing_cycle, currency = 'INR') =>
    api.post('/api/billing/create-order', { plan, billing_cycle, currency }),
  verifyPayment: (data) =>
    api.post('/api/billing/verify-payment', data),
  getStatus: () =>
    api.get('/api/billing/status'),
  cancel: () =>
    api.post('/api/billing/cancel'),
}

export default api
