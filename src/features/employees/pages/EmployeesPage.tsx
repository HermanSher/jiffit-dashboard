import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DatePicker, Modal, Select, Tag, type SelectProps } from 'antd'
import dayjs from 'dayjs'
import { Plus, SquarePen, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { useAuthStore } from '../../auth/auth.store'
import {
  createEmployee,
  deleteEmployeesByIds,
  fetchEmployees,
  fetchRoles,
  fetchUserTypes,
} from '../employees.api'

const useDebouncedValue = <T,>(value: T, delay = 280): T => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebounced(value)
    }, delay)

    return () => window.clearTimeout(timeoutId)
  }, [value, delay])

  return debounced
}

const emptyCreateForm = {
  username: '',
  password: '',
  firstName: '',
  middleName: '',
  lastName: '',
  address: '',
  mobileNo: '',
  alternateNumber: '',
  email: '',
  iRoleMasterId: undefined as number | undefined,
  iUserTypeMasterId: undefined as number | undefined,
  isActive: true,
}

const formatDisplayName = (
  firstName: string | null,
  middleName: string | null,
  lastName: string | null,
  username: string,
): string => {
  const parts = [firstName?.trim(), middleName?.trim(), lastName?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : username
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const isSuEmployee = (employee: { role: { sCode: string } | null }): boolean =>
  employee.role?.sCode?.trim().toUpperCase() === 'SU'

const isActiveSuEmployee = (employee: {
  role: { sCode: string } | null
  isActive: boolean
  employmentStatus: string
}): boolean => isSuEmployee(employee) && employee.isActive && employee.employmentStatus === 'ACTIVE'

const renderEmployeeFilterTag: NonNullable<SelectProps['tagRender']> = ({
  label,
  closable,
  onClose,
}) => {
  const onPreventMouseDown = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <Tag
      className="employees-select-tag"
      closable={closable}
      onClose={onClose}
      onMouseDown={onPreventMouseDown}
    >
      {label}
    </Tag>
  )
}

export const EmployeesPage = () => {
  const [modal, modalContextHolder] = Modal.useModal()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)

  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([])
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState<[string, string]>(['', ''])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [form, setForm] = useState(emptyCreateForm)
  const [formError, setFormError] = useState('')

  const debouncedUsernames = useDebouncedValue(selectedUsernames)
  const debouncedRoleCodes = useDebouncedValue(selectedRoleCodes)
  const debouncedDateRange = useDebouncedValue(selectedDateRange)

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: () => fetchEmployees(),
  })

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  })

  const userTypesQuery = useQuery({
    queryKey: ['user-types'],
    queryFn: fetchUserTypes,
  })

  const createEmployeeMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: async () => {
      setIsCreateModalOpen(false)
      setForm(emptyCreateForm)
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Unable to create employee.')
    },
  })

  const deleteSelectedMutation = useMutation({
    mutationFn: deleteEmployeesByIds,
    onSuccess: async () => {
      setSelectedEmployeeIds([])
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const allEmployees = employeesQuery.data ?? []

  const filteredEmployees = useMemo(() => {
    return allEmployees.filter((employee) => {
      const usernameMatch =
        debouncedUsernames.length === 0 || debouncedUsernames.includes(employee.username)
      const roleCode = employee.role?.sCode ?? ''
      const roleMatch = debouncedRoleCodes.length === 0 || debouncedRoleCodes.includes(roleCode)
      const createdAtTime = new Date(employee.createdAt).getTime()
      const fromTime = debouncedDateRange[0]
        ? new Date(`${debouncedDateRange[0]}T00:00:00.000`).getTime()
        : undefined
      const toTime = debouncedDateRange[1]
        ? new Date(`${debouncedDateRange[1]}T23:59:59.999`).getTime()
        : undefined
      const fromMatch = fromTime === undefined || createdAtTime >= fromTime
      const toMatch = toTime === undefined || createdAtTime <= toTime

      return usernameMatch && roleMatch && fromMatch && toMatch
    })
  }, [allEmployees, debouncedDateRange, debouncedRoleCodes, debouncedUsernames])

  const activeEmployees = allEmployees.filter(
    (employee) => employee.isActive && employee.employmentStatus === 'ACTIVE',
  ).length
  const inactiveEmployees = allEmployees.length - activeEmployees

  const usernameOptions = useMemo(
    () =>
      [...new Set(allEmployees.map((employee) => employee.username))]
        .sort((a, b) => a.localeCompare(b))
        .map((username) => ({ label: username, value: username })),
    [allEmployees],
  )

  const roleCodeOptions = useMemo(
    () =>
      (rolesQuery.data ?? []).map((role) => ({
        value: role.sCode,
        label: `${role.sCode} (${role.sName})`,
      })),
    [rolesQuery.data],
  )

  const clearFilters = () => {
    setSelectedUsernames([])
    setSelectedRoleCodes([])
    setSelectedDateRange(['', ''])
  }

  const selectableVisibleEmployees = filteredEmployees.filter((employee) => employee.id !== currentUser?.id)
  const visibleEmployeeIds = selectableVisibleEmployees.map((employee) => employee.id)
  const selectedVisibleCount = visibleEmployeeIds.filter((id) => selectedEmployeeIds.includes(id)).length
  const isAllVisibleSelected = visibleEmployeeIds.length > 0 && selectedVisibleCount === visibleEmployeeIds.length

  const openCreateModal = () => {
    setForm(emptyCreateForm)
    setFormError('')
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setFormError('')
  }

  const toggleAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedEmployeeIds((state) => state.filter((id) => !visibleEmployeeIds.includes(id)))
      return
    }

    setSelectedEmployeeIds((state) => {
      const next = new Set(state)
      visibleEmployeeIds.forEach((id) => next.add(id))
      return [...next]
    })
  }

  const toggleOne = (userId: number, checked: boolean) => {
    const employee = allEmployees.find((item) => item.id === userId)

    if (employee?.id === currentUser?.id) {
      modal.warning({
        title: 'Action not allowed',
        content: 'You cannot delete your own logged-in account.',
      })
      return
    }

    setSelectedEmployeeIds((state) => {
      if (checked) {
        return state.includes(userId) ? state : [...state, userId]
      }

      return state.filter((id) => id !== userId)
    })
  }

  const handleDeleteSelected = () => {
    if (selectedEmployeeIds.length === 0 || deleteSelectedMutation.isPending) {
      return
    }

    const hasCurrentUserSelected = selectedEmployeeIds.includes(currentUser?.id ?? -1)

    if (hasCurrentUserSelected) {
      modal.warning({
        title: 'Action not allowed',
        content: 'You cannot delete your own logged-in account.',
      })
      setSelectedEmployeeIds((state) => {
        return state.filter((id) => id !== currentUser?.id)
      })
      return
    }

    const activeSuCount = allEmployees.filter(isActiveSuEmployee).length
    const selectedActiveSuCount = allEmployees.filter(
      (employee) => selectedEmployeeIds.includes(employee.id) && isActiveSuEmployee(employee),
    ).length

    if (activeSuCount > 0 && activeSuCount - selectedActiveSuCount < 1) {
      modal.warning({
        title: 'Action not allowed',
        content: 'At least one active SU user must remain.',
      })
      return
    }

    modal.confirm({
      title: 'Delete selected users?',
      content: 'Are you sure you want to delete selected users?',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteSelectedMutation.mutate(selectedEmployeeIds),
    })
  }

  const handleCreateEmployee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (!currentUser?.id) {
      setFormError('Current user information is unavailable. Please login again.')
      return
    }

    if (!form.username.trim()) {
      setFormError('Username is required.')
      return
    }

    if (!form.password) {
      setFormError('Password is required.')
      return
    }

    if (!form.iRoleMasterId || !form.iUserTypeMasterId) {
      setFormError('Role and user type are required.')
      return
    }

    createEmployeeMutation.mutate({
      username: form.username.trim(),
      password: form.password,
      firstName: form.firstName.trim() || undefined,
      middleName: form.middleName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      address: form.address.trim() || undefined,
      mobileNo: form.mobileNo.trim() || undefined,
      alternateNumber: form.alternateNumber.trim() || undefined,
      email: form.email.trim() || undefined,
      iRoleMasterId: form.iRoleMasterId,
      iUserTypeMasterId: form.iUserTypeMasterId,
      createdByUserId: currentUser.id,
      isActive: form.isActive,
    })
  }

  return (
    <section className="employees-shell">
      {modalContextHolder}
      <div className="employees-metrics">
        <article className="employees-metric-card">
          <p className="employees-metric-label">Total Employees</p>
          <p className="employees-metric-value">{allEmployees.length}</p>
        </article>
        <article className="employees-metric-card">
          <p className="employees-metric-label">Active Employees</p>
          <p className="employees-metric-value">{activeEmployees}</p>
        </article>
        <article className="employees-metric-card">
          <p className="employees-metric-label">Inactive Employees</p>
          <p className="employees-metric-value">{inactiveEmployees}</p>
        </article>
      </div>

      <div className="employees-panel">
        <div className="employees-panel-header">
          <h2>Employee Management</h2>
          <div className="employees-panel-actions">
            <button
              type="button"
              className="employees-delete-btn"
              onClick={handleDeleteSelected}
              disabled={selectedEmployeeIds.length === 0 || deleteSelectedMutation.isPending}
            >
              <Trash2 size={15} />
              {deleteSelectedMutation.isPending ? 'Deleting...' : 'Delete Selected'}
            </button>
            <button type="button" className="employees-add-btn" onClick={openCreateModal}>
              <Plus size={15} />
              Add Employee
            </button>
          </div>
        </div>

        <div className="employees-filters employees-filters-compact">
          <div className="employees-filter-item">
            <Select
              mode="multiple"
              showSearch
              className="employees-ant-select"
              popupClassName="employees-ant-dropdown"
              placeholder="By Username"
              value={selectedUsernames}
              options={usernameOptions}
              onChange={setSelectedUsernames}
              optionFilterProp="label"
              maxTagCount={2}
              tagRender={renderEmployeeFilterTag}
              allowClear
            />
          </div>

          <div className="employees-filter-item">
            <Select
              mode="multiple"
              showSearch
              className="employees-ant-select"
              popupClassName="employees-ant-dropdown"
              placeholder="By Role SCode"
              value={selectedRoleCodes}
              options={roleCodeOptions}
              onChange={setSelectedRoleCodes}
              filterOption={(inputValue, option) =>
                String(option?.value ?? '')
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
              maxTagCount={2}
              tagRender={renderEmployeeFilterTag}
              allowClear
            />
          </div>

          <div className="employees-filter-item">
            <DatePicker.RangePicker
              className="employees-ant-range"
              popupClassName="employees-ant-dropdown"
              format="YYYY-MM-DD"
              value={[
                selectedDateRange[0] ? dayjs(selectedDateRange[0], 'YYYY-MM-DD') : null,
                selectedDateRange[1] ? dayjs(selectedDateRange[1], 'YYYY-MM-DD') : null,
              ]}
              onChange={(_, dateStrings) => {
                const [fromDate, toDate] = Array.isArray(dateStrings) ? dateStrings : ['', '']
                setSelectedDateRange([fromDate ?? '', toDate ?? ''])
              }}
            />
          </div>

          <button type="button" className="employees-clear-small-btn" onClick={clearFilters}>
            <X size={12} />
            Clear
          </button>
        </div>

        <div className="employees-table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    disabled={visibleEmployeeIds.length === 0}
                    onChange={(event) => toggleAllVisible(event.target.checked)}
                    aria-label="Select all employees"
                  />
                </th>
                <th>Id</th>
                <th>Username</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employeesQuery.isLoading ? (
                <tr>
                  <td colSpan={10} className="employees-empty-row">
                    Loading employees...
                  </td>
                </tr>
              ) : employeesQuery.isError ? (
                <tr>
                  <td colSpan={10} className="employees-empty-row">
                    {(employeesQuery.error as Error).message}
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="employees-empty-row">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const isActiveEmployee = employee.isActive && employee.employmentStatus === 'ACTIVE'
                  const isCurrentUser = employee.id === currentUser?.id

                  return (
                    <tr key={employee.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(employee.id)}
                          disabled={isCurrentUser}
                          onChange={(event) => toggleOne(employee.id, event.target.checked)}
                          aria-label={
                            isCurrentUser
                              ? `${employee.username} is your logged-in account`
                              : `Select ${employee.username}`
                          }
                          title={isCurrentUser ? 'You cannot delete your own account' : undefined}
                        />
                      </td>
                      <td>{employee.id}</td>
                      <td>{employee.username}</td>
                      <td>{employee.email ?? '-'}</td>
                      <td>
                        {formatDisplayName(
                          employee.firstName,
                          employee.middleName,
                          employee.lastName,
                          employee.username,
                        )}
                      </td>
                      <td>{employee.role?.sName ?? '-'}</td>
                      <td>
                        <span className={`employees-status ${isActiveEmployee ? 'active' : 'inactive'}`}>
                          {isActiveEmployee ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(employee.createdAt)}</td>
                      <td>{formatDate(employee.updatedAt)}</td>
                      <td>
                        <button type="button" className="employees-action-btn" aria-label="Edit employee">
                          <SquarePen size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen ? (
        <div className="employees-modal-overlay" role="presentation">
          <section className="employees-modal" role="dialog" aria-modal="true" aria-label="Add Employee">
            <div className="employees-modal-header">
              <h3>Add Employee</h3>
              <button type="button" className="employees-icon-btn" onClick={closeCreateModal}>
                <X size={15} />
              </button>
            </div>

            <form className="employees-form" onSubmit={handleCreateEmployee} autoComplete="off">
              <input type="text" name="prevent_autofill_username" autoComplete="username" className="sr-only" />
              <input
                type="password"
                name="prevent_autofill_password"
                autoComplete="current-password"
                className="sr-only"
              />

              <input
                type="text"
                name="employee_username"
                autoComplete="off"
                placeholder="Username *"
                value={form.username}
                onChange={(event) => setForm((state) => ({ ...state, username: event.target.value }))}
              />
              <input
                type="password"
                name="employee_password"
                autoComplete="new-password"
                placeholder="Password *"
                value={form.password}
                onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
              />
              <input
                type="text"
                placeholder="First Name"
                value={form.firstName}
                onChange={(event) => setForm((state) => ({ ...state, firstName: event.target.value }))}
              />
              <input
                type="text"
                placeholder="Middle Name"
                value={form.middleName}
                onChange={(event) => setForm((state) => ({ ...state, middleName: event.target.value }))}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={(event) => setForm((state) => ({ ...state, lastName: event.target.value }))}
              />
              <input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={(event) => setForm((state) => ({ ...state, address: event.target.value }))}
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={form.mobileNo}
                onChange={(event) => setForm((state) => ({ ...state, mobileNo: event.target.value }))}
              />
              <input
                type="text"
                placeholder="Alternate Number"
                value={form.alternateNumber}
                onChange={(event) => setForm((state) => ({ ...state, alternateNumber: event.target.value }))}
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
              />

              <Select
                className="employees-ant-select"
                popupClassName="employees-ant-dropdown"
                placeholder="Select Role *"
                value={form.iRoleMasterId}
                options={(rolesQuery.data ?? []).map((role) => ({
                  value: role.iMasterId,
                  label: `${role.sName} (P${role.precedence})`,
                }))}
                onChange={(value) => setForm((state) => ({ ...state, iRoleMasterId: value }))}
                allowClear
              />
              <Select
                className="employees-ant-select"
                popupClassName="employees-ant-dropdown"
                placeholder="Select User Type *"
                value={form.iUserTypeMasterId}
                options={(userTypesQuery.data ?? []).map((userType) => ({
                  value: userType.iMasterId,
                  label: userType.sName,
                }))}
                onChange={(value) => setForm((state) => ({ ...state, iUserTypeMasterId: value }))}
                allowClear
              />
              <Select
                className="employees-ant-select"
                popupClassName="employees-ant-dropdown"
                placeholder="Select Employee Status"
                value={form.isActive}
                options={[
                  { value: true, label: 'Active' },
                  { value: false, label: 'Inactive' },
                ]}
                onChange={(value) => setForm((state) => ({ ...state, isActive: value }))}
              />

              {formError ? <p className="employees-form-error">{formError}</p> : null}

              <div className="employees-modal-actions">
                <button
                  type="button"
                  className="employees-cancel-btn"
                  onClick={closeCreateModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="employees-submit-btn"
                  disabled={createEmployeeMutation.isPending || rolesQuery.isLoading || userTypesQuery.isLoading}
                >
                  {createEmployeeMutation.isPending ? 'Saving...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  )
}
