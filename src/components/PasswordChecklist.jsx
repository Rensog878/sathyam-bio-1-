import { passwordChecks } from '../utils/passwordRules'

const visuallyHidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }

// Live list of password rules under a password input: each rule turns green
// with a tick as soon as the typed password meets it.
export default function PasswordChecklist({ password = '', role = 'farmer', phone = '' }) {
  const checks = passwordChecks(password, { role, phone })

  return (
    <ul aria-live="polite" style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 2, fontSize: '0.76rem' }}>
      {checks.map(check => (
        <li key={check.label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: check.ok ? '#16a34a' : 'var(--text-muted)', fontWeight: check.ok ? 600 : 500 }}>
          <span aria-hidden="true" style={{ width: 14, textAlign: 'center' }}>{check.ok ? '✓' : '○'}</span>
          <span>{check.label}</span>
          <span style={visuallyHidden}>{check.ok ? '(met)' : '(not met yet)'}</span>
        </li>
      ))}
    </ul>
  )
}
