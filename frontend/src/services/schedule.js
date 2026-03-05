import api from './api'

const base = '/api/schedule'

/** Create a scheduled post (Pro-only) */
export const createScheduledPost = (data) =>
  api.post(base, data).then((r) => r.data)

/** List scheduled posts with optional status filter */
export const listScheduledPosts = (status) => {
  const params = status ? { status } : {}
  return api.get(base, { params }).then((r) => r.data)
}

/** Cancel a pending scheduled post */
export const cancelScheduledPost = (id) =>
  api.delete(`${base}/${id}`).then((r) => r.data)

/** Reschedule a post to a new time */
export const reschedulePost = (id, scheduledAt) =>
  api.patch(`${base}/${id}`, { scheduled_at: scheduledAt }).then((r) => r.data)

/** Retry a failed scheduled post */
export const retryScheduledPost = (id) =>
  api.post(`${base}/${id}/retry`).then((r) => r.data)
