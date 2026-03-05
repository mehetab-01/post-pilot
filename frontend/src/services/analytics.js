import api from './api'

export async function getOverview() {
  const res = await api.get('/api/analytics/overview')
  return res.data
}

export async function getAnalyticsPosts(sort = 'engagement') {
  const res = await api.get('/api/analytics/posts', { params: { sort } })
  return res.data
}

export async function getTrends() {
  const res = await api.get('/api/analytics/trends')
  return res.data
}
