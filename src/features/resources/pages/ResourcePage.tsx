import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DatePicker, Input, InputNumber, Select, Switch } from 'antd'
import dayjs from 'dayjs'
import { Edit3, Plus, RadioTower, RefreshCw, Repeat2, Save, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable'
import { FormModal } from '../../../components/ui/FormModal'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SearchInput } from '../../../components/ui/SearchInput'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePermissionHelpers } from '../../access/permissions'
import { dispatchAssignment, retryAssignment } from '../../assignments/assignment.api'
import {
  createMasterRecord,
  deleteMasterRecord,
  fetchMasterRecords,
  updateMasterRecord,
} from '../../masters/masters.api'
import type { MasterFieldConfig } from '../../masters/masters.types'
import { resourceConfigByKey, resourceConfigs } from '../resource.config'
import type { ResourceConfig, ResourceRecord } from '../resource.types'

interface ResourcePageProps {
  resourceKey: string
}

const getRecordId = (record: ResourceRecord): number | string =>
  Number(record.iMasterId ?? record.iTransId ?? record.id ?? 0)

const getInitialValue = (field: MasterFieldConfig): unknown => {
  if (field.type === 'boolean') {
    return field.name === 'isActive'
  }

  if (field.type === 'enum') {
    return field.options?.[0]?.value
  }

  return undefined
}

const buildInitialForm = (config: ResourceConfig): Record<string, unknown> =>
  Object.fromEntries(config.fields.map((field) => [field.name, getInitialValue(field)]))

const buildEditForm = (config: ResourceConfig, record: ResourceRecord): Record<string, unknown> =>
  Object.fromEntries(config.fields.map((field) => [field.name, record[field.name] ?? getInitialValue(field)]))

const normalizePayload = (
  form: Record<string, unknown>,
  config: ResourceConfig,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {}

  config.fields.forEach((field) => {
    const value = form[field.name]

    if (value === undefined || value === null || value === '') {
      if (field.allowEmpty) {
        payload[field.name] = null
      }

      return
    }

    if (field.type === 'date') {
      payload[field.name] = new Date(String(value)).toISOString()
      return
    }

    payload[field.name] = value
  })

  return payload
}

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

