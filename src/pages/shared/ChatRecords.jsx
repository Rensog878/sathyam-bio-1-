const RECORDS = [
  { session: 'SES-001', user: 'Ramesh Kumar', date: '2026-08-30 14:22', messages: 6, resolved: true, preview: 'Q: What to use for paddy blast? A: Apply BlastShield 75 WP @ 150g/acre...' },
  { session: 'SES-002', user: 'Visitor #4521', date: '2026-08-30 11:05', messages: 3, resolved: false, preview: 'Q: Do you deliver to Trichy? A: Yes! Free delivery above ₹999...' },
  { session: 'SES-003', user: 'Meena Devi',    date: '2026-08-29 09:40', messages: 9, resolved: true, preview: 'Q: Tomato leaf curl virus treatment? A: Imidacloprid 17.8% SL @ 100ml/acre...' },
]

export default function ChatRecords() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1>💬 Chat Records</h1><p>{RECORDS.length} recent sessions</p></div>
        <button className="btn btn-secondary">📥 Export CSV</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Session</th><th>User</th><th>Date & Time</th><th>Messages</th><th>Status</th><th>Preview</th></tr></thead>
            <tbody>
              {RECORDS.map(r => (
                <tr key={r.session}>
                  <td><code style={{ color: 'var(--brand-400)', fontSize: '0.8rem' }}>{r.session}</code></td>
                  <td style={{ fontWeight: 600 }}>{r.user}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.date}</td>
                  <td style={{ textAlign: 'center' }}>{r.messages}</td>
                  <td><span className={`badge ${r.resolved ? 'badge-green' : 'badge-yellow'}`}>{r.resolved ? '✓ Resolved' : '⏳ Open'}</span></td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.preview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
