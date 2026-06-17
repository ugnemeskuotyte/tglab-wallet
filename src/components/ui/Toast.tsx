import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Toast.module.css'

interface ToastProps {
  message: string | null
  onClose: () => void
  duration?: number
}

export default function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={styles.toast}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
