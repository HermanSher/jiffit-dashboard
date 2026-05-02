import {
  CalendarDays,
  Database,
  Gauge,
  KeyRound,
  RadioTower,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { resourceConfigs } from '../../features/resources/resource.config'

export interface NavigationItem {
  to: string
  label: string
  screenCode: string
  permissionCodeBase: string
  icon: LucideIcon
  group: 'Core' | 'Access' | 'People' | 'Services' | 'Operations' | 'Money'
}

export const navigationItems: NavigationItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    screenCode: 'DASHBOARD',
    permissionCodeBase: 'DASHBOARD',
    icon: Gauge,
    group: 'Core',
  },
  {
    to: '/bookings',
    label: 'Bookings',
    screenCode: 'BOOKINGS',
    permissionCodeBase: 'BOOKINGS',
    icon: CalendarDays,
    group: 'Core',
  },
  {
    to: '/users',
    label: 'Users',
    screenCode: 'USERS',
    permissionCodeBase: 'USERS',
    icon: Users,
    group: 'People',
  },
  {
    to: '/employees',
    label: 'Employees',
    screenCode: 'USERS',
    permissionCodeBase: 'USERS',
    icon: Users,
    group: 'People',
  },
  {
    to: '/hero-live-locations',
    label: 'Live Tracking',
    screenCode: 'DASHBOARD',
    permissionCodeBase: 'DASHBOARD',
    icon: RadioTower,
    group: 'Operations',
  },
  {
    to: '/permission-assignments',
    label: 'Access Matrix',
    screenCode: 'PERMISSIONS',
    permissionCodeBase: 'PERMISSIONS',
    icon: KeyRound,
    group: 'Access',
  },
  {
    to: '/masters',
    label: 'Masters',
    screenCode: 'SERVICES',
    permissionCodeBase: 'SERVICES',
    icon: Database,
    group: 'Services',
  },
  ...resourceConfigs.map((config) => ({
    to: config.route,
    label: config.title,
    screenCode: config.screenCode,
    permissionCodeBase: config.permissionCodeBase,
    icon: config.icon,
    group: config.group,
  })),
]
