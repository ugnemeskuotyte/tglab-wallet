import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { placeBet } from '../api'
import { useAuth, useWallet } from '../context'
import { formatEuro, getErrorMessage } from '../utils'
import { Input, Button, Toast, RecentBets } from '../components'
import styles from './DashboardPage.module.css'

function buildSchema(balance: number, t: (k: string) => string) {
  return z.object({
    amount: z.preprocess(
      (val) => (typeof val === 'number' && Number.isNaN(val) ? 0 : val),
      z
        .number({ message: t('validation.betNumber') })
        .min(1, t('validation.betMin'))
        .max(balance, t('dashboard.maxBet')),
    ),
  })
}

type Schema = ReturnType<typeof buildSchema>
type FormInput = z.input<Schema>
type FormOutput = z.output<Schema>

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { balance, updateBalance, addPendingBet } = useWallet()
  const [toast, setToast] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const schema = buildSchema(balance, t)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormOutput) {
    setApiError(null)
    try {
      const res = await placeBet(data.amount)
      updateBalance(balance - data.amount)
      addPendingBet(res.transactionId, res.balance)
      setToast(t('dashboard.betSuccess'))
      reset()
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, t('common.error')))
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.main}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.balanceCard}
          >
            <p className={styles.balanceLabel}>{t('dashboard.balance')}</p>
            <motion.p
              key={balance}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className={styles.balanceAmount}
            >
              {formatEuro(balance)}
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

            <Toast message={toast} onClose={() => setToast(null)} />
          </div>
        </div>

        <RecentBets />
      </div>
    </div>
  )
}
