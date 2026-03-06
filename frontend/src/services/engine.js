import api from './api'

export const engineApi = {
  generateWeek: (data) => api.post('/api/engine/generate-week', data),
  regenerateDay: (data) => api.post('/api/engine/regenerate-day', data),
  scheduleWeek: (data) => api.post('/api/engine/schedule-week', data),
  listPlans: () => api.get('/api/engine/plans'),
}
