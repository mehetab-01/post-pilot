import { settingsApi, historyApi } from './api'

export async function saveKeys(platform, keys) {
  const res = await settingsApi.saveKeys(platform, keys)
  return res.data
}

export async function getKeys() {
  const res = await settingsApi.getKeys()
  // Normalize: backend may return { platform: { key_name: masked } }
  return res.data ?? {}
}

export async function testConnection(platform) {
  const res = await settingsApi.testConnection(platform)
  return res.data // { success: bool, message: string }
}

export async function deleteKeys(platform) {
  const res = await settingsApi.deleteKeys(platform)
  return res.data
}

export async function exportData() {
  const res = await historyApi.list(1000, 0)
  const data = res.data
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `postpilot-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
