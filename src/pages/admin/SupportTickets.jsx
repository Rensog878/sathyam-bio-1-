import { useState } from 'react'
import { MessageSquare, Clock, User, AlertCircle, CheckCircle, Hourglass, X } from 'lucide-react'

const MOCK_TICKETS = [
  { id: 'TKT-001', title: 'Product quality issue - CottonGuard 20 EC batch', description: 'Received defective batch. Product shows signs of contamination.', reporter: 'Ramesh Kumar', reporterMobile: '9876543210', status: 'resolved', priority: 'high', createdDate: '2024-08-28', resolvedDate: '2024-09-01', category: 'Product Quality' },
  { id: 'TKT-002', title: 'Delivery delay for order #12543', description: 'Package not delivered within promised timeframe', reporter: 'Priya Sharma', reporterMobile: '9567890123', status: 'pending', priority: 'medium', createdDate: '2024-09-01', resolvedDate: null, category: 'Delivery' },
  { id: 'TKT-003', title: 'Payment processing error', description: 'Transaction charged twice for same order', reporter: 'Arun Kumar', reporterMobile: '9678901234', status: 'in-progress', priority: 'high', createdDate: '2024-09-01', resolvedDate: null, category: 'Billing' },
  { id: 'TKT-004', title: 'Account login issue', description: 'Unable to login with registered mobile number', reporter: 'Muthuvel K', reporterMobile: '9234567890', status: 'resolved', priority: 'low', createdDate: '2024-08-30', resolvedDate: '2024-08-31', category: 'Technical' },
  { id: 'TKT-005', title: 'Advisory content not updating', description: 'Weather advisory for my region not refreshing', reporter: 'Rameshwar Patel', reporterMobile: '9876543210', status: 'pending', priority: 'low', createdDate: '2024-09-02', resolvedDate: null, category: 'Advisory' },
]

export default function SupportTickets() {
  const [tickets, setTickets] = useState(MOCK_TICKETS)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = tickets.filter(t => {
    const statusMatch = filterStatus === 'all' || t.status === filterStatus
    const priorityMatch = filterPriority === 'all' || t.priority === filterPriority
    const searchMatch = search === '' || 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.includes(search) ||
      t.reporter.toLowerCase().includes(search.toLowerCase())
    return statusMatch && priorityMatch && searchMatch
  })

  const getStatusColor = (status) => {
    const colors = {
      'resolved': { bg: 'rgba(93, 193, 149, 0.12)', color: '#2d9a66', icon: CheckCircle },
      'pending': { bg: 'rgba(245, 200, 107, 0.12)', color: '#c8942e', icon: Clock },
      'in-progress': { bg: 'rgba(94, 99, 255, 0.12)', color: '#3f46d1', icon: Hourglass },
      'rejected': { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef6d6d', icon: X },
    }
    return colors[status] || colors['pending']
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#ef6d6d',
      'medium': '#f5c86b',
      'low': '#52c6c1',
    }
    return colors[priority]
  }

  const handleStatusUpdate = (ticketId, newStatus) => {
    setTickets(tickets.map(t =>
      t.id === ticketId
        ? { ...t, status: newStatus, resolvedDate: newStatus === 'resolved' ? new Date().toLocaleDateString('en-IN') : t.resolvedDate }
        : t
    ))
    setSelectedTicket(selectedTicket?.id === ticketId ? { ...selectedTicket, status: newStatus, resolvedDate: newStatus === 'resolved' ? new Date().toLocaleDateString('en-IN') : selectedTicket.resolvedDate } : selectedTicket)
  }

  const stats = [
    { label: 'Total Tickets', value: tickets.length, icon: '🎫', color: 'blue' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, icon: '✅', color: 'green' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, icon: '⏳', color: 'yellow' },
    { label: 'Pending', value: tickets.filter(t => t.status === 'pending').length, icon: '⏰', color: 'orange' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="eyebrow">Support Center</div>
          <h1>🎫 Support Tickets</h1>
          <p>Track all customer issues, complaints, and support requests with real-time status updates</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {stats.map(stat => (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by ticket ID, title, or reporter..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1, minWidth: '240px' }}
        />

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="resolved">Resolved</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="filter-select">
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tickets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 400px' : '1fr', gap: '20px', alignItems: 'start' }}>
        <div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No tickets found</h3>
              <p>Adjust your filters or search criteria</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(ticket => {
                const statusInfo = getStatusColor(ticket.status)
                return (
                  <div
                    key={ticket.id}
                    className="card"
                    onClick={() => setSelectedTicket(ticket)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: selectedTicket?.id === ticket.id ? '4px solid var(--brand-500)' : '4px solid transparent',
                      background: selectedTicket?.id === ticket.id ? 'rgba(94,99,255,0.05)' : 'rgba(255,255,255,0.8)',
                      padding: '16px 20px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-600)', marginBottom: '6px' }}>
                          {ticket.id}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {ticket.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                          {ticket.description}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>👤 {ticket.reporter}</span>
                          <span style={{ color: 'var(--text-muted)' }}>📅 {ticket.createdDate}</span>
                          <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                            {ticket.status.toUpperCase()}
                          </span>
                          <span style={{ background: `${getPriorityColor(ticket.priority)}20`, color: getPriorityColor(ticket.priority), padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ticket Details Panel */}
        {selectedTicket && (
          <div className="card" style={{ position: 'sticky', top: '100px' }}>
            <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', paddingBottom: '12px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Ticket Details
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Ticket ID */}
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Ticket ID
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-600)' }}>
                  {selectedTicket.id}
                </div>
              </div>

              {/* Category */}
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Category
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedTicket.category}
                </div>
              </div>

              {/* Reporter */}
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Reporter
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <User size={14} /> {selectedTicket.reporter}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    📱 {selectedTicket.reporterMobile}
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--surface-border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Update Status
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {['pending', 'in-progress', 'resolved', 'rejected'].map(status => {
                    const info = getStatusColor(status)
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(selectedTicket.id, status)}
                        style={{
                          background: selectedTicket.status === status ? info.bg : 'rgba(255,255,255,0.5)',
                          border: `1.5px solid ${selectedTicket.status === status ? info.color : 'var(--surface-border-subtle)'}`,
                          color: selectedTicket.status === status ? info.color : 'var(--text-muted)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {status.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dates */}
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--surface-border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>📅 Created:</span> {selectedTicket.createdDate}
                </div>
                {selectedTicket.resolvedDate && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>✅ Resolved:</span> {selectedTicket.resolvedDate}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
