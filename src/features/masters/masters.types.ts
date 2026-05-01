export type MasterFieldType =
  | 'string'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'date'
  | 'time'
  | 'enum'
  | 'select'

export interface MasterFieldOption {
  label: string
  value: string | number | boolean
}

export interface MasterFieldConfig {
  name: string
  label: string
  type: MasterFieldType
  required?: boolean
  placeholder?: string
  options?: MasterFieldOption[]
  optionSource?: string
  allowEmpty?: boolean
}

export interface MasterConfig {
  key: string
  title: string
  description: string
  endpoint: string
  idField: 'iMasterId' | 'iTransId'
  fields: MasterFieldConfig[]
}

export type MasterRecord = Record<string, unknown>
