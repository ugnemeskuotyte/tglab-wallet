import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { placeBet } from '../api/bets'
import { useAuth } from '../context/AuthContext'
import { formatEuro } from '../utils/currency'
import { Input, Button } from '../components'
import { getErrorMessage } from '../utils/error'
import styles from './DashboardPage.module.css'
import type { BetResult } from '../types'

function buildSchema(balance: number, t: (k: string) => string) {
  return z.object({
    amount: z.preprocess(
      (val) => (typeof val === 'number' && Number.isNaN(val) ? 0 : val),
      z
        .number({ invalid_type_error: t('validation.betNumber') })
        .min(1, t('validation.betMin'))
        .max(balance, t('dashboard.maxBet')),
    ),
  })
}

type FormData = { amount: number }

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user, updateBalance, addPendingBet } = useAuth()
  const [result, setResult] = useState<BetResult | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const schema = buildSchema(user?.balance ?? 0, t)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setApiError(null)
    setResult(null)
    setIsPending(false)
    try {
      const res = await placeBet(data.amount)
      updateBalance((user?.balance ?? 0) - data.amount)
      addPendingBet(res.transactionId, res.balance)
      setIsPending(true)
      reset()
      setTimeout(() => {
        setResult(res)
        setIsPending(false)
      }, 5000)
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, t('common.error')))
    }
  }

  return (
    <div className={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.balanceCard}
      >
        <p className={styles.balanceLabel}>{t('dashboard.balance')}</p>
        <motion.p
          key={user?.balance}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className={styles.balanceAmount}
        >
          {formatEuro(user?.balance ?? 0)}
        </motion.p>
        <p className={styles.balanceName}>{user?.name}</p>
      </motion.div>

      <div className={styles.betCard}>
        <h2 className={styles.betTitle}>{t('dashboard.placeBet')}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Input
            label={t('dashboard.betAmount')}
            type="number"
            step="0.01"
            min="1"
            placeholder="10.00"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
          />

          {apiError && <p className={styles.apiError}>{apiError}</p>}

          <Button type="submit" size="lg" loading={isSubmitting}>
            {isSubmitting ? t('dashboard.betPlacing') : t('dashboard.betBtn')}
          </Button>
        </form>

        <AnimatePresence mode="wait">
          {isPending && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={styles.resultPending}
            >
              <p className={styles.resultEmoji}>⏳</p>
              <p className={styles.resultTitlePending}>{t('dashboard.betPending')}</p>
            </motion.div>
          )}
          {result && !isPending && (
            <motion.div
              key={result.transactionId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={result.winAmount ? styles.resultWin : styles.resultLoss}
            >
              {result.winAmount ? (
                <>
                  <p className={styles.resultEmoji}>🎉</p>
                  <p className={styles.resultTitleWin}>
                    {t('dashboard.youWon')} {formatEuro(result.winAmount)}
                  </p>
                  <p className={`${styles.resultBalance} ${styles.resultBalanceWin}`}>
                    {t('dashboard.balance')}: {formatEuro(result.balance)}
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.resultEmoji}>😔</p>
                  <p className={styles.resultTitleLoss}>{t('dashboard.youLost')}</p>
                  <p className={`${styles.resultBalance} ${styles.resultBalanceLoss}`}>
                    {t('dashboard.balance')}: {formatEuro(result.balance)}
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
