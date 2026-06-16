import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={clsx(styles.input, error && styles.inputError, className)}
        />
        {error && <p className={styles.error}>{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
