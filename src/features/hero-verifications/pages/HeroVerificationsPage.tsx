import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Eye, Pencil, RefreshCw, Search, ShieldCheck, Undo2, X, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable'
import { GlassCard } from '../../../components/ui/GlassCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePermissionHelpers } from '../../access/permissions'
import {
  fetchHeroVerifications,
  rejectHeroVerification,
  requestHeroResubmission,
  updateHeroVerification,
  verifyHeroVerification,
} from '../hero-verifications.api'
import type {
  HeroVerificationApplication,
  HeroVerificationStatus,
  HeroVerificationUpdatePayload,
} from '../hero-verifications.types'

const statuses: Array<HeroVerificationStatus | ''> = [
  '',
  'DRAFT',
  'SUBMITTED',
  'PENDING_HUB_VERIFICATION',
  'RESUBMISSION_REQUIRED',
  'REJECTED',
  'VERIFIED',
]

const formatDate = (value: string | null): string =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'

const DetailItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <article className="verification-detail-item">
    <span>{label}</span>
    <strong>{value ?? '-'}</strong>
  </article>
)

type DecisionModalState = {
  mode: 'reject' | 'resubmit'
  row: HeroVerificationApplication
}

type EditFormState = {
  fullName: string
  selectedCity: string
  selectedJobRole: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  workType: string
  vehicleType: string
  earningsType: string
  adminRemarks: string
  verificationStatus: '' | 'PENDING_HUB_VERIFICATION' | 'VERIFIED'
}

const toEditForm = (row: HeroVerificationApplication): EditFormState => ({
  fullName: row.fullName ?? '',
  selectedCity: row.selectedCity ?? '',
  selectedJobRole: row.selectedJobRole ?? '',
  addressLine1: row.addressLine1 ?? '',
  addressLine2: row.addressLine2 ?? '',
  city: row.city ?? '',
  state: row.state ?? '',
  pincode: row.pincode ?? '',
  workType: row.workType ?? '',
  vehicleType: row.vehicleType ?? '',
  earningsType: row.earningsType ?? '',
  adminRemarks: row.adminRemarks ?? '',
  verificationStatus: '',
})

