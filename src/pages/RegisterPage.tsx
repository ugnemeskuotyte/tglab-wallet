import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { register as registerUser, login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Input, Button } from '../components'
import { getErrorMessage } from '../utils/error'
import styles from './RegisterPage.module.css'

const schema = z
  .object({
    name: z.string().min(1, 'validation.required'),
    email: z.string().min(1, 'validation.required').email('validation.emailInvalid'),
    password: z.string().min(6, 'validation.passwordMin'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'validation.passwordMatch',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
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
      await registerUser(data)
      const user = await login({ email: data.email, password: data.password })
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
          <span className={styles.logoAccent}>tg</span>
          <span className={styles.logoText}>Wallet</span>
          <p className={styles.subtitle}>{t('auth.register')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Input
            label={t('auth.name')}
            type="text"
            autoComplete="name"
            {...register('name')}
            error={errors.name ? t(errors.name.message as string) : undefined}
          />
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
            autoComplete="new-password"
            {...register('password')}
            error={errors.password ? t(errors.password.message as string) : undefined}
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword ? t(errors.confirmPassword.message as string) : undefined}
          />

          {errors.root && (
            <p className={styles.apiError}>{errors.root.message}</p>
          )}

          <Button type="submit" size="lg" loading={isSubmitting} className={styles.submitBtn}>
            {t('auth.registerBtn')}
          </Button>
        </form>

        <p className={styles.footer}>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className={styles.footerLink}>
            {t('auth.loginBtn')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