const formatDate = (value: unknown, withTime = false): string => {
  if (!value) {
    return '-'
  }

  return new Date(String(value)).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

const formatCurrency = (value: unknown): string => {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const renderResourceValue = (record: ResourceRecord, key: string, format?: string) => {
  const value = record[key]

  if (format === 'boolean' || typeof value === 'boolean') {
    return <StatusBadge value={value} />
  }

  if (format === 'status') {
    return <StatusBadge value={value} />
  }

  if (format === 'date') {
    return formatDate(value)
  }

  if (format === 'datetime') {
    return formatDate(value, true)
  }

  if (format === 'currency') {
    return formatCurrency(value)
  }

  return stringifyValue(value)
}

const recordMatchesSearch = (record: ResourceRecord, search: string): boolean => {
  if (!search.trim()) {
    return true
  }

  const normalized = search.trim().toLowerCase()
  return Object.values(record).some((value) => stringifyValue(value).toLowerCase().includes(normalized))
}

export const ResourcePage = ({ resourceKey }: ResourcePageProps) => {
  const requestedConfig = resourceConfigByKey.get(resourceKey)
  const config = requestedConfig ?? resourceConfigs[0]
  const isUnknownResource = !requestedConfig
  const queryClient = useQueryClient()
  const permissions = usePermissionHelpers()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [formError, setFormError] = useState('')
  const [editingRecord, setEditingRecord] = useState<ResourceRecord | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ResourceRecord | null>(null)

  const resourceQuery = useQuery({
    queryKey: ['resource', config.key],
    queryFn: () => fetchMasterRecords(config.endpoint),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createMasterRecord(config.endpoint, payload),
    onSuccess: async () => {
      toast.success(`${config.title} record created.`)
      setIsFormOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['resource', config.key] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : `Unable to save ${config.title}.`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Record<string, unknown> }) =>
      updateMasterRecord(config.endpoint, id, payload),
    onSuccess: async () => {
      toast.success(`${config.title} record updated.`)
      setIsFormOpen(false)
      setEditingRecord(null)
      await queryClient.invalidateQueries({ queryKey: ['resource', config.key] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : `Unable to update ${config.title}.`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (recordId: number | string) => deleteMasterRecord(config.endpoint, recordId),
    onSuccess: async () => {
      toast.success(`${config.title} record deleted.`)
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['resource', config.key] })
    },
  })

  const dispatchMutation = useMutation({
    mutationFn: dispatchAssignment,
    onSuccess: () => toast.success('Assignment dispatch started.'),
  })

  const retryMutation = useMutation({
    mutationFn: retryAssignment,
    onSuccess: () => toast.success('Assignment retry requested.'),
  })

  const records = useMemo(() => resourceQuery.data ?? [], [resourceQuery.data])
  const filteredRecords = useMemo(
    () => records.filter((record) => recordMatchesSearch(record, search)),
    [records, search],
  )
  const canCreate = permissions.canCreate(config.permissionCodeBase)
  const canUpdate = permissions.canUpdate(config.permissionCodeBase)
  const canDelete = permissions.canDelete(config.permissionCodeBase)
  const canAssign = permissions.canAssign(config.permissionCodeBase) || permissions.canUpdate(config.permissionCodeBase)
  const hasActions = canUpdate || canDelete || (config.key === 'booking-assignments' && canAssign)

  const columns = useMemo<DataTableColumn<ResourceRecord>[]>(
    () =>
      config.columns.map((column) => ({
        key: column.key,
        header: column.label,
        render: (record) => renderResourceValue(record, column.key, column.format),
      })),
    [config.columns],
  )

  const openCreateForm = () => {
    setEditingRecord(null)
    setForm(buildInitialForm(config))
    setFormError('')
    setIsFormOpen(true)
  }

  const openEditForm = (record: ResourceRecord) => {
    setEditingRecord(record)
    setForm(buildEditForm(config, record))
    setFormError('')
    setIsFormOpen(true)
  }

  const updateField = (fieldName: string, value: unknown) => {
    setForm((state) => ({
      ...state,
      [fieldName]: value,
    }))
  }

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const missingField = config.fields.find((field) => {
      const value = form[field.name]
      return field.required && (value === undefined || value === null || value === '')
    })

    if (missingField) {
      setFormError(`${missingField.label} is required.`)
      return
    }

    const payload = normalizePayload(form, config)

    if (editingRecord) {
      updateMutation.mutate({ id: getRecordId(editingRecord), payload })
      return
    }

    createMutation.mutate(payload)
  }

  const renderField = (field: MasterFieldConfig) => {
    const value = form[field.name]

    if (field.type === 'textarea') {
      return (
        <Input.TextArea
          className="resource-ant-textarea"
          placeholder={field.placeholder ?? field.label}
          value={typeof value === 'string' ? value : undefined}
          onChange={(event) => updateField(field.name, event.target.value)}
        />
      )
    }

    if (field.type === 'number') {
      return (
        <InputNumber
          className="resource-ant-number"
          placeholder={field.placeholder ?? field.label}
          value={typeof value === 'number' ? value : value ? Number(value) : undefined}
          onChange={(nextValue) => updateField(field.name, nextValue ?? undefined)}
        />
      )
    }

    if (field.type === 'boolean') {
      const checked = value === true

      return (
        <div className="resource-switch-row">
          <Switch checked={checked} onChange={(nextChecked) => updateField(field.name, nextChecked)} />
          <span>{checked ? 'Yes' : 'No'}</span>
        </div>
      )
    }

    if (field.type === 'date') {
      return (
        <DatePicker
          className="resource-ant-picker"
          popupClassName="employees-ant-dropdown"
          value={value ? dayjs(String(value)) : null}
          onChange={(_, dateString) =>
            updateField(field.name, Array.isArray(dateString) ? dateString[0] : dateString)
          }
        />
      )
    }

    if (field.type === 'time') {
      return (
        <Input
          className="resource-ant-input"
          type="time"
          value={typeof value === 'string' ? value : undefined}
          onChange={(event) => updateField(field.name, event.target.value)}
        />
      )
    }

    if (field.type === 'enum') {
      return (
        <Select
          className="resource-ant-select"
          popupClassName="employees-ant-dropdown"
          placeholder={field.placeholder ?? field.label}
          value={value === undefined ? undefined : value}
          options={field.options ?? []}
          onChange={(nextValue) => updateField(field.name, nextValue)}
          allowClear={!field.required}
        />
      )
    }

    return (
      <Input
        className="resource-ant-input"
        placeholder={field.placeholder ?? field.label}
        value={typeof value === 'string' ? value : undefined}
        onChange={(event) => updateField(field.name, event.target.value)}
      />
    )
  }

  const renderActions = (record: ResourceRecord) => {
    const bookingId = Number(record.iBookingTransId)

    return (
      <div className="row-actions">
        {config.key === 'booking-assignments' && canAssign && Number.isFinite(bookingId) ? (
          <>
            <button
              type="button"
              className="table-action-btn"
              onClick={() => dispatchMutation.mutate(bookingId)}
              disabled={dispatchMutation.isPending}
            >
              <RadioTower size={14} />
              Dispatch
            </button>
            <button
              type="button"
              className="table-action-btn"
              onClick={() => retryMutation.mutate(bookingId)}
              disabled={retryMutation.isPending}
            >
              <Repeat2 size={14} />
              Retry
            </button>
          </>
        ) : null}
        {canUpdate ? (
          <button type="button" className="table-icon-btn" onClick={() => openEditForm(record)} aria-label="Edit">
            <Edit3 size={14} />
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            className="table-icon-btn danger"
            onClick={() => setDeleteTarget(record)}
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <section className="resource-page">
      <PageHeader
        eyebrow={config.group}
        title={isUnknownResource ? 'Module not found' : config.title}
        description={
          isUnknownResource
            ? 'This dashboard module is not configured yet.'
            : config.description
        }
        icon={config.icon}
        actions={
          <>
            <button type="button" className="secondary-btn" onClick={() => resourceQuery.refetch()}>
              <RefreshCw size={15} />
              Refresh
            </button>
            {canCreate ? (
              <button type="button" className="primary-btn" onClick={openCreateForm}>
                <Plus size={15} />
                Add {config.title}
              </button>
            ) : null}
          </>
        }
      />

      <div className="resource-toolbar">
        <SearchInput value={search} placeholder={`Search ${config.title.toLowerCase()}...`} onChange={setSearch} />
        <span className="resource-count">{filteredRecords.length} visible records</span>
      </div>

      <DataTable
        columns={columns}
        data={filteredRecords}
        rowKey={(record) => getRecordId(record)}
        isLoading={resourceQuery.isLoading}
        error={resourceQuery.isError ? (resourceQuery.error as Error).message : undefined}
        actions={hasActions ? renderActions : undefined}
        emptyTitle={`No ${config.title.toLowerCase()} found`}
        emptyDescription="Create a record or adjust the search filter."
      />

      <FormModal
        open={isFormOpen}
        title={editingRecord ? `Edit ${config.title}` : `Create ${config.title}`}
        description="Fields follow the backend naming style, including iMasterId/iTransId relationships."
        onClose={() => setIsFormOpen(false)}
      >
        <form className="resource-form" onSubmit={submitForm}>
          {config.fields.map((field) => (
            <label key={field.name} className={field.type === 'textarea' ? 'wide' : undefined}>
              <span>
                {field.label}
                {field.required ? ' *' : ''}
              </span>
              {renderField(field)}
            </label>
          ))}

          {formError ? <p className="resource-form-error">{formError}</p> : null}

          <div className="modal-actions wide">
            <button type="button" className="secondary-btn" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save size={15} />
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${config.title} record?`}
        description="This will call the backend delete endpoint. Most Jiffit APIs soft-delete records."
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        isDanger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(getRecordId(deleteTarget))
          }
        }}
      />
    </section>
  )
}
