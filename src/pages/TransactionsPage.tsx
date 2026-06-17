import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { listTransactions } from '../api/transactions'
import { formatEuro } from '../utils/currency'
import { formatDateTime } from '../utils/date'
import { Badge, Button, CopyableId, Pagination, Spinner } from '../components'
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

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.centered}><Spinner /></div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <Button variant="secondary" onClick={() => fetch(filter)}>{t('common.retry')}</Button>
          </div>
        ) : transactions.length === 0 ? (
          <p className={styles.empty}>{t('transactions.noTransactions')}</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.thLeft}>{t('transactions.id')}</th>
                  <th className={styles.thLeft}>{t('transactions.date')}</th>
                  <th className={styles.thCenter}>{t('transactions.type')}</th>
                  <th className={styles.thRight}>{t('transactions.amount')}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {transactions.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={styles.row}
                    >
                      <td className={styles.cellId}><CopyableId value={tx.id} /></td>
                      <td className={styles.cellDate}>{formatDateTime(tx.createdAt)}</td>
                      <td className={styles.cellCenter}>
                        <Badge variant={tx.type}>{t(`transactions.${tx.type}`)}</Badge>
                      </td>
                      <td className={isCredit(tx.type) ? styles.cellAmountCredit : styles.cellAmountDebit}>
                        {isCredit(tx.type) ? '+' : '-'}{formatEuro(tx.amount)}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className={styles.paginationWrapper}>
            <Pagination page={filter.page} total={total} limit={PAGE_LIMIT} onChange={(p) => setFilter((f) => ({ ...f, page: p }))} />
          </div>
        )}
      </div>
    </div>
  )
}
