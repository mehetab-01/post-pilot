import { generateApi, postApi, mediaApi } from './api'

/**
 * Generate posts for multiple platforms.
 * @param {string} context
 * @param {object} platforms  e.g. { twitter: { tone: 'casual', thread: false }, … }
 * @param {string|null} additionalInstructions
 * @param {number[]} mediaIds  IDs of already-uploaded Media records
 * @returns {Promise<{ generated: Array, posting_tips: object }>}
 */
export async function generatePosts(context, platforms, additionalInstructions = null, mediaIds = []) {
  const res = await generateApi.generate(context, platforms, additionalInstructions)
  return res.data
}

/**
 * Regenerate the post for a single platform.
 */
export async function regeneratePost(platform, context, tone, options = {}) {
  const res = await generateApi.regenerate(platform, context, tone, options)
  return res.data
}

/**
 * Enhance an existing post.
 */
export async function enhancePost(platform, content, tone, additionalInstructions = null) {
  const res = await generateApi.enhance(platform, content, tone, additionalInstructions)
  return res.data
}

/**
 * Humanize an existing post.
 */
export async function humanizePost(platform, content, tone) {
  const res = await generateApi.humanize(platform, content, tone)
  return res.data
}

/**
 * Post directly to a single platform.
 */
export async function postToPlatform(platform, content, mediaIds = [], options = {}, postId = null) {
  const res = await postApi.postToPlatform(platform, content, postId, mediaIds, options)
  return res.data
}

/**
 * Post to all platforms at once.
 * @param {object} posts  e.g. { twitter: { content, media_ids, options, post_id }, … }
 */
export async function postToAll(posts) {
  const res = await postApi.postAll(posts)
  return res.data
}

/**
 * Upload a media file and return the created Media record.
 */
export async function uploadMedia(file) {
  const res = await mediaApi.upload(file)
  return res.data
}
