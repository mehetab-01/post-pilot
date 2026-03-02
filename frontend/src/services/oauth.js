import api from './api'

const base = '/api/oauth'

/** Returns {redirect_url} — caller should do window.location.href = redirect_url */
export const getAuthorizeUrl = (platform) =>
  api.get(`${base}/${platform}/authorize`).then((r) => r.data.redirect_url)

/** Returns {linkedin:{connected,username}, reddit:{connected,username}} */
export const getConnections = () =>
  api.get(`${base}/connections`).then((r) => r.data)

/** Disconnect a platform */
export const disconnectPlatform = (platform) =>
  api.delete(`${base}/${platform}`).then((r) => r.data)
