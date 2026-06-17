import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import type { User } from '../types'

const PENDING_DURATION = 5000
const WS_RECONNECT_DELAY = 3000

function getWsUrl(token: string): string {
  const wsBase = import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws')
  return `${wsBase}/ws?token=${token}`
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  pendingBetIds: string[]
  login: (user: User) => void
  logout: () => void
  updateBalance: (balance: number) => void
  addPendingBet: (id: string, finalBalance: number) => void
  removePendingBet: (id: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)
  const [pendingBetIds, setPendingBetIds] = useState<string[]>([])
  const pendingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const login = useCallback((userData: User) => {
    localStorage.setItem('accessToken', userData.accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const updateBalance = useCallback((balance: number) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, balance }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removePendingBet = useCallback((id: string) => {
    clearTimeout(pendingTimers.current[id])
    delete pendingTimers.current[id]
    setPendingBetIds((prev) => prev.filter((pid) => pid !== id))
  }, [])

  const addPendingBet = useCallback((id: string, finalBalance: number) => {
    setPendingBetIds((prev) => [...prev, id])
    pendingTimers.current[id] = setTimeout(() => {
      updateBalance(finalBalance)
      setPendingBetIds((prev) => prev.filter((pid) => pid !== id))
      delete pendingTimers.current[id]
    }, PENDING_DURATION)
  }, [updateBalance])

  const accessToken = user?.accessToken

  useEffect(() => {
    if (!accessToken) return

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout>
    let stopped = false

    function connect() {
      socket = new WebSocket(getWsUrl(accessToken!))

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data) as { type: string; balance: number }
        if (data.type === 'balance') updateBalance(data.balance)
      }

      socket.onclose = () => {
        if (!stopped) reconnectTimer = setTimeout(connect, WS_RECONNECT_DELAY)
      }
    }

    connect()

    return () => {
      stopped = true
      clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [accessToken, updateBalance])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, pendingBetIds, login, logout, updateBalance, addPendingBet, removePendingBet }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
