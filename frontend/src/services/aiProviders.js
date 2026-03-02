import api from './api'

const base = '/api/ai-providers'

export const getAiProviders = () =>
  api.get(base).then((r) => r.data)

export const addAiProvider = (payload) =>
  api.post(base, payload).then((r) => r.data)

export const updateAiProvider = (id, payload) =>
  api.put(`${base}/${id}`, payload).then((r) => r.data)

export const reorderAiProviders = (items) =>
  api.put(`${base}/reorder`, { items }).then((r) => r.data)

export const deleteAiProvider = (id) =>
  api.delete(`${base}/${id}`).then((r) => r.data)
