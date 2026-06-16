import client from './client'
import type { PaginatedResponse, Transaction, TransactionsFilter } from '../types'

export async function listTransactions(
  filter: TransactionsFilter
): Promise<PaginatedResponse<Transaction>> {
  const params: Record<string, string | number> = {
    page: filter.page,
    limit: filter.limit,
  }
  if (filter.type) params.type = filter.type
  if (filter.id) params.id = filter.id
  const { data } = await client.get('/my-transactions', { params })
  return data
}
