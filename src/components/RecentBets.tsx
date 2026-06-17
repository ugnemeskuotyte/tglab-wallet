import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listBets, cancelBet } from '../api/bets'
import { useAuth } from '../context/AuthContext'
import { formatEuro } from '../utils/currency'
import { getErrorMessage } from '../utils/error'
import { Badge, Button, Spinner } from './ui'
import styles from './RecentBets.module.css'
import type { Bet } from '../types'

const RECENT_LIMIT = 5

export default function RecentBets() {
  const { t } = useTranslation()
  const { pendingBetIds, removePendingBet, updateBalance } = useAuth()

  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const fetchBets = useCallback(async () => {
    try {
      const res = await listBets({ page: 1, limit: RECENT_LIMIT, status: '', id: '' })
      setBets(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBets() }, [fetchBets, pendingBetIds])

  async function handleCancel(id: string) {
    setCancelingId(id)
    try {
      const res = await cancelBet(id)
      updateBalance(res.balance)
      removePendingBet(id)
      fetchBets()
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('common.error')))
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{t('dashboard.recentBets')}</h2>
      {loading ? (
        <div className={styles.centered}><Spinner className="h-5 w-5" /></div>
      ) : bets.length === 0 ? (
        <p className={styles.empty}>{t('bets.noBets')}</p>
      ) : (
        <ul className={styles.list}>
          {bets.map((bet) => (
            <li key={bet.id} className={styles.row}>
              {pendingBetIds.includes(bet.id) ? (
                <span className={styles.amount}>{formatEuro(bet.amount)}</span>
              ) : bet.status === 'win' ? (
                <span className={styles.amountWin}>+{formatEuro(bet.winAmount ?? bet.amount)}</span>
              ) : bet.status === 'lost' ? (
                <span className={styles.amountLost}>-{formatEuro(bet.amount)}</span>
              ) : (
                <span className={styles.amount}>{formatEuro(bet.amount)}</span>
              )}
              {pendingBetIds.includes(bet.id) ? (
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancelingId === bet.id}
                  onClick={() => handleCancel(bet.id)}
                >
                  {t('bets.cancel')}
                </Button>
              ) : (
                <Badge variant={bet.status}>{t(`bets.${bet.status}`)}</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
