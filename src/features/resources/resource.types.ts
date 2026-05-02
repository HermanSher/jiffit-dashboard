import type { LucideIcon } from 'lucide-react'
import type { MasterConfig, MasterFieldConfig } from '../masters/masters.types'

export interface ResourceColumn {
  key: string
  label: string
  format?: 'date' | 'datetime' | 'currency' | 'status' | 'boolean'
}

export interface ResourceConfig extends MasterConfig {
  route: string
  screenCode: string
  permissionCodeBase: string
  icon: LucideIcon
  group: 'Access' | 'People' | 'Services' | 'Operations' | 'Money'
  columns: ResourceColumn[]
  fields: MasterFieldConfig[]
}

export type ResourceRecord = Record<string, unknown>
