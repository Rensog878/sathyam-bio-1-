import { useLanguage } from '../context/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, languages } = useLanguage()

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--dark-800)', border: '1px solid var(--surface-border-subtle)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
      <Globe size={15} style={{ color: 'var(--brand-400)' }} />
      <select
        className="lang-switcher-select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          paddingRight: '4px'
        }}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} style={{ background: '#132313', color: '#fff' }}>
            {l.flag} {l.native}
          </option>
        ))}
      </select>
    </div>
  )
}
