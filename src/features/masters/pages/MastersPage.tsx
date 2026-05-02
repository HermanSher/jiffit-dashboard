import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DatePicker, Input, InputNumber, Modal, Select, Switch } from 'antd'
import dayjs from 'dayjs'
import { Database, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { usePermissionHelpers } from '../../access/permissions'
import { createMasterRecord, deleteMasterRecord, fetchMasterRecords } from '../masters.api'
import { masterConfigs } from '../masters.config'
import type { MasterConfig, MasterFieldConfig, MasterRecord } from '../masters.types'

const getRecordId = (record: MasterRecord): number | string =>
  Number(record.iMasterId ?? record.iTransId ?? record.id ?? 0)

const getRecordLabel = (record: MasterRecord): string => {
  const code = record.sCode ? String(record.sCode) : ''
  const name = record.sName ? String(record.sName) : ''
  const username = record.username ? String(record.username) : ''
  const slotName = record.slotName ? String(record.slotName) : ''
  const imageUrl = record.imageUrl ? String(record.imageUrl) : ''
  const primary = [code, name].filter(Boolean).join(' - ')

  return primary || username || slotName || imageUrl || `#${getRecordId(record)}`
}

const getInitialValue = (field: MasterFieldConfig): unknown => {
  if (field.type === 'boolean') {
    return field.name === 'isActive' || field.name === 'isSlotRequired'
  }

  if (field.type === 'number') {
    if (field.name === 'minQuantity') {
      return 1
    }

    if (field.name === 'maxBookings') {
      return 1
    }

    return undefined
  }

  if (field.type === 'enum') {
    return field.options?.[0]?.value
  }

  return undefined
}

const buildInitialForm = (config: MasterConfig): Record<string, unknown> => {
  const form: Record<string, unknown> = {}

  config.fields.forEach((field) => {
    form[field.name] = getInitialValue(field)
  })

  return form
}

const normalizePayload = (
  form: Record<string, unknown>,
  config: MasterConfig,
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

const formatRecordMeta = (record: MasterRecord): string => {
  const active = record.isActive === false ? 'Inactive' : 'Active'
  const id = getRecordId(record)

  return `#${id} - ${active}`
}

const getPermissionBase = (key: string): string => {
  if (key === 'roles') {
    return 'ROLES'
  }

  if (key === 'user-types') {
    return 'USER_TYPES'
  }

  if (key.includes('user') || key.includes('profile')) {
    return 'USERS'
  }

  return 'SERVICES'
}

export const MastersPage = () => {
  const [modal, modalContextHolder] = Modal.useModal()
  const queryClient = useQueryClient()
  const permissions = usePermissionHelpers()
  const [activeKey, setActiveKey] = useState(masterConfigs[0].key)
  const activeConfig = masterConfigs.find((config) => config.key === activeKey) ?? masterConfigs[0]
  const permissionBase = getPermissionBase(activeConfig.key)
  const canCreateActive = permissions.canCreate(permissionBase)
  const canDeleteActive = permissions.canDelete(permissionBase)
  const [form, setForm] = useState<Record<string, unknown>>(buildInitialForm(activeConfig))
  const [formError, setFormError] = useState('')

  const activeRecordsQuery = useQuery({
    queryKey: ['masters', activeConfig.key],
    queryFn: () => fetchMasterRecords(activeConfig.endpoint),
  })

  const sourceQueries = useQuery({
    queryKey: ['masters', 'sources'],
    queryFn: async () => {
      const requiredSourceKeys = [
        ...new Set(
          masterConfigs
            .flatMap((config) => config.fields)
            .map((field) => field.optionSource)
            .filter(Boolean),
        ),
      ] as string[]

      const sourceEntries = await Promise.all(
        requiredSourceKeys.map(async (sourceKey) => {
          const sourceConfig = masterConfigs.find((config) => config.key === sourceKey)

          if (sourceConfig) {
            const records = await fetchMasterRecords(sourceConfig.endpoint)
            return [sourceKey, records] as const
          }

          if (sourceKey === 'users') {
            const records = await fetchMasterRecords('/api/users')
            return [sourceKey, records] as const
          }

          return [sourceKey, []] as const
        }),
      )

      return Object.fromEntries(sourceEntries) as Record<string, MasterRecord[]>
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createMasterRecord(activeConfig.endpoint, payload),
    onSuccess: async () => {
      setForm(buildInitialForm(activeConfig))
      setFormError('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['masters', activeConfig.key] }),
        queryClient.invalidateQueries({ queryKey: ['masters', 'sources'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-services'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-slots'] }),
      ])
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : `Unable to create ${activeConfig.title}.`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (recordId: number | string) => deleteMasterRecord(activeConfig.endpoint, recordId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['masters', activeConfig.key] }),
        queryClient.invalidateQueries({ queryKey: ['masters', 'sources'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-services'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-slots'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
      ])
    },
    onError: (error) => {
      modal.error({
        title: `Unable to delete ${activeConfig.title}`,
        content: error instanceof Error ? error.message : 'Please try again.',
      })
    },
  })

  const records = activeRecordsQuery.data ?? []

  const sourceOptions = useMemo(() => {
    const sources = sourceQueries.data ?? {}

    return Object.fromEntries(
      Object.entries(sources).map(([key, records]) => [
        key,
        records.map((record) => ({
          value: Number(getRecordId(record)),
          label: getRecordLabel(record),
        })),
      ]),
    ) as Record<string, Array<{ value: number; label: string }>>
  }, [sourceQueries.data])

  const selectMaster = (config: MasterConfig) => {
    setActiveKey(config.key)
    setForm(buildInitialForm(config))
    setFormError('')
  }

  const updateField = (fieldName: string, value: unknown) => {
    setForm((state) => ({
      ...state,
      [fieldName]: value,
    }))
  }

  const submitMaster = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const missingField = activeConfig.fields.find((field) => {
      const value = form[field.name]
      return field.required && (value === undefined || value === null || value === '')
    })

    if (missingField) {
      setFormError(`${missingField.label} is required.`)
      return
    }

    createMutation.mutate(normalizePayload(form, activeConfig))
  }

  const confirmDeleteRecord = (record: MasterRecord) => {
    const recordId = getRecordId(record)

    modal.confirm({
      title: `Delete ${activeConfig.title} record?`,
      content: `${getRecordLabel(record)} will be soft deleted and hidden from normal lists.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(recordId),
    })
  }

  const renderField = (field: MasterFieldConfig) => {
    const value = form[field.name]

    if (field.type === 'textarea') {
      return (
        <Input.TextArea
          className="masters-ant-textarea"
          placeholder={field.placeholder ?? field.label}
          value={typeof value === 'string' ? value : undefined}
          onChange={(event) => updateField(field.name, event.target.value)}
        />
      )
    }

    if (field.type === 'number') {
      return (
        <InputNumber
          className="masters-ant-number"
          placeholder={field.placeholder ?? field.label}
          value={typeof value === 'number' ? value : undefined}
          onChange={(nextValue) => updateField(field.name, nextValue ?? undefined)}
        />
      )
    }

    if (field.type === 'boolean') {
      const checked = value === true

      return (
        <div className="masters-switch-row">
          <Switch checked={checked} onChange={(nextChecked) => updateField(field.name, nextChecked)} />
          <span>{checked ? 'Yes' : 'No'}</span>
        </div>
      )
    }

    if (field.type === 'date') {
      return (
        <DatePicker
          className="masters-ant-picker"
          popupClassName="employees-ant-dropdown"
          value={typeof value === 'string' && value ? dayjs(value, 'YYYY-MM-DD') : null}
          onChange={(_, dateString) =>
            updateField(field.name, Array.isArray(dateString) ? dateString[0] : dateString)
          }
        />
      )
    }

    if (field.type === 'time') {
      return (
        <Input
          className="masters-ant-input"
          type="time"
          value={typeof value === 'string' ? value : undefined}
          onChange={(event) => updateField(field.name, event.target.value)}
        />
      )
    }

    if (field.type === 'enum' || field.type === 'select') {
      const options = field.optionSource ? sourceOptions[field.optionSource] ?? [] : field.options ?? []

      return (
        <Select
          className="masters-ant-select"
          popupClassName="employees-ant-dropdown"
          placeholder={field.placeholder ?? field.label}
          value={value === undefined ? undefined : value}
          options={options}
          onChange={(nextValue) => updateField(field.name, nextValue)}
          loading={field.optionSource ? sourceQueries.isLoading : false}
          showSearch
          optionFilterProp="label"
          allowClear={field.allowEmpty || !field.required}
          notFoundContent={field.optionSource ? 'Create dependency master first' : 'No options'}
        />
      )
    }

    return (
      <Input
        className="masters-ant-input"
        placeholder={field.placeholder ?? field.label}
        value={typeof value === 'string' ? value : undefined}
        onChange={(event) => updateField(field.name, event.target.value)}
      />
    )
  }

  return (
    <section className="masters-page">
      {modalContextHolder}
      <div className="masters-hero">
        <div>
          <p className="bookings-kicker">
            <Database size={14} />
            Master setup
          </p>
          <h2>Configure the reusable data that powers booking operations.</h2>
          <p>
            Choose a master card, fill the generated form, and create records without leaving the
            dashboard.
          </p>
        </div>
      </div>

      <div className="masters-layout">
        <aside className="masters-card-grid">
          {masterConfigs.map((config) => (
            <button
              key={config.key}
              type="button"
              className={`masters-card ${activeConfig.key === config.key ? 'active' : ''}`}
              onClick={() => selectMaster(config)}
            >
              <span>{config.title}</span>
              <small>{config.description}</small>
            </button>
          ))}
        </aside>

        <div className="masters-workspace">
          <div className="masters-panel">
            <div className="masters-panel-header">
              <div>
                <p className="bookings-kicker">
                  <Plus size={14} />
                  Create master
                </p>
                <h2>{activeConfig.title}</h2>
              </div>
              <button
                type="button"
                className="masters-refresh-btn"
                onClick={() => activeRecordsQuery.refetch()}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            <form className="masters-form" onSubmit={submitMaster}>
              {activeConfig.fields.map((field) => (
                <label key={field.name} className={field.type === 'textarea' ? 'wide' : undefined}>
                  <span>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </span>
                  {renderField(field)}
                </label>
              ))}

              {formError ? <p className="masters-form-error">{formError}</p> : null}

              <div className="masters-actions">
                <button
                  type="button"
                  className="employees-cancel-btn"
                  onClick={() => setForm(buildInitialForm(activeConfig))}
                >
                  Reset
                </button>
                {canCreateActive ? (
                  <button type="submit" className="employees-submit-btn" disabled={createMutation.isPending}>
                    <Save size={14} />
                    {createMutation.isPending ? 'Saving...' : `Create ${activeConfig.title}`}
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="masters-panel">
            <div className="masters-panel-header">
              <div>
                <p className="bookings-kicker">Existing records</p>
                <h2>{activeConfig.title}</h2>
              </div>
              <span className="dashboard-chip">{records.length} records</span>
            </div>

            <div className="masters-record-list">
              {activeRecordsQuery.isLoading ? (
                <p>Loading records...</p>
              ) : activeRecordsQuery.isError ? (
                <p>{(activeRecordsQuery.error as Error).message}</p>
              ) : records.length === 0 ? (
                <p>No records found yet.</p>
              ) : (
                records.slice(0, 8).map((record) => (
                  <article key={`${activeConfig.key}-${getRecordId(record)}`} className="masters-record-item">
                    <div>
                      <strong>{getRecordLabel(record)}</strong>
                      <span>{formatRecordMeta(record)}</span>
                    </div>
                    {canDeleteActive ? (
                      <button
                        type="button"
                        className="masters-delete-btn"
                        onClick={() => confirmDeleteRecord(record)}
                        disabled={deleteMutation.isPending}
                        aria-label={`Delete ${getRecordLabel(record)}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
