export type BetStatus = 'win' | 'lost' | 'canceled' | 'pending'
export type TransactionType = 'bet' | 'win' | 'cancel'

export interface User {
  id: string
  name: string
  balance: number
  currency: string
  accessToken: string
}

export interface Bet {
  id: string
  amount: number
  status: BetStatus
  createdAt: string
  winAmount: number | null
}

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface BetResult {
  transactionId: string
  currency: string
  balance: number
  winAmount: number | null
}

export interface CancelBetResult {
  transactionId: string
  balance: number
  currency: string
}

export interface BetsFilter {
  status?: BetStatus | ''
  id?: string
  page: number
  limit: number
}

export interface TransactionsFilter {
  type?: TransactionType | ''
  id?: string
  page: number
  limit: number
}
