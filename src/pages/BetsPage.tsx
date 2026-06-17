import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { listBets, cancelBet } from '../api/bets'
import { useAuth } from '../context/AuthContext'
import { formatEuro } from '../utils/currency'
import { formatDateTime } from '../utils/date'
import { Badge, Button, CopyableId, Pagination, Spinner } from '../components'
import { getErrorMessage } from '../utils/error'
import styles from './BetsPage.module.css'
import type { Bet, BetStatus, BetsFilter } from '../types'

const PAGE_LIMIT = 10

export default function BetsPage() {
  const { t } = useTranslation()
  const { updateBalance, pendingBetIds, removePendingBet } = useAuth()

  const [bets, setBets] = useState<Bet[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const [filter, setFilter] = useState<BetsFilter>({ page: 1, limit: PAGE_LIMIT, status: '', id: '' })

  const fetch = useCallback(async (f: BetsFilter) => {
    setLoading(true)
    setError(null)
    try {
      const res = await listBets(f)
      setBets(res.data)
      setTotal(res.total)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetch(filter) }, [filter, fetch])

  async function handleCancel(id: string) {
    setCancelingId(id)
    try {
      const res = await cancelBet(id)
      updateBalance(res.balance)
      removePendingBet(id)
      fetch(filter)
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('common.error')))
    } finally {
      setCancelingId(null)
    }
  }

  const statusOptions: Array<{ value: BetStatus | ''; label: string }> = [
    { value: '', label: t('bets.all') },
    { value: 'win', label: t('bets.win') },
    { value: 'lost', label: t('bets.lost') },
    { value: 'canceled', label: t('bets.canceled') },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('bets.title')}</h1>

      <div className={styles.filters}>
        <select
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value as BetStatus | '', page: 1 }))}
          className={styles.select}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder={t('bets.filterById')}
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
        ) : bets.length === 0 ? (
          <p className={styles.empty}>{t('bets.noBets')}</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.thLeft}>{t('bets.id')}</th>
                  <th className={styles.thLeft}>{t('bets.date')}</th>
                  <th className={styles.thRight}>{t('bets.amount')}</th>
                  <th className={styles.thCenter}>{t('bets.status')}</th>
                  <th className={styles.thRight}>{t('bets.prize')}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {bets.map((bet) => (
                    <motion.tr
                      key={bet.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={styles.row}
                    >
                      <td className={styles.cellId}><CopyableId value={bet.id} /></td>
                      <td className={styles.cellDate}>{formatDateTime(bet.createdAt)}</td>
                      <td className={styles.cellAmount}>{formatEuro(bet.amount)}</td>
                      <td className={styles.cellCenter}>
                        {pendingBetIds.includes(bet.id) ? (
                          <div className={styles.pendingCell}>
                            <Badge variant="pending">{t('bets.pending')}</Badge>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={cancelingId === bet.id}
                              onClick={() => handleCancel(bet.id)}
                            >
                              {t('bets.cancel')}
                            </Button>
                          </div>
                        ) : (
                          <Badge variant={bet.status}>{t(`bets.${bet.status}`)}</Badge>
                        )}
                      </td>
                      <td className={styles.cellPrize}>{bet.winAmount && bet.status !== 'canceled' && !pendingBetIds.includes(bet.id) ? formatEuro(bet.winAmount) : '—'}</td>
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
