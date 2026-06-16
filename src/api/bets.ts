import client from './client'
import type { BetResult, CancelBetResult, PaginatedResponse, Bet, BetsFilter } from '../types'

export async function placeBet(amount: number): Promise<BetResult> {
  const { data } = await client.post('/bet', { amount })
  return data
}

export async function listBets(filter: BetsFilter): Promise<PaginatedResponse<Bet>> {
  const params: Record<string, string | number> = {
    page: filter.page,
    limit: filter.limit,
  }
  if (filter.status) params.status = filter.status
  if (filter.id) params.id = filter.id
  const { data } = await client.get('/my-bets', { params })
  return data
}

export async function cancelBet(id: string): Promise<CancelBetResult> {
  const { data } = await client.delete(`/my-bet/${id}`)
  return data
}
