import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listTransactions } from '../api'
import { formatEuro, formatDateTime } from '../utils'
import { Badge, CopyableId, DataTable, DataTableRow } from '../components'
import styles from './TransactionsPage.module.css'
import type { Transaction, TransactionType, TransactionsFilter } from '../types'

const PAGE_LIMIT = 10

export default function TransactionsPage() {
  const { t } = useTranslation()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<TransactionsFilter>({ page: 1, limit: PAGE_LIMIT, type: '', id: '' })

  const fetch = useCallback(async (f: TransactionsFilter) => {
    setLoading(true)
    setError(null)
    try {
      const res = await listTransactions(f)
      setTransactions(res.data)
      setTotal(res.total)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetch(filter) }, [filter, fetch])

  const typeOptions: Array<{ value: TransactionType | ''; label: string }> = [
    { value: '', label: t('transactions.all') },
    { value: 'bet', label: t('transactions.bet') },
    { value: 'win', label: t('transactions.win') },
    { value: 'cancel', label: t('transactions.cancel') },
  ]

  const isCredit = (type: TransactionType) => type === 'win' || type === 'cancel'

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('transactions.title')}</h1>

      <div className={styles.filters}>
        <select
          value={filter.type}
          onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value as TransactionType | '', page: 1 }))}
          className={styles.select}
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder={t('transactions.filterById')}
          value={filter.id}
          onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value, page: 1 }))}
          className={styles.searchInput}
        />
      </div>

      <DataTable
        columns={[
          { label: t('transactions.id') },
          { label: t('transactions.date') },
          { label: t('transactions.type'), align: 'center' },
          { label: t('transactions.amount'), align: 'right' },
        ]}
        loading={loading}
        error={error}
        onRetry={() => fetch(filter)}
        retryLabel={t('common.retry')}
        isEmpty={transactions.length === 0}
        emptyMessage={t('transactions.noTransactions')}
        page={filter.page}
        total={total}
        limit={PAGE_LIMIT}
        onPageChange={(p) => setFilter((f) => ({ ...f, page: p }))}
      >
        {transactions.map((tx) => (
          <DataTableRow key={tx.id}>
            <td className={styles.cellId}><CopyableId value={tx.id} /></td>
            <td className={styles.cellDate}>{formatDateTime(tx.createdAt)}</td>
            <td className={styles.cellCenter}>
              <Badge variant={tx.type}>{t(`transactions.${tx.type}`)}</Badge>
            </td>
            <td className={isCredit(tx.type) ? styles.cellAmountCredit : styles.cellAmountDebit}>
              {isCredit(tx.type) ? '+' : '-'}{formatEuro(tx.amount)}
            </td>
          </DataTableRow>
        ))}
      </DataTable>
    </div>
  )
}
