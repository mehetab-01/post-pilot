import api from './api'

export async function generateIdeas(niche, platforms) {
  const { data } = await api.post('/api/ideas', { niche, platforms })
  return data
}
