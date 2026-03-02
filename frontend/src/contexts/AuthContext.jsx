import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi, clearToken, setToken } from '@/services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: validate stored token by fetching /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('postpilot_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => clearToken())
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password)
    setToken(res.data.access_token)
    const meRes = await authApi.me()
    setUser(meRes.data)
    return meRes.data
  }, [])

  const register = useCallback(async (username, password, email) => {
    const res = await authApi.register(username, password, email)
    setToken(res.data.access_token)
    const meRes = await authApi.me()
    setUser(meRes.data)
    return meRes.data
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
