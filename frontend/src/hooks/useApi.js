import { useState, useCallback } from 'react'

/**
 * Generic hook for making API calls with loading/error state.
 *
 * Usage:
 *   const { execute, data, isLoading, error } = useApi(someApiFunction)
 *   await execute(arg1, arg2)
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await apiFn(...args)
        setData(res.data)
        return res.data
      } catch (err) {
        const message =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          'Something went wrong'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [apiFn]
  )

  return { execute, data, isLoading, error, setData, setError }
}

export default useApi
