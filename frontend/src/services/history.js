import { historyApi } from './api'

export async function getHistory(limit = 100, offset = 0) {
  const res = await historyApi.list(limit, offset)
  return res.data // { items: [...], total }
}

export async function getPost(id) {
  const res = await historyApi.get(id)
  return res.data
}

export async function deletePost(id) {
  const res = await historyApi.delete(id)
  return res.data
}
