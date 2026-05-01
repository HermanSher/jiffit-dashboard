import {
  ArrowUpRight,
  CalendarCheck,
  CheckCheck,
  ClipboardList,
  Sparkles,
  Users,
} from 'lucide-react'

const metrics = [
  {
    label: 'Total Booking',
    value: '248',
    note: '+18 new today',
    icon: CalendarCheck,
    accent: 'booking',
  },
  {
    label: 'Customers',
    value: '1.2K',
    note: '+42 this week',
    icon: Users,
    accent: 'customers',
  },
  {
    label: 'Total Tasks',
    value: '310',
    note: 'Completed booking service',
    icon: CheckCheck,
    accent: 'tasks',
  },
]

const activityRows = [
  { id: 'JB-101', user: 'Amit Sharma', action: 'AC deep cleaning booked', status: 'Assigned' },
  { id: 'JB-102', user: 'Neha Patel', action: 'Bathroom cleaning completed', status: 'Done' },
  { id: 'JB-103', user: 'Ravi Kumar', action: 'Kitchen service payment pending', status: 'Review' },
  { id: 'JB-104', user: 'Priya Singh', action: 'Sofa cleaning task closed', status: 'Done' },
]

const momentumData = [48, 62, 54, 76, 68, 84, 72]

export const DashboardPage = () => {
  return (
    <section className="dashboard-page">
      <div className="dashboard-grid">
        {metrics.map((item) => (
          <article key={item.label} className={`dashboard-stat-card ${item.accent}`}>
            <div>
              <p className="metric-label">{item.label}</p>
              <p className="metric-value">{item.value}</p>
              <p className="metric-note">{item.note}</p>
            </div>
            <span className="dashboard-stat-icon">
              <item.icon size={21} />
            </span>
          </article>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <article className="dashboard-hero panel">
          <span className="dashboard-hero-orb" />
          <div className="dashboard-hero-content">
            <p className="dashboard-kicker">
              <Sparkles size={14} />
              Jiffit operations
            </p>
            <h2>Keep every booking, customer, and service task moving smoothly.</h2>
            <p>
              This dashboard is static for now, but the layout is ready for the booking, customer,
              and completed-service APIs we designed in the backend.
            </p>
            <button type="button" className="dashboard-primary-action">
              Review bookings
              <ArrowUpRight size={15} />
            </button>
          </div>
        </article>

        <article className="dashboard-side-card panel">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-kicker">Today</p>
              <h2>Service Momentum</h2>
            </div>
            <span className="dashboard-chip">This week</span>
          </div>
          <div className="dashboard-bars">
            {momentumData.map((point, index) => (
              <span key={`${point}-${index}`} style={{ height: `${point}%` }} />
            ))}
          </div>
        </article>
      </div>

      <div className="panel dashboard-activity-panel">
        <div className="dashboard-card-header">
          <div>
            <p className="dashboard-kicker">
              <ClipboardList size={14} />
              Latest activity
            </p>
            <h2>Recent Booking Activity</h2>
          </div>
          <span className="dashboard-chip">Static data</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activityRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.user}</td>
                  <td>{row.action}</td>
                  <td>
                    <span className="status-pill">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
