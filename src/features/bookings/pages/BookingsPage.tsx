import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DatePicker, Input, InputNumber, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import {
  CalendarDays,
  CheckCheck,
  Eye,
  ListFilter,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import {
  createBooking,
  fetchBookingCustomers,
  fetchBookings,
  fetchBookingServices,
  fetchBookingSlots,
  fetchServiceLocations,
  updateBooking,
  updateBookingStatus,
} from '../bookings.api'
import { usePermissionHelpers } from '../../access/permissions'
import type {
  BookingCustomer,
  BookingRecord,
  BookingStatus,
  CreateBookingPayload,
  ServiceLocation,
  UpdateBookingPayload,
  UpdateBookingStatusPayload,
} from '../bookings.types'

const bookingStatuses: BookingStatus[] = [
  'DRAFT',
  'HOLD',
  'CONFIRMED',
  'PENDING_PAYMENT',
  'PAID',
  'ASSIGNMENT_PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
]

const emptyBookingForm = {
  customerId: undefined as number | undefined,
  serviceId: undefined as number | undefined,
  quantity: 1,
  cityCode: 'PATNA',
  addressLine1: '',
  landmark: '',
  pincode: '',
  latitude: '25.5941',
  longitude: '85.1376',
  slotId: undefined as number | undefined,
  scheduledDate: '',
  couponCode: '',
  holdReason: '',
  remarks: '',
}

type BookingCreateAction = 'save' | 'confirm'
type BookingFormMode = 'create' | 'edit'

const moneyValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value: string | number | null | undefined): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(moneyValue(value))

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCustomerName = (customer: BookingCustomer | null): string => {
  if (!customer) {
    return '-'
  }

  const parts = [customer.firstName, customer.middleName, customer.lastName]
    .map((item) => item?.trim())
    .filter(Boolean)

  return parts.length > 0 ? parts.join(' ') : customer.username
}

const getSnapshotCity = (booking: BookingRecord): string =>
  booking.serviceAddressSnapshot?.cityCode ??
  booking.serviceAddressSnapshot?.city ??
  '-'

const toTimeText = (value: string): string => {
  const text = String(value)
  const isoMatch = text.match(/T(\d{2}):(\d{2})/)
  const rawTime = isoMatch ? `${isoMatch[1]}:${isoMatch[2]}` : text.slice(0, 5)
  const [hourText, minuteText] = rawTime.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return rawTime
  }

  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

const buildScheduledDate = (date: string, time: string): string | undefined => {
  if (!date || !time) {
    return undefined
  }

  const normalizedTime = time.length === 5 ? `${time}:00` : time
  return new Date(`${date}T${normalizedTime}`).toISOString()
}

const getSlotRawTime = (value: string): string => {
  const text = String(value)
  const isoMatch = text.match(/T(\d{2}:\d{2}:\d{2})/)

  if (isoMatch) {
    return isoMatch[1]
  }

  return text.length === 5 ? `${text}:00` : text.slice(0, 8)
}

const formatDateOnly = (value: string | null | undefined): string => {
  if (!value) {
    return ''
  }

  return dayjs(value).format('YYYY-MM-DD')
}

const getBookingCityCode = (booking: BookingRecord, locations: ServiceLocation[]): string => {
  const snapshotCode = booking.serviceAddressSnapshot?.cityCode?.toUpperCase()

  if (snapshotCode && locations.some((location) => location.sCode === snapshotCode)) {
    return snapshotCode
  }

  const snapshotCity = booking.serviceAddressSnapshot?.city?.toUpperCase()
  const matchedLocation = locations.find((location) => location.sName.toUpperCase() === snapshotCity)

  return matchedLocation?.sCode ?? snapshotCode ?? emptyBookingForm.cityCode
}

