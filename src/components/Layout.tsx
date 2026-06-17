import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { formatEuro } from '../utils/currency'
import styles from './Layout.module.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function toggleLang() {
    const next = i18n.language === 'en' ? 'lt' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(styles.navLink, isActive && styles.navLinkActive)

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(styles.mobileNavLink, isActive && styles.mobileNavLinkActive)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <span className={styles.logo}>my</span>
            <span className={styles.logoText}>Wallet</span>
          </div>

          <nav className={styles.desktopNav}>
            <NavLink to="/" end className={navLinkClass}>{t('nav.dashboard')}</NavLink>
            <NavLink to="/bets" className={navLinkClass}>{t('nav.bets')}</NavLink>
            <NavLink to="/transactions" className={navLinkClass}>{t('nav.transactions')}</NavLink>
          </nav>

          <div className={styles.headerActions}>
            <div className={styles.balanceCard}>
              <p className={styles.balanceName}>{user?.name}</p>
              <p className={styles.balanceAmount}>{formatEuro(user?.balance ?? 0)}</p>
            </div>

            <button onClick={toggleLang} className={styles.langBtn} aria-label="Toggle language">
              {i18n.language === 'en' ? 'EN' : 'LT'}
            </button>

            <button onClick={toggleTheme} className={styles.iconBtn} aria-label="Toggle theme">
              {theme === 'light' ? (
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            <button onClick={handleLogout} className={styles.logoutBtn}>
              {t('nav.logout')}
            </button>
          </div>
        </div>

        <nav className={styles.mobileNav}>
          <NavLink to="/" end className={mobileNavLinkClass}>{t('nav.dashboard')}</NavLink>
          <NavLink to="/bets" className={mobileNavLinkClass}>{t('nav.bets')}</NavLink>
          <NavLink to="/transactions" className={mobileNavLinkClass}>{t('nav.transactions')}</NavLink>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
