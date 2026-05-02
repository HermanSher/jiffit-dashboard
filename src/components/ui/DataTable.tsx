import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { LoadingSkeleton } from './LoadingSkeleton'

export interface DataTableColumn<TRecord> {
  key: string
  header: string
  render?: (record: TRecord) => ReactNode
}

interface DataTableProps<TRecord> {
  columns: DataTableColumn<TRecord>[]
  data: TRecord[]
  rowKey: (record: TRecord) => string | number
  isLoading?: boolean
  error?: string
  actions?: (record: TRecord) => ReactNode
  emptyTitle?: string
  emptyDescription?: string
}

export const DataTable = <TRecord,>({
  columns,
  data,
  rowKey,
  isLoading = false,
  error,
  actions,
  emptyTitle,
  emptyDescription,
}: DataTableProps<TRecord>) => (
  <div className="data-table-shell">
    {isLoading ? (
      <LoadingSkeleton rows={6} />
    ) : error ? (
      <EmptyState title="Unable to load data" description={error} />
    ) : data.length === 0 ? (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    ) : (
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
              {actions ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.map((record) => (
              <tr key={rowKey(record)}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(record) : null}</td>
                ))}
                {actions ? <td>{actions(record)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)
