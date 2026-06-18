import type { ReactNode } from 'react'
import styles from './DataTable.module.css'
import Spinner from './Spinner'
import Button from './Button'
import Pagination from './Pagination'

interface Column {
  label: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps {
  columns: Column[]
  loading: boolean
  error: string | null
  onRetry: () => void
  retryLabel: string
  isEmpty: boolean
  emptyMessage: string
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  children: ReactNode
}

function alignClass(align: Column['align']) {
  if (align === 'right') return styles.thRight
  if (align === 'center') return styles.thCenter
  return styles.thLeft
}

export default function DataTable({
  columns,
  loading,
  error,
  onRetry,
  retryLabel,
  isEmpty,
  emptyMessage,
  page,
  total,
  limit,
  onPageChange,
  children,
}: DataTableProps) {
  // Only show the spinner before any data has ever loaded, so a refetch
  // (filter/page change) doesn't flash the whole table away.
  const showInitialSpinner = loading && isEmpty
  const showTable = !showInitialSpinner && !error && !isEmpty

  return (
    <div className={styles.tableCard}>
      {showInitialSpinner ? (
        <div className={styles.centered}><Spinner /></div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <Button variant="secondary" onClick={onRetry}>{retryLabel}</Button>
        </div>
      ) : isEmpty ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {columns.map((column) => (
                  <th key={column.label} className={alignClass(column.align)}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}

      {showTable && (
        <div className={styles.paginationWrapper}>
          <Pagination page={page} total={total} limit={limit} onChange={onPageChange} />
        </div>
      )}
    </div>
  )
}

export function DataTableRow({ children }: { children: ReactNode }) {
  return <tr className={styles.row}>{children}</tr>
}
