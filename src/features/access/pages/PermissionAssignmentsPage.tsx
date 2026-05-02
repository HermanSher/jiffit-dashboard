import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Select } from 'antd'
import { KeyRound, Save, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { GlassCard } from '../../../components/ui/GlassCard'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { PageHeader } from '../../../components/ui/PageHeader'
import {
  fetchPermissionsCatalog,
  fetchRoleScreenPermissions,
  fetchRoleTargets,
  fetchScreensCatalog,
  fetchUserScreenPermissions,
  fetchUserTargets,
  saveRoleScreenPermissions,
  saveUserScreenPermissions,
} from '../permission-assignment.api'

type AssignmentScope = 'role' | 'user'

const buildKey = (screenId: number, permissionId: number): string => `${screenId}:${permissionId}`

export const PermissionAssignmentsPage = () => {
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<AssignmentScope>('role')
  const [targetId, setTargetId] = useState<number | undefined>()
  const [allowedKeyOverrides, setAllowedKeyOverrides] = useState<Set<string> | null>(null)

  const screensQuery = useQuery({
    queryKey: ['access-matrix', 'screens'],
    queryFn: fetchScreensCatalog,
  })

  const permissionsQuery = useQuery({
    queryKey: ['access-matrix', 'permissions'],
    queryFn: fetchPermissionsCatalog,
  })

  const rolesQuery = useQuery({
    queryKey: ['access-matrix', 'roles'],
    queryFn: fetchRoleTargets,
  })

  const usersQuery = useQuery({
    queryKey: ['access-matrix', 'users'],
    queryFn: fetchUserTargets,
    enabled: scope === 'user',
  })

  const assignmentsQuery = useQuery({
    queryKey: ['access-matrix', scope, targetId],
    queryFn: () =>
      scope === 'role'
        ? fetchRoleScreenPermissions(targetId ?? 0)
        : fetchUserScreenPermissions(targetId ?? 0),
    enabled: Boolean(targetId),
  })

  const serverAllowedKeys = useMemo(
    () =>
      new Set(
        (assignmentsQuery.data ?? [])
          .filter((entry) => entry.isAllowed)
          .map((entry) => buildKey(entry.screenId, entry.permissionId)),
      ),
    [assignmentsQuery.data],
  )

  const allowedKeys = allowedKeyOverrides ?? serverAllowedKeys

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!targetId) {
        throw new Error('Select a role or user first.')
      }

      const screens = screensQuery.data ?? []
      const permissions = permissionsQuery.data ?? []
      const payload = {
        assignments: screens.flatMap((screen) =>
          permissions.map((permission) => ({
            screenId: screen.iMasterId,
            permissionId: permission.iMasterId,
            isAllowed: allowedKeys.has(buildKey(screen.iMasterId, permission.iMasterId)),
          })),
        ),
      }

      return scope === 'role'
        ? saveRoleScreenPermissions(targetId, payload)
        : saveUserScreenPermissions(targetId, payload)
    },
    onSuccess: async () => {
      toast.success('Screen permissions saved.')
      await queryClient.invalidateQueries({ queryKey: ['access-matrix', scope, targetId] })
    },
  })

  const roleOptions = useMemo(
    () =>
      (rolesQuery.data ?? []).map((role) => ({
        value: role.iMasterId,
        label: `${role.sName} (${role.sCode}) · P${role.precedence}`,
      })),
    [rolesQuery.data],
  )

  const userOptions = useMemo(
    () =>
      (usersQuery.data ?? []).map((user) => ({
        value: user.id,
        label: `${user.username} · ${user.role?.sName ?? 'No role'} · ${user.userType?.sName ?? 'No type'}`,
      })),
    [usersQuery.data],
  )

  const screens = screensQuery.data ?? []
  const permissions = permissionsQuery.data ?? []
  const isLoading =
    screensQuery.isLoading ||
    permissionsQuery.isLoading ||
    rolesQuery.isLoading ||
    usersQuery.isLoading ||
    assignmentsQuery.isLoading

  const togglePermission = (screenId: number, permissionId: number, checked: boolean) => {
    const key = buildKey(screenId, permissionId)

    setAllowedKeyOverrides((current) => {
      const next = new Set(current ?? allowedKeys)

      if (checked) {
        next.add(key)
      } else {
        next.delete(key)
      }

      return next
    })
  }

  return (
    <section className="permission-matrix-page">
      <PageHeader
        eyebrow="RBAC"
        title="Access Matrix"
        description="Assign screen-level permissions to roles or individual dashboard users. User permissions override role defaults."
        icon={ShieldCheck}
        actions={
          <button
            type="button"
            className="primary-btn"
            disabled={!targetId || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            <Save size={15} />
            {saveMutation.isPending ? 'Saving...' : 'Save Permissions'}
          </button>
        }
      />

      <GlassCard className="permission-target-card">
        <div>
          <p className="page-eyebrow">
            <KeyRound size={14} />
            Assignment target
          </p>
          <h2>Choose who receives access</h2>
          <p>Role permissions define defaults. User permissions can override those defaults.</p>
        </div>

        <div className="permission-target-controls">
          <Select
            className="resource-ant-select"
            popupClassName="employees-ant-dropdown"
            value={scope}
            options={[
              { value: 'role', label: 'Role default access' },
              { value: 'user', label: 'User override access' },
            ]}
            onChange={(value) => {
              setScope(value)
              setTargetId(undefined)
              setAllowedKeyOverrides(null)
            }}
          />
          <Select
            className="resource-ant-select"
            popupClassName="employees-ant-dropdown"
            showSearch
            optionFilterProp="label"
            placeholder={scope === 'role' ? 'Select role' : 'Select user'}
            value={targetId}
            options={scope === 'role' ? roleOptions : userOptions}
            onChange={(value) => {
              setTargetId(value)
              setAllowedKeyOverrides(null)
            }}
          />
        </div>
      </GlassCard>

      <GlassCard className="permission-matrix-card">
        {isLoading ? (
          <LoadingSkeleton rows={7} />
        ) : (
          <div className="permission-matrix-scroll">
            <table className="permission-matrix">
              <thead>
                <tr>
                  <th>Screen</th>
                  {permissions.map((permission) => (
                    <th key={permission.iMasterId}>{permission.sCode}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {screens.map((screen) => (
                  <tr key={screen.iMasterId}>
                    <td>
                      <strong>{screen.sName}</strong>
                      <span>{screen.sCode}</span>
                    </td>
                    {permissions.map((permission) => {
                      const key = buildKey(screen.iMasterId, permission.iMasterId)

                      return (
                        <td key={permission.iMasterId}>
                          <input
                            type="checkbox"
                            checked={allowedKeys.has(key)}
                            disabled={!targetId}
                            onChange={(event) =>
                              togglePermission(screen.iMasterId, permission.iMasterId, event.target.checked)
                            }
                            aria-label={`${screen.sCode} ${permission.sCode}`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </section>
  )
}
