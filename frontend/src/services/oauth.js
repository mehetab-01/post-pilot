import api from './api'

const base = '/api/oauth'

/** Returns {redirect_url} — caller should do window.location.href = redirect_url */
export const getAuthorizeUrl = (platform) =>
  api.get(`${base}/${platform}/authorize`).then((r) => r.data.redirect_url)

/** Returns {linkedin:{connected,username}, reddit:{connected,username}, twitter:{connected,username}} */
export const getConnections = () =>
  api.get(`${base}/connections`).then((r) => r.data)

/** Disconnect a platform */
export const disconnectPlatform = (platform) =>
  api.delete(`${base}/${platform}`).then((r) => r.data)

/** Refresh X/Twitter OAuth 2.0 tokens (expire every 2h) */
export const refreshTwitterToken = () =>
  api.post(`${base}/twitter/refresh`).then((r) => r.data)

/** Connect Bluesky with handle + app password */
export const connectBluesky = (handle, appPassword) =>
  api.post(`${base}/bluesky/connect`, { handle, app_password: appPassword }).then((r) => r.data)

/** Start Mastodon OAuth — returns {redirect_url} for the specified instance */
export const authorizeMastodon = (instanceUrl) =>
  api.post(`${base}/mastodon/authorize`, { instance_url: instanceUrl }).then((r) => r.data.redirect_url)
