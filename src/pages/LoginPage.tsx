import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Input, Button } from '../components'
import { getErrorMessage } from '../utils/error'
import styles from './LoginPage.module.css'

const schema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.emailInvalid'),
  password: z.string().min(1, 'validation.required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { t } = useTranslation()
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      const user = await login(data)
      setAuth(user)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err, t('common.error')) })
    }
  }

  return (
    <div className={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={styles.card}
      >
        <div className={styles.logoWrapper}>
          <span className={styles.logoAccent}>my</span>
          <span className={styles.logoText}>Wallet</span>
          <p className={styles.subtitle}>{t('auth.login')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Input
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            {...register('email')}
            error={errors.email ? t(errors.email.message as string) : undefined}
          />
          <Input
            label={t('auth.password')}
            type="password"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password ? t(errors.password.message as string) : undefined}
          />

          {errors.root && (
            <p className={styles.apiError}>{errors.root.message}</p>
          )}

          <Button type="submit" size="lg" loading={isSubmitting} className={styles.submitBtn}>
            {t('auth.loginBtn')}
          </Button>
        </form>

        <p className={styles.footer}>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className={styles.footerLink}>
            {t('auth.registerBtn')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