const getBookingFormFromRecord = (
  booking: BookingRecord,
  locations: ServiceLocation[],
): typeof emptyBookingForm => {
  const cityCode = getBookingCityCode(booking, locations)
  const location = locations.find((item) => item.sCode === cityCode)
  const snapshot = booking.serviceAddressSnapshot

  return {
    customerId: booking.iCustomerUserMasterId,
    serviceId: booking.iServiceMasterId ?? undefined,
    quantity: booking.quantity ?? 1,
    cityCode,
    addressLine1: snapshot?.addressLine1 ?? '',
    landmark: snapshot?.landmark ?? '',
    pincode: snapshot?.pincode ?? '',
    latitude: String(snapshot?.latitude ?? location?.latitude ?? emptyBookingForm.latitude),
    longitude: String(snapshot?.longitude ?? location?.longitude ?? emptyBookingForm.longitude),
    slotId: booking.iSlotMasterId ?? undefined,
    scheduledDate: formatDateOnly(booking.scheduledStartAt),
    couponCode: booking.couponCode ?? '',
    holdReason: booking.holdReason ?? '',
    remarks: booking.remarks ?? '',
  }
}

export const BookingsPage = () => {
  const [modal, modalContextHolder] = Modal.useModal()
  const queryClient = useQueryClient()
  const permissions = usePermissionHelpers()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null)
  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null)
  const [form, setForm] = useState(emptyBookingForm)
  const [formError, setFormError] = useState('')
  const [pendingCreateAction, setPendingCreateAction] = useState<BookingCreateAction | null>(null)
  const [bookingSearch, setBookingSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<BookingStatus | undefined>()
  const isBookingFormOpen = isCreateModalOpen || Boolean(editingBooking)
  const bookingFormMode: BookingFormMode = editingBooking ? 'edit' : 'create'
  const canCreateBookings = permissions.canCreate('BOOKINGS')
  const canUpdateBookings = permissions.canUpdate('BOOKINGS')
  const canDeleteBookings = permissions.canDelete('BOOKINGS')

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
  })

  const customersQuery = useQuery({
    queryKey: ['booking-customers'],
    queryFn: fetchBookingCustomers,
  })

  const servicesQuery = useQuery({
    queryKey: ['booking-services'],
    queryFn: fetchBookingServices,
  })

  const locationsQuery = useQuery({
    queryKey: ['service-locations'],
    queryFn: fetchServiceLocations,
  })

  const slotsQuery = useQuery({
    queryKey: ['booking-slots', form.serviceId],
    queryFn: () => fetchBookingSlots(form.serviceId),
    enabled: isBookingFormOpen,
  })

  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: async () => {
      setIsCreateModalOpen(false)
      setEditingBooking(null)
      setForm(emptyBookingForm)
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Unable to create booking.')
    },
    onSettled: () => {
      setPendingCreateAction(null)
    },
  })

  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: number; payload: UpdateBookingPayload }) =>
      updateBooking(bookingId, payload),
    onSuccess: async () => {
      setIsCreateModalOpen(false)
      setEditingBooking(null)
      setForm(emptyBookingForm)
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Unable to update booking.')
    },
    onSettled: () => {
      setPendingCreateAction(null)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: number; payload: UpdateBookingStatusPayload }) =>
      updateBookingStatus(bookingId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (error) => {
      modal.error({
        title: 'Unable to update booking status',
        content: error instanceof Error ? error.message : 'Please try again.',
      })
    },
  })

  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data])
  const serviceLocations = locationsQuery.data ?? []

  const filteredBookings = useMemo(() => {
    const search = bookingSearch.trim().toLowerCase()

    return bookings.filter((booking) => {
      const customerName = formatCustomerName(booking.customer).toLowerCase()
      const mobile = booking.customer?.mobileNo ?? ''
      const bookingNo = booking.bookingNo.toLowerCase()
      const serviceName = booking.service?.sName.toLowerCase() ?? ''
      const city = getSnapshotCity(booking).toUpperCase()
      const searchMatch =
        !search ||
        bookingNo.includes(search) ||
        customerName.includes(search) ||
        mobile.includes(search) ||
        serviceName.includes(search)
      const cityMatch = !cityFilter || city === cityFilter
      const statusMatch = !statusFilter || booking.bookingStatus === statusFilter

      return searchMatch && cityMatch && statusMatch
    })
  }, [bookingSearch, bookings, cityFilter, statusFilter])

  const completedBookings = bookings.filter((booking) => booking.bookingStatus === 'COMPLETED').length
  const pendingProcessing = bookings.filter(
    (booking) => !['COMPLETED', 'CANCELLED', 'FAILED'].includes(booking.bookingStatus),
  ).length
  const isSavingBooking = createBookingMutation.isPending || updateBookingMutation.isPending

  const openCreateModal = () => {
    const defaultLocation = serviceLocations[0]

    setEditingBooking(null)
    setForm({
      ...emptyBookingForm,
      cityCode: defaultLocation?.sCode ?? emptyBookingForm.cityCode,
      latitude: String(defaultLocation?.latitude ?? emptyBookingForm.latitude),
      longitude: String(defaultLocation?.longitude ?? emptyBookingForm.longitude),
    })
    setFormError('')
    setIsCreateModalOpen(true)
  }

  const openEditModal = (booking: BookingRecord) => {
    setViewingBooking(null)
    setEditingBooking(booking)
    setForm(getBookingFormFromRecord(booking, serviceLocations))
    setFormError('')
    setIsCreateModalOpen(false)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setEditingBooking(null)
    setFormError('')
    setPendingCreateAction(null)
  }

  const applyLocation = (locationCode: string) => {
    const location = serviceLocations.find((item) => item.sCode === locationCode)

    setForm((state) => ({
      ...state,
      cityCode: locationCode,
      latitude: String(location?.latitude ?? state.latitude),
      longitude: String(location?.longitude ?? state.longitude),
    }))
  }

  const submitBooking = (action: BookingCreateAction) => {
    setFormError('')

    if (!form.customerId) {
      setFormError('Customer is required.')
      return
    }

    const shouldConfirmBooking = action === 'confirm'

    if (shouldConfirmBooking && !form.serviceId) {
      setFormError('Select a service before creating a confirmed booking.')
      return
    }

    if (shouldConfirmBooking && (!form.cityCode || !form.addressLine1.trim())) {
      setFormError('City and service address are required.')
      return
    }

    if (shouldConfirmBooking && !form.scheduledDate) {
      setFormError('Scheduled date is required.')
      return
    }

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    const hasAddressDraft = Boolean(form.cityCode && form.addressLine1.trim())
    const shouldSendAddressSnapshot = shouldConfirmBooking || hasAddressDraft

    if (shouldSendAddressSnapshot && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      setFormError('Latitude must be a valid number between -90 and 90.')
      return
    }

    if (shouldSendAddressSnapshot && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      setFormError('Longitude must be a valid number between -180 and 180.')
      return
    }

    const selectedLocation = serviceLocations.find((location) => location.sCode === form.cityCode)
    const selectedSlot = (slotsQuery.data ?? []).find((slot) => slot.iMasterId === form.slotId)
    const scheduledStartAt = selectedSlot
      ? buildScheduledDate(form.scheduledDate, getSlotRawTime(selectedSlot.startTime))
      : buildScheduledDate(form.scheduledDate, '09:00:00')
    const scheduledEndAt = selectedSlot
      ? buildScheduledDate(form.scheduledDate, getSlotRawTime(selectedSlot.endTime))
      : buildScheduledDate(form.scheduledDate, '10:00:00')

    const payload: CreateBookingPayload = {
      iCustomerUserMasterId: form.customerId,
      iServiceMasterId: form.serviceId,
      quantity: form.quantity,
      bookingStatus: shouldConfirmBooking ? 'CONFIRMED' : 'HOLD',
      iSlotMasterId: form.slotId,
      scheduledStartAt: form.scheduledDate ? scheduledStartAt : undefined,
      scheduledEndAt: form.scheduledDate ? scheduledEndAt : undefined,
      couponCode: form.couponCode.trim() || undefined,
      holdReason: shouldConfirmBooking
        ? undefined
        : form.holdReason.trim() || 'Booking saved on hold because required master/details are pending.',
      remarks: form.remarks.trim() || undefined,
      serviceAddressSnapshot: shouldSendAddressSnapshot
        ? {
            cityCode: selectedLocation?.sCode ?? form.cityCode,
            city: selectedLocation?.sName ?? form.cityCode,
            state: selectedLocation?.state,
            country: selectedLocation?.country ?? 'India',
            latitude,
            longitude,
            addressLine1: form.addressLine1.trim(),
            landmark: form.landmark.trim() || undefined,
            pincode: form.pincode.trim() || undefined,
            source: 'ADMIN_DASHBOARD',
          }
        : undefined,
    }

    setPendingCreateAction(action)

    if (editingBooking) {
      updateBookingMutation.mutate({
        bookingId: editingBooking.iTransId,
        payload,
      })
      return
    }

    createBookingMutation.mutate(payload)
  }

  const handleCreateBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitBooking('confirm')
  }

  const changeBookingStatus = (
    booking: BookingRecord,
    bookingStatus: UpdateBookingStatusPayload['bookingStatus'],
  ) => {
    const label = bookingStatus === 'CANCELLED' ? 'cancel' : bookingStatus === 'HOLD' ? 'put on hold' : 'confirm'

    modal.confirm({
      title: `Are you sure you want to ${label} this booking?`,
      content:
        bookingStatus === 'CANCELLED'
          ? 'Cancelled bookings are not deleted, but they are removed from active operations.'
          : bookingStatus === 'HOLD'
            ? 'This booking will stay saved but not confirmed.'
            : 'This booking will move to confirmed status.',
      okText: bookingStatus === 'CANCELLED' ? 'Cancel Booking' : bookingStatus,
      okButtonProps: { danger: bookingStatus === 'CANCELLED' },
      onOk: () =>
        updateStatusMutation.mutate({
          bookingId: booking.iTransId,
          payload: {
            bookingStatus,
            holdReason: bookingStatus === 'HOLD' ? 'Moved to hold from dashboard.' : undefined,
            cancelReason: bookingStatus === 'CANCELLED' ? 'Cancelled from dashboard.' : undefined,
          },
        }),
    })
  }

  const clearFilters = () => {
    setBookingSearch('')
    setCityFilter(undefined)
    setStatusFilter(undefined)
  }

  return (
    <section className="bookings-page">
      {modalContextHolder}

      <div className="bookings-metrics">
        <article className="bookings-metric-card">
          <span className="bookings-metric-icon purple">
            <CalendarDays size={20} />
          </span>
          <div>
            <p>Total</p>
            <strong>{bookings.length}</strong>
          </div>
        </article>
        <article className="bookings-metric-card">
          <span className="bookings-metric-icon green">
            <CheckCheck size={20} />
          </span>
          <div>
            <p>Completed</p>
            <strong>{completedBookings}</strong>
          </div>
        </article>
        <article className="bookings-metric-card">
          <span className="bookings-metric-icon orange">
            <LoaderCircle size={20} />
          </span>
          <div>
            <p>Pending Processing</p>
            <strong>{pendingProcessing}</strong>
          </div>
        </article>
      </div>

      <div className="bookings-panel">
        <div className="bookings-panel-header">
          <div>
            <p className="bookings-kicker">
              <MapPin size={14} />
              Patna, Ranchi and Lucknow
            </p>
            <h2>All Bookings</h2>
          </div>
          {canCreateBookings ? (
            <button type="button" className="bookings-add-btn" onClick={openCreateModal}>
              <Plus size={15} />
              New Booking
            </button>
          ) : null}
        </div>

        <div className="bookings-filters">
          <Input
            className="bookings-ant-input"
            placeholder="Booking, customer, mobile, service"
            value={bookingSearch}
            onChange={(event) => setBookingSearch(event.target.value)}
            prefix={<ListFilter size={14} />}
          />
          <Select
            className="bookings-ant-select"
            popupClassName="employees-ant-dropdown"
            placeholder="Select City"
            value={cityFilter}
            onChange={setCityFilter}
            options={serviceLocations.map((location) => ({
              value: location.sCode,
              label: location.sName,
            }))}
            allowClear
          />
          <Select
            className="bookings-ant-select"
            popupClassName="employees-ant-dropdown"
            placeholder="Select Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={bookingStatuses.map((status) => ({
              value: status,
              label: status.replaceAll('_', ' '),
            }))}
            allowClear
          />
          <button type="button" className="bookings-clear-btn" onClick={clearFilters}>
            <RotateCcw size={13} />
            Clear
          </button>
        </div>

        <div className="bookings-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Booking</th>
                <th>Customer</th>
                <th>Service</th>
                <th>City</th>
                <th>Job Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookingsQuery.isLoading ? (
                <tr>
                  <td colSpan={9} className="bookings-empty-row">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookingsQuery.isError ? (
                <tr>
                  <td colSpan={9} className="bookings-empty-row">
                    {(bookingsQuery.error as Error).message}
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="bookings-empty-row">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.iTransId}>
                    <td>{booking.iTransId}</td>
                    <td>
                      <strong>{booking.bookingNo}</strong>
                      <span>Qty {booking.quantity}</span>
                    </td>
                    <td>
                      <strong>{formatCustomerName(booking.customer)}</strong>
                      <span>{booking.customer?.mobileNo ?? '-'}</span>
                    </td>
                    <td>
                      <strong>{booking.service?.sName ?? '-'}</strong>
                      <span>{booking.service?.sCode ?? '-'}</span>
                    </td>
                    <td>{getSnapshotCity(booking)}</td>
                    <td>{formatDateTime(booking.scheduledStartAt)}</td>
                    <td>{formatCurrency(booking.finalAmount)}</td>
                    <td>
                      <span className={`booking-status ${booking.bookingStatus.toLowerCase()}`}>
                        {booking.bookingStatus.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="bookings-action-group">
                        <button
                          type="button"
                          className="bookings-view-btn"
                          onClick={() => setViewingBooking(booking)}
                        >
                          <Eye size={14} />
                          View
                        </button>
                        {canUpdateBookings ? (
                          <>
                            <button
                              type="button"
                              className="bookings-edit-btn"
                              onClick={() => openEditModal(booking)}
                              disabled={updateBookingMutation.isPending}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="bookings-status-btn confirm"
                              onClick={() => changeBookingStatus(booking, 'CONFIRMED')}
                              disabled={booking.bookingStatus === 'CONFIRMED' || updateStatusMutation.isPending}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="bookings-status-btn hold"
                              onClick={() => changeBookingStatus(booking, 'HOLD')}
                              disabled={booking.bookingStatus === 'HOLD' || updateStatusMutation.isPending}
                            >
                              Hold
                            </button>
                          </>
                        ) : null}
                        {canDeleteBookings || canUpdateBookings ? (
                          <button
                            type="button"
                            className="bookings-status-btn cancel"
                            onClick={() => changeBookingStatus(booking, 'CANCELLED')}
                            disabled={booking.bookingStatus === 'CANCELLED' || updateStatusMutation.isPending}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isBookingFormOpen ? (
        <div className="bookings-modal-overlay" role="presentation">
          <section
            className="bookings-modal"
            role="dialog"
            aria-modal="true"
            aria-label={bookingFormMode === 'edit' ? 'Edit Booking' : 'New Booking'}
          >
            <div className="bookings-modal-header">
              <div>
                <p className="bookings-kicker">
                  {bookingFormMode === 'edit'
                    ? `Complete saved booking ${editingBooking?.bookingNo ?? ''}`
                    : 'Create on behalf of customer'}
                </p>
                <h3>{bookingFormMode === 'edit' ? 'Edit Booking' : 'New Booking'}</h3>
              </div>
              <button type="button" className="employees-icon-btn" onClick={closeCreateModal}>
                <X size={15} />
              </button>
            </div>

            <form className="bookings-form" onSubmit={handleCreateBooking}>
              <label className="bookings-form-field">
                <span>Customer *</span>
                <Select
                  className="bookings-ant-select"
                  popupClassName="employees-ant-dropdown"
                  placeholder="Select customer"
                  value={form.customerId}
                  showSearch
                  optionFilterProp="label"
                  options={(customersQuery.data ?? []).map((customer) => ({
                    value: customer.iMasterId ?? customer.id,
                    label: `${formatCustomerName(customer)} ${customer.mobileNo ? `- ${customer.mobileNo}` : ''}`,
                  }))}
                  onChange={(value) => setForm((state) => ({ ...state, customerId: value }))}
                  loading={customersQuery.isLoading}
                />
              </label>

              <label className="bookings-form-field">
                <span>Service {bookingFormMode === 'edit' ? '' : '(optional for save)'}</span>
                <Select
                  className="bookings-ant-select"
                  popupClassName="employees-ant-dropdown"
                  placeholder="Select service"
                  value={form.serviceId}
                  showSearch
                  optionFilterProp="label"
                  options={(servicesQuery.data ?? []).map((service) => ({
                    value: service.iMasterId,
                    label: `${service.sName} - ${formatCurrency(service.salePrice ?? service.basePrice)}`,
                  }))}
                  onChange={(value) =>
                    setForm((state) => ({
                      ...state,
                      serviceId: value,
                      slotId: undefined,
                    }))
                  }
                  loading={servicesQuery.isLoading}
                  notFoundContent={
                    servicesQuery.isError
                      ? (servicesQuery.error as Error).message
                      : 'No services found. Create services from Masters.'
                  }
                />
              </label>

              <label className="bookings-form-field">
                <span>Quantity *</span>
                <InputNumber
                  className="bookings-ant-number"
                  min={1}
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(value) => setForm((state) => ({ ...state, quantity: Number(value ?? 1) }))}
                />
              </label>

              <label className="bookings-form-field">
                <span>City *</span>
                <Select
                  className="bookings-ant-select"
                  popupClassName="employees-ant-dropdown"
                  placeholder="Select city"
                  value={form.cityCode}
                  options={serviceLocations.map((location: ServiceLocation) => ({
                    value: location.sCode,
                    label: `${location.sName}, ${location.state}`,
                  }))}
                  onChange={applyLocation}
                  loading={locationsQuery.isLoading}
                />
              </label>

              <label className="bookings-form-field">
                <span>Service address *</span>
                <Input
                  className="bookings-ant-input"
                  placeholder="House no, street, area"
                  value={form.addressLine1}
                  onChange={(event) => setForm((state) => ({ ...state, addressLine1: event.target.value }))}
                />
              </label>

              <label className="bookings-form-field">
                <span>Landmark</span>
                <Input
                  className="bookings-ant-input"
                  placeholder="Nearby landmark"
                  value={form.landmark}
                  onChange={(event) => setForm((state) => ({ ...state, landmark: event.target.value }))}
                />
              </label>

              <label className="bookings-form-field">
                <span>Pincode</span>
                <Input
                  className="bookings-ant-input"
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={(event) => setForm((state) => ({ ...state, pincode: event.target.value }))}
                />
              </label>

              <label className="bookings-form-field">
                <span>Latitude *</span>
                <Input
                  className="bookings-ant-input"
                  placeholder="Latitude"
                  value={form.latitude}
                  onChange={(event) => setForm((state) => ({ ...state, latitude: event.target.value }))}
                />
              </label>

              <label className="bookings-form-field">
                <span>Longitude *</span>
                <Input
                  className="bookings-ant-input"
                  placeholder="Longitude"
                  value={form.longitude}
                  onChange={(event) => setForm((state) => ({ ...state, longitude: event.target.value }))}
                />
              </label>

              <label className="bookings-form-field">
                <span>Scheduled date *</span>
                <DatePicker
                  className="bookings-ant-picker"
                  popupClassName="employees-ant-dropdown"
                  placeholder="Select date"
                  format="YYYY-MM-DD"
                  value={form.scheduledDate ? dayjs(form.scheduledDate, 'YYYY-MM-DD') : null}
                  onChange={(_, dateString) =>
                    setForm((state) => ({
                      ...state,
                      scheduledDate: Array.isArray(dateString) ? dateString[0] ?? '' : dateString,
                    }))
                  }
                />
              </label>

              <label className="bookings-form-field">
                <span>Slot</span>
                <Select
                  className="bookings-ant-select"
                  popupClassName="employees-ant-dropdown"
                  placeholder="Select slot"
                  value={form.slotId}
                  options={(slotsQuery.data ?? []).map((slot) => ({
                    value: slot.iMasterId,
                    label: `${slot.slotName} (${toTimeText(slot.startTime)} - ${toTimeText(slot.endTime)})`,
                  }))}
                  onChange={(value) => setForm((state) => ({ ...state, slotId: value }))}
                  loading={slotsQuery.isLoading}
                  allowClear
                />
              </label>

              <label className="bookings-form-field">
                <span>Coupon code</span>
                <Input
                  className="bookings-ant-input"
                  placeholder="Coupon code"
                  value={form.couponCode}
                  onChange={(event) => setForm((state) => ({ ...state, couponCode: event.target.value }))}
                />
              </label>

              <label className="bookings-form-field">
                <span>Hold reason</span>
                <Input
                  className="bookings-ant-input"
                  placeholder="Reason if saving on hold"
                  value={form.holdReason}
                  onChange={(event) => setForm((state) => ({ ...state, holdReason: event.target.value }))}
                />
              </label>

              <label className="bookings-form-field wide">
                <span>Remarks</span>
                <Input.TextArea
                  className="bookings-ant-textarea"
                  placeholder="Remarks"
                  value={form.remarks}
                  onChange={(event) => setForm((state) => ({ ...state, remarks: event.target.value }))}
                />
              </label>

              {formError ? <p className="bookings-form-error">{formError}</p> : null}

              <div className="bookings-modal-actions">
                <button type="button" className="employees-cancel-btn" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="bookings-save-btn"
                  onClick={() => submitBooking('save')}
                  disabled={isSavingBooking}
                >
                  {isSavingBooking && pendingCreateAction === 'save' ? 'Saving...' : 'Save'}
                </button>
                <button type="submit" className="employees-submit-btn" disabled={isSavingBooking}>
                  {isSavingBooking && pendingCreateAction === 'confirm'
                    ? bookingFormMode === 'edit'
                      ? 'Confirming...'
                      : 'Creating...'
                    : 'Create Booking'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {viewingBooking ? (
        <div className="bookings-modal-overlay" role="presentation">
          <section className="bookings-modal booking-details-modal" role="dialog" aria-modal="true">
            <div className="bookings-modal-header">
              <div>
                <p className="bookings-kicker">Booking details</p>
                <h3>{viewingBooking.bookingNo}</h3>
              </div>
              <button type="button" className="employees-icon-btn" onClick={() => setViewingBooking(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="booking-details-body">
              <div className="booking-details-topline">
                <span className={`booking-status ${viewingBooking.bookingStatus.toLowerCase()}`}>
                  {viewingBooking.bookingStatus.replaceAll('_', ' ')}
                </span>
                <strong>{formatCurrency(viewingBooking.finalAmount)}</strong>
              </div>

              <div className="booking-details-grid">
                <article>
                  <p>Booking ID</p>
                  <strong>{viewingBooking.iTransId}</strong>
                </article>
                <article>
                  <p>Payment status</p>
                  <strong>{viewingBooking.paymentStatus}</strong>
                </article>
                <article>
                  <p>Customer</p>
                  <strong>{formatCustomerName(viewingBooking.customer)}</strong>
                  <span>{viewingBooking.customer?.mobileNo ?? '-'}</span>
                </article>
                <article>
                  <p>Customer username</p>
                  <strong>{viewingBooking.customer?.username ?? '-'}</strong>
                  <span>{viewingBooking.customer?.email ?? '-'}</span>
                </article>
                <article>
                  <p>Service</p>
                  <strong>{viewingBooking.service?.sName ?? '-'}</strong>
                  <span>{viewingBooking.service?.sCode ?? 'Master pending'}</span>
                </article>
                <article>
                  <p>Quantity</p>
                  <strong>{viewingBooking.quantity}</strong>
                </article>
                <article>
                  <p>Slot</p>
                  <strong>
                    {viewingBooking.slot
                      ? `${viewingBooking.slot.slotName} (${toTimeText(viewingBooking.slot.startTime)} - ${toTimeText(viewingBooking.slot.endTime)})`
                      : '-'}
                  </strong>
                </article>
                <article>
                  <p>Schedule</p>
                  <strong>{formatDateTime(viewingBooking.scheduledStartAt)}</strong>
                  <span>Ends {formatDateTime(viewingBooking.scheduledEndAt)}</span>
                </article>
                <article>
                  <p>City</p>
                  <strong>{getSnapshotCity(viewingBooking)}</strong>
                  <span>{viewingBooking.serviceAddressSnapshot?.state ?? '-'}</span>
                </article>
                <article>
                  <p>Address</p>
                  <strong>{viewingBooking.serviceAddressSnapshot?.addressLine1 ?? '-'}</strong>
                  <span>{viewingBooking.serviceAddressSnapshot?.landmark ?? '-'}</span>
                </article>
                <article>
                  <p>Pincode</p>
                  <strong>{viewingBooking.serviceAddressSnapshot?.pincode ?? '-'}</strong>
                </article>
                <article>
                  <p>Location</p>
                  <strong>
                    {viewingBooking.serviceAddressSnapshot?.latitude ?? '-'},
                    {' '}
                    {viewingBooking.serviceAddressSnapshot?.longitude ?? '-'}
                  </strong>
                </article>
                <article>
                  <p>Base amount</p>
                  <strong>{formatCurrency(viewingBooking.baseAmount)}</strong>
                </article>
                <article>
                  <p>Discount</p>
                  <strong>{formatCurrency(viewingBooking.discountAmount)}</strong>
                  <span>{viewingBooking.couponCode ?? '-'}</span>
                </article>
                <article>
                  <p>Tax</p>
                  <strong>{formatCurrency(viewingBooking.taxAmount)}</strong>
                </article>
                <article>
                  <p>Final amount</p>
                  <strong>{formatCurrency(viewingBooking.finalAmount)}</strong>
                </article>
                <article>
                  <p>Confirmed at</p>
                  <strong>{formatDateTime(viewingBooking.confirmedAt)}</strong>
                </article>
                <article>
                  <p>Cancelled at</p>
                  <strong>{formatDateTime(viewingBooking.cancelledAt)}</strong>
                  <span>{viewingBooking.cancelReason ?? '-'}</span>
                </article>
                <article className="booking-details-wide">
                  <p>Hold reason</p>
                  <strong>{viewingBooking.holdReason ?? '-'}</strong>
                </article>
                <article className="booking-details-wide">
                  <p>Remarks</p>
                  <strong>{viewingBooking.remarks ?? '-'}</strong>
                </article>
                <article>
                  <p>Created</p>
                  <strong>{formatDateTime(viewingBooking.createdAt)}</strong>
                </article>
                <article>
                  <p>Updated</p>
                  <strong>{formatDateTime(viewingBooking.updatedAt)}</strong>
                </article>
              </div>

              <div className="bookings-modal-actions">
                {canUpdateBookings ? (
                  <button type="button" className="bookings-save-btn" onClick={() => openEditModal(viewingBooking)}>
                    <Pencil size={14} />
                    Edit Booking
                  </button>
                ) : null}
                <button type="button" className="employees-submit-btn" onClick={() => setViewingBooking(null)}>
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
