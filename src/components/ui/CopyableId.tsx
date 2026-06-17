import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import styles from './CopyableId.module.css'

interface CopyableIdProps {
  value: string
  className?: string
}

export default function CopyableId({ value, className }: CopyableIdProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={t('common.clickToCopy')}
      className={clsx(styles.base, copied && styles.copied, className)}
    >
      {copied ? t('common.copied') : value}
    </button>
  )
}
