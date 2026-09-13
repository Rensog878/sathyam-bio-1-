import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'

const SAMPLE_TICKETS = [
  { id: 'TKT-001', farmer: 'Ramesh Kumar', crop: 'Paddy', issue: 'Severe blast on 3 acres — yellowish brown lesions on all leaves', severity: 'High', status: 'Open', date: '2026-08-30', replies: [] },
  { id: 'TKT-002', farmer: 'Meena Devi',   crop: 'Tomato', issue: 'Leaf curl virus suspected — plants showing upward curling and yellowing', severity: 'Medium', status: 'In Progress', date: '2026-08-29', replies: ['Agronomist: Apply Imidacloprid 17.8% SL @ 100ml/acre to control the vector whitefly. Remove severely infected plants.'] },
]

export default function Tickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState(SAMPLE_TICKETS)
  const [newTicket, setNewTicket] = useState({ crop: '', issue: '', severity: 'Medium' })
  const [replyText, setReplyText] = useState({})
  const [showForm, setShowForm] = useState(false)

  const submitTicket = (e) => {
    e.preventDefault()
    const ticket = { id: `TKT-00${tickets.length + 3}`, farmer: user?.name, crop: newTicket.crop, issue: newTicket.issue, severity: newTicket.severity, status: 'Open', date: new Date().toISOString().split('T')[0], replies: [] }
    setTickets([ticket, ...tickets])
    setNewTicket({ crop: '', issue: '', severity: 'Medium' })
    setShowForm(false)
    toast.success('Ticket submitted! Our agronomist will respond within 4 hours.')
  }

  const addReply = (id) => {
    const reply = replyText[id]
    if (!reply?.trim()) return
    setTickets(tickets.map(t => t.id === id ? { ...t, replies: [...t.replies, `${user?.name}: ${reply}`], status: 'In Progress' } : t))
    setReplyText(r => ({ ...r, [id]: '' }))
    toast.success('Reply sent')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1>🎫 Field Support Tickets</h1><p>{tickets.length} total tickets</p></div>
        {user?.role === 'farmer' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ New Ticket</button>
        )}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="card animate-slide-up" style={{ marginBottom: '24px' }}>
          <div className="card-header"><div className="card-title">🆕 Submit New Support Ticket</div></div>
          <form onSubmit={submitTicket}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Crop *</label>
                <input className="form-input" placeholder="e.g. Paddy, Cotton" value={newTicket.crop} onChange={e => setNewTicket(t => ({ ...t, crop: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Severity</label>
                <select className="form-select" value={newTicket.severity} onChange={e => setNewTicket(t => ({ ...t, severity: e.target.value }))}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Describe the Issue *</label>
              <textarea className="form-textarea" placeholder="Describe symptoms, affected area, and what you've tried..." value={newTicket.issue} onChange={e => setNewTicket(t => ({ ...t, issue: e.target.value }))} required rows={3} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Submit Ticket</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tickets.map(ticket => (
          <div key={ticket.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong style={{ color: 'var(--brand-400)' }}>{ticket.id}</strong>
                <span className={`badge ${ticket.severity === 'High' || ticket.severity === 'Critical' ? 'badge-red' : ticket.severity === 'Medium' ? 'badge-yellow' : 'badge-gray'}`}>{ticket.severity}</span>
                <span className={`badge ${ticket.status === 'Open' ? 'badge-orange' : ticket.status === 'In Progress' ? 'badge-blue' : 'badge-green'}`}>{ticket.status}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ticket.date}</span>
            </div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>{ticket.farmer} — {ticket.crop}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.6 }}>{ticket.issue}</div>

            {/* Replies */}
            {ticket.replies.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                {ticket.replies.map((r, i) => (
                  <div key={i} style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    💬 {r}
                  </div>
                ))}
              </div>
            )}

            {/* Reply Box */}
            {ticket.status !== 'Resolved' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="form-input" style={{ flex: 1 }} placeholder="Write a reply..." value={replyText[ticket.id] || ''} onChange={e => setReplyText(r => ({ ...r, [ticket.id]: e.target.value }))} />
                <button className="btn btn-primary btn-sm" onClick={() => addReply(ticket.id)}>Send</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
