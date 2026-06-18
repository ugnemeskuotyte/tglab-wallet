import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

const PENDING_DURATION = 5000
const WS_RECONNECT_DELAY = 3000

function getWsUrl(token: string): string {
  const wsBase = import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws')
  return `${wsBase}/ws?token=${token}`
}

interface WalletContextValue {
  balance: number
  pendingBetIds: string[]
  updateBalance: (balance: number) => void
  addPendingBet: (id: string, finalBalance: number) => void
  removePendingBet: (id: string) => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const accessToken = user?.accessToken

  const [balance, setBalance] = useState(0)
  const [pendingBetIds, setPendingBetIds] = useState<string[]>([])
  const pendingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    setBalance(user?.balance ?? 0)
    if (!user) {
      Object.values(pendingTimers.current).forEach(clearTimeout)
      pendingTimers.current = {}
      setPendingBetIds([])
    }
  }, [user])

  const updateBalance = useCallback((next: number) => {
    setBalance(next)
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
    <WalletContext.Provider value={{ balance, pendingBetIds, updateBalance, addPendingBet, removePendingBet }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
