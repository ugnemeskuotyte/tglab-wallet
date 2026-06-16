import { useTranslation } from 'react-i18next'
import styles from './Pagination.module.css'
import Button from './Button'

interface PaginationProps {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export default function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const { t } = useTranslation()
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  return (
    <div className={styles.wrapper}>
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t('common.previous')}
      </Button>
      <span className={styles.info}>
        {t('common.page')} {page} {t('common.of')} {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {t('common.next')}
      </Button>
    </div>
  )
}
