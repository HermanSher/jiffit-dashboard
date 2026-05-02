export interface DashboardScreen {
  iMasterId: number
  sCode: string
  sName: string
  description: string | null
  routePath: string | null
  parentScreenId: number | null
  displayOrder: number
  isActive: boolean
  isDeleted?: boolean
}

export interface EffectivePermission {
  screenCode: string
  permissionCode: string
  isAllowed: boolean
}

export type PermissionAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'ASSIGN'
