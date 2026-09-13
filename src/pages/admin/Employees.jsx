import { useState } from 'react'
import { getEmployeeList, getEmployeeDetails } from '../../context/AuthContext'
import { Search, Clock, Mail, Phone, Building2, Calendar, ChevronRight } from 'lucide-react'

export default function Employees() {
  const [employees] = useState(() => getEmployeeList())
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.mobile.includes(search) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="eyebrow">Organization</div>
          <h1>👥 Employee Management</h1>
          <p>View employee information, login history, and performance data</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, mobile, email, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedEmployee ? '1fr 380px' : '1fr', gap: '20px', alignItems: 'start' }}>
        {/* Employees List */}
        <div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No employees found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(emp => (
                <div
                  key={emp._id}
                  className="card"
                  onClick={() => setSelectedEmployee(emp)}
                  style={{
                    cursor: 'pointer',
                    borderLeft: selectedEmployee?._id === emp._id ? '4px solid var(--brand-500)' : '4px solid transparent',
                    background: selectedEmployee?._id === emp._id ? 'rgba(94,99,255,0.05)' : 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {emp.name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>📱 {emp.mobile}</div>
                      <div>🏢 {emp.department}</div>
                      <div>✉️ {emp.email}</div>
                      <span className={`badge ${emp.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{emp.status}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee Details Panel */}
        {selectedEmployee && (
          <div className="card" style={{ position: 'sticky', top: '100px' }}>
            <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', paddingBottom: '12px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Employee Details
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Full Name
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedEmployee.name}
                </div>
              </div>

              {/* Contact */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Contact
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Phone size={14} /> {selectedEmployee.mobile}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Mail size={14} /> {selectedEmployee.email}
                  </div>
                </div>
              </div>

              {/* Department */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Department
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <Building2 size={16} /> {selectedEmployee.department}
                </div>
              </div>

              {/* Join Date */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Joined Date
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <Calendar size={16} /> {selectedEmployee.joinDate}
                </div>
              </div>

              {/* Last Login */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Last Login
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: selectedEmployee.lastLogin ? 'var(--brand-600)' : 'var(--text-muted)' }}>
                  <Clock size={16} /> {selectedEmployee.lastLogin || 'Never logged in'}
                </div>
              </div>

              {/* Status */}
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--surface-border-subtle)' }}>
                <span className={`badge ${selectedEmployee.status === 'active' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.8rem' }}>
                  {selectedEmployee.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
