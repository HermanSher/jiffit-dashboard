import { useQuery } from '@tanstack/react-query'
import { Activity, MapPinned, Navigation, RefreshCw, RadioTower, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable'
import { EmptyState } from '../../../components/ui/EmptyState'
import { GlassCard } from '../../../components/ui/GlassCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { fetchHeroLiveLocations } from '../tracking.api'
import type { HeroLiveLocation } from '../tracking.types'

const formatLastUpdated = (value: string): string =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export const HeroLiveLocationsPage = () => {
  const [city, setCity] = useState('')
  const [service, setService] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)

  const liveQuery = useQuery({
    queryKey: ['hero-live-locations', city, service, activeOnly],
    queryFn: () =>
      fetchHeroLiveLocations({
        city: city.trim() || undefined,
        service: service.trim() || undefined,
        active: activeOnly,
      }),
  })

  const rows = liveQuery.data ?? []
  const liveCount = rows.filter((row) => !row.isStale).length
  const staleCount = rows.filter((row) => row.isStale).length
  const availableCount = rows.filter((row) => row.isAvailable).length

  const columns = useMemo<DataTableColumn<HeroLiveLocation>[]>(
    () => [
      {
        key: 'hero',
        header: 'Hero',
        render: (row) => (
          <div className="identity-cell">
            <strong>{row.displayName}</strong>
            <span>#{row.heroId} · {row.username}</span>
          </div>
        ),
      },
      {
        key: 'state',
        header: 'Worker State',
        render: (row) => <StatusBadge value={row.workerState ?? row.status} />,
      },
      {
        key: 'location',
        header: 'Location',
        render: (row) => (
          <span>
            {row.latitude.toFixed(6)}, {row.longitude.toFixed(6)}
          </span>
        ),
      },
      {
        key: 'serviceAreas',
        header: 'Service Areas',
        render: (row) =>
          row.serviceAreas.length > 0
            ? row.serviceAreas.map((area) => area.city ?? area.pincode).filter(Boolean).join(', ')
            : '-',
      },
      {
        key: 'services',
        header: 'Services',
        render: (row) =>
          row.services.length > 0
            ? row.services.slice(0, 2).map((serviceItem) => serviceItem.serviceName).join(', ')
            : '-',
      },
      {
        key: 'lastUpdatedAt',
        header: 'Last Updated',
        render: (row) => formatLastUpdated(row.lastUpdatedAt),
      },
      {
        key: 'status',
        header: 'Signal',
        render: (row) => <StatusBadge value={row.status} />,
      },
    ],
    [],
  )

  return (
    <section className="tracking-page">
      <PageHeader
        eyebrow="Hero Live Location"
        title="Live Hero Tracking"
        description="Latest GPS point per hero, freshness status, worker state, and assignment-ready signal."
        icon={RadioTower}
        actions={
          <button type="button" className="primary-btn" onClick={() => liveQuery.refetch()}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <div className="tracking-stats">
        <StatCard label="Tracked heroes" value={rows.length} note="latest location rows" icon={MapPinned} />
        <StatCard label="Live signals" value={liveCount} note="fresh within backend threshold" icon={Activity} tone="green" />
        <StatCard label="Available" value={availableCount} note={`${staleCount} stale/offline`} icon={Navigation} tone="blue" />
      </div>

      <GlassCard className="tracking-filter-card">
        <label className="search-input">
          <Search size={15} />
          <input value={city} placeholder="Filter by city..." onChange={(event) => setCity(event.target.value)} />
        </label>
        <label className="search-input">
          <Search size={15} />
          <input
            value={service}
            placeholder="Filter by service..."
            onChange={(event) => setService(event.target.value)}
          />
        </label>
        <label className="toggle-pill">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
          />
          Active/fresh only
        </label>
      </GlassCard>

      <div className="tracking-grid">
        <GlassCard className="tracking-table-card">
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.heroId}
            isLoading={liveQuery.isLoading}
            error={liveQuery.isError ? (liveQuery.error as Error).message : undefined}
            emptyTitle="No live hero locations"
            emptyDescription="Heroes will appear here after the Hero app posts /api/worker/location."
          />
        </GlassCard>

        <GlassCard className="map-placeholder-card">
          <div className="map-placeholder">
            <MapPinned size={36} />
            <h2>Map coming soon</h2>
            <p>
              Google Maps or Mapbox can plug in here later. For now, this page shows verified
              coordinates and freshness for assignment readiness.
            </p>
          </div>
        </GlassCard>
      </div>

      {liveQuery.isError ? (
        <EmptyState
          title="Tracking API unavailable"
          description="Check DASHBOARD_VIEW permission and backend /api/dashboard/heroes/live."
        />
      ) : null}
    </section>
  )
}
