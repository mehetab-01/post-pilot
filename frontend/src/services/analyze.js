import { analyzeApi } from './api'

export async function getHumanizeScore(content, platform) {
  const res = await analyzeApi.humanizeScore(content, platform)
  return res.data
}

export async function getOriginalityScore(content, platform) {
  const res = await analyzeApi.originalityCheck(content, platform)
  return res.data
}