export const HeroVerificationsPage = () => {
  const queryClient = useQueryClient()
  const permissions = usePermissionHelpers()
  const [status, setStatus] = useState<HeroVerificationStatus | ''>('')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [selected, setSelected] = useState<HeroVerificationApplication | null>(null)
  const [decisionModal, setDecisionModal] = useState<DecisionModalState | null>(null)
  const [decisionText, setDecisionText] = useState('')
  const [editRow, setEditRow] = useState<HeroVerificationApplication | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)

  const verificationsQuery = useQuery({
    queryKey: ['hero-verifications', status, search, city],
    queryFn: () =>
      fetchHeroVerifications({
        status,
        search,
        city,
      }),
  })

  const refreshRows = async (updated?: HeroVerificationApplication) => {
    await queryClient.invalidateQueries({ queryKey: ['hero-verifications'] })
    if (updated) {
      setSelected(updated)
    }
  }

  const verifyMutation = useMutation({
    mutationFn: ({ id, adminRemarks }: { id: number; adminRemarks?: string }) =>
      verifyHeroVerification(id, adminRemarks),
    onSuccess: async (updated) => {
      toast.success('Hero verified successfully.')
      await refreshRows(updated)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      rejectionReason,
      adminRemarks,
    }: {
      id: number
      rejectionReason: string
      adminRemarks?: string
    }) => rejectHeroVerification(id, rejectionReason, adminRemarks),
    onSuccess: async (updated) => {
      toast.success('Hero verification rejected.')
      setDecisionModal(null)
      setDecisionText('')
      await refreshRows(updated)
    },
  })

  const resubmissionMutation = useMutation({
    mutationFn: ({ id, adminRemarks }: { id: number; adminRemarks: string }) =>
      requestHeroResubmission(id, adminRemarks),
    onSuccess: async (updated) => {
      toast.success('Resubmission requested.')
      setDecisionModal(null)
      setDecisionText('')
      await refreshRows(updated)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: HeroVerificationUpdatePayload }) =>
      updateHeroVerification(id, payload),
    onSuccess: async (updated) => {
      toast.success('Hero application updated.')
      setEditRow(null)
      setEditForm(null)
      await refreshRows(updated)
    },
  })

  const rows = verificationsQuery.data ?? []
  const draftCount = rows.filter((row) => row.verificationStatus === 'DRAFT').length
  const pendingCount = rows.filter((row) => row.verificationStatus === 'PENDING_HUB_VERIFICATION').length
  const verifiedCount = rows.filter((row) => row.verificationStatus === 'VERIFIED').length
  const issueCount = rows.filter((row) =>
    ['REJECTED', 'RESUBMISSION_REQUIRED'].includes(row.verificationStatus),
  ).length

  const canVerify = permissions.canVerify('HERO_VERIFICATIONS')
  const canReject = permissions.canReject('HERO_VERIFICATIONS')
  const canUpdate = permissions.canUpdate('HERO_VERIFICATIONS') || canVerify

  const columns = useMemo<DataTableColumn<HeroVerificationApplication>[]>(
    () => [
      {
        key: 'hero',
        header: 'Hero',
        render: (row) => (
          <div className="identity-cell">
            <strong>{row.fullName}</strong>
            <span>{row.mobileNumber} · {row.heroCode ?? row.username}</span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Verification',
        render: (row) => <StatusBadge value={row.verificationStatus} />,
      },
      {
        key: 'city',
        header: 'City',
        render: (row) => row.selectedCity ?? row.city ?? '-',
      },
      {
        key: 'role',
        header: 'Role',
        render: (row) => row.selectedJobRole ?? '-',
      },
      {
        key: 'hub',
        header: 'Nearest Hub',
        render: (row) => row.nearestHub?.name ?? '-',
      },
      {
        key: 'submittedAt',
        header: 'Created / Submitted',
        render: (row) => formatDate(row.submittedAt ?? row.createdAt),
      },
    ],
    [],
  )

  const isMutating =
    verifyMutation.isPending || rejectMutation.isPending || resubmissionMutation.isPending || updateMutation.isPending

  const openDecisionModal = (mode: DecisionModalState['mode'], row: HeroVerificationApplication) => {
    setDecisionModal({ mode, row })
    setDecisionText(mode === 'reject' ? row.rejectionReason ?? '' : row.adminRemarks ?? '')
  }

  const closeDecisionModal = () => {
    if (isMutating) {
      return
    }

    setDecisionModal(null)
    setDecisionText('')
  }

  const submitDecision = () => {
    if (!decisionModal) {
      return
    }

    const text = decisionText.trim()
    if (!text) {
      toast.error(decisionModal.mode === 'reject' ? 'Rejection reason is required.' : 'Correction note is required.')
      return
    }

    if (decisionModal.mode === 'reject') {
      rejectMutation.mutate({
        id: decisionModal.row.id,
        rejectionReason: text,
      })
      return
    }

    resubmissionMutation.mutate({
      id: decisionModal.row.id,
      adminRemarks: text,
    })
  }

  const openEditModal = (row: HeroVerificationApplication) => {
    setEditRow(row)
    setEditForm(toEditForm(row))
  }

  const setEditValue = (key: keyof EditFormState, value: string) => {
    setEditForm((current) => (current ? { ...current, [key]: value } : current))
  }

  const submitEdit = () => {
    if (!editRow || !editForm) {
      return
    }

    const payload = Object.fromEntries(
      Object.entries(editForm)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value),
    ) as HeroVerificationUpdatePayload

    updateMutation.mutate({ id: editRow.id, payload })
  }

  return (
    <section className="verification-page">
      <PageHeader
        eyebrow="Hero Verification"
        title="Hub Verification Queue"
        description="Review hero onboarding applications, validate hub visit details, and unlock verified heroes for live work."
        icon={ShieldCheck}
        actions={
          <button type="button" className="primary-btn" onClick={() => verificationsQuery.refetch()}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <div className="tracking-stats">
        <StatCard label="Draft Leads" value={draftCount} note="incomplete hero leads" icon={Pencil} tone="brand" />
        <StatCard label="In Queue" value={pendingCount} note="awaiting hub verification" icon={ShieldCheck} tone="blue" />
        <StatCard label="Verified" value={verifiedCount} note="allowed to go online" icon={CheckCircle2} tone="green" />
        <StatCard label="Needs Attention" value={issueCount} note="rejected/resubmission" icon={XCircle} tone="orange" />
      </div>

      <GlassCard className="tracking-filter-card">
        <label className="search-input">
          <Search size={15} />
          <input value={search} placeholder="Search name, mobile, email..." onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="search-input">
          <Search size={15} />
          <input value={city} placeholder="Filter city..." onChange={(event) => setCity(event.target.value)} />
        </label>
        <select className="verification-select" value={status} onChange={(event) => setStatus(event.target.value as HeroVerificationStatus | '')}>
          {statuses.map((item) => (
            <option key={item || 'ALL'} value={item}>
              {item ? item.replace(/_/g, ' ') : 'All statuses'}
            </option>
          ))}
        </select>
      </GlassCard>

      <GlassCard className="tracking-table-card">
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.id}
          isLoading={verificationsQuery.isLoading}
          error={verificationsQuery.isError ? (verificationsQuery.error as Error).message : undefined}
          emptyTitle="No hero verifications"
          emptyDescription="Submitted onboarding applications will appear here."
          actions={(row) => (
            <div className="row-actions">
              <button type="button" className="table-action-btn" onClick={() => setSelected(row)}>
                <Eye size={14} />
                View
              </button>
              {canUpdate && row.verificationStatus !== 'VERIFIED' ? (
                <button type="button" className="table-action-btn" disabled={isMutating} onClick={() => openEditModal(row)}>
                  <Pencil size={14} />
                  Edit
                </button>
              ) : null}
              {canVerify && row.verificationStatus !== 'VERIFIED' ? (
                <button
                  type="button"
                  className="table-action-btn success"
                  disabled={isMutating}
                  onClick={() => verifyMutation.mutate({ id: row.id })}
                >
                  <CheckCircle2 size={14} />
                  Verify
                </button>
              ) : null}
              {canReject && row.verificationStatus !== 'VERIFIED' ? (
                <button type="button" className="table-icon-btn danger" disabled={isMutating} onClick={() => openDecisionModal('reject', row)}>
                  <XCircle size={14} />
                </button>
              ) : null}
            </div>
          )}
        />
      </GlassCard>

      {selected ? (
        <div className="modal-overlay" role="presentation">
          <section className="form-modal verification-modal" role="dialog" aria-modal="true" aria-label="Hero verification details">
            <header className="form-modal-header">
              <div>
                <h2>{selected.fullName}</h2>
                <p>{selected.mobileNumber} · {selected.selectedJobRole ?? 'Hero onboarding'}</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setSelected(null)} aria-label="Close">
                <X size={17} />
              </button>
            </header>

            <div className="verification-detail-grid">
              <DetailItem label="Verification" value={selected.verificationStatus.replace(/_/g, ' ')} />
              <DetailItem label="Worker State" value={selected.workerState} />
              <DetailItem label="Email" value={selected.email} />
              <DetailItem label="Date Of Birth" value={selected.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString('en-IN') : null} />
              <DetailItem label="Gender" value={selected.gender} />
              <DetailItem label="Father Name" value={selected.fatherName} />
              <DetailItem label="Address" value={[selected.addressLine1, selected.addressLine2].filter(Boolean).join(', ')} />
              <DetailItem label="City" value={selected.city} />
              <DetailItem label="Pincode" value={selected.pincode} />
              <DetailItem label="Work Type" value={selected.workType} />
              <DetailItem label="Vehicle" value={selected.vehicleType} />
              <DetailItem label="Earnings Type" value={selected.earningsType} />
              <DetailItem label="Nearest Hub" value={selected.nearestHub?.name} />
              <DetailItem label="Hub Address" value={selected.nearestHub?.addressLine1} />
              <DetailItem label="Created" value={formatDate(selected.createdAt)} />
              <DetailItem label="Submitted" value={formatDate(selected.submittedAt)} />
              <DetailItem label="Verified" value={formatDate(selected.verifiedAt)} />
              <DetailItem label="Rejection Reason" value={selected.rejectionReason} />
              <DetailItem label="Admin Remarks" value={selected.adminRemarks} />
            </div>

            <div className="modal-actions wide">
              <button type="button" className="secondary-btn" onClick={() => setSelected(null)}>
                Close
              </button>
              {canReject && selected.verificationStatus !== 'VERIFIED' ? (
                <button type="button" className="secondary-btn" disabled={isMutating} onClick={() => openDecisionModal('resubmit', selected)}>
                  <Undo2 size={14} />
                  Resubmit
                </button>
              ) : null}
              {canReject && selected.verificationStatus !== 'VERIFIED' ? (
                <button type="button" className="danger-btn" disabled={isMutating} onClick={() => openDecisionModal('reject', selected)}>
                  Reject
                </button>
              ) : null}
              {canVerify && selected.verificationStatus !== 'VERIFIED' ? (
                <button type="button" className="primary-btn" disabled={isMutating} onClick={() => verifyMutation.mutate({ id: selected.id })}>
                  Verify Hero
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {decisionModal ? (
        <div className="modal-overlay decision-overlay" role="presentation">
          <section className="form-modal decision-modal" role="dialog" aria-modal="true" aria-label="Verification decision">
            <header className="form-modal-header">
              <div>
                <h2>{decisionModal.mode === 'reject' ? 'Reject verification' : 'Request resubmission'}</h2>
                <p>{decisionModal.row.fullName} · {decisionModal.row.mobileNumber}</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeDecisionModal} aria-label="Close">
                <X size={17} />
              </button>
            </header>

            <label className="decision-field">
              <span>{decisionModal.mode === 'reject' ? 'Rejection reason' : 'Correction note'}</span>
              <textarea
                value={decisionText}
                onChange={(event) => setDecisionText(event.target.value)}
                placeholder={
                  decisionModal.mode === 'reject'
                    ? 'Add the reason this hero cannot be verified.'
                    : 'Tell the hero what needs to be corrected before review.'
                }
                rows={5}
              />
            </label>

            <div className="modal-actions wide">
              <button type="button" className="secondary-btn" disabled={isMutating} onClick={closeDecisionModal}>
                Cancel
              </button>
              <button
                type="button"
                className={decisionModal.mode === 'reject' ? 'danger-btn' : 'primary-btn'}
                disabled={isMutating}
                onClick={submitDecision}
              >
                {decisionModal.mode === 'reject' ? 'Reject Hero' : 'Request Resubmission'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {editRow && editForm ? (
        <div className="modal-overlay decision-overlay" role="presentation">
          <section className="form-modal verification-edit-modal" role="dialog" aria-modal="true" aria-label="Edit hero application">
            <header className="form-modal-header">
              <div>
                <h2>Edit draft hero</h2>
                <p>{editRow.mobileNumber} · {editRow.verificationStatus.replace(/_/g, ' ')}</p>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setEditRow(null)} aria-label="Close">
                <X size={17} />
              </button>
            </header>

            <div className="verification-edit-grid">
              {([
                ['fullName', 'Full Name'],
                ['selectedCity', 'Selected City'],
                ['selectedJobRole', 'Selected Job Role'],
                ['addressLine1', 'Address Line 1'],
                ['addressLine2', 'Address Line 2'],
                ['city', 'City'],
                ['state', 'State'],
                ['pincode', 'Pincode'],
                ['workType', 'Work Type'],
                ['vehicleType', 'Vehicle Type'],
                ['earningsType', 'Earnings Type'],
                ['adminRemarks', 'Admin Remarks'],
              ] as Array<[keyof EditFormState, string]>).map(([key, label]) => (
                <label key={key} className={key === 'adminRemarks' || key === 'addressLine1' ? 'wide' : undefined}>
                  <span>{label}</span>
                  <input value={editForm[key]} onChange={(event) => setEditValue(key, event.target.value)} />
                </label>
              ))}
              <label>
                <span>Move Status</span>
                <select value={editForm.verificationStatus} onChange={(event) => setEditValue('verificationStatus', event.target.value)}>
                  <option value="">Keep current</option>
                  <option value="PENDING_HUB_VERIFICATION">Pending Hub Verification</option>
                  <option value="VERIFIED">Verified</option>
                </select>
              </label>
            </div>

            <div className="modal-actions wide">
              <button type="button" className="secondary-btn" disabled={isMutating} onClick={() => setEditRow(null)}>
                Cancel
              </button>
              <button type="button" className="primary-btn" disabled={isMutating} onClick={submitEdit}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
