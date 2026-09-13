import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import PasswordChecklist from '../components/PasswordChecklist'
import { isPasswordValid, passwordPlaceholder } from '../utils/passwordRules'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    crop: 'Paddy / Rice', acreage: 3, village: '', district: '', state: 'Tamil Nadu'
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Phone accepts digits only, filtered as the user types.
  const setPhone = e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm(f => ({ ...f, phone: digits }))
  }

  // Live, per-field messages shown under each input.
  const phoneError = () => {
    if (!form.phone) return ''
    // Flag a bad first digit immediately, before the length check.
    if (!/^[6-9]/.test(form.phone)) return 'An Indian mobile number must start with 6, 7, 8 or 9.'
    if (form.phone.length < 10) return `Enter all 10 digits (${form.phone.length}/10).`
    return ''
  }
  const confirmError = () => {
    if (!form.confirmPassword) return ''
    return form.password !== form.confirmPassword ? 'Passwords do not match.' : ''
  }
  const nameError = () => {
    if (!form.name.trim()) return ''
    return form.name.replace(/[^A-Za-zÀ-ɏ]/g, '').length < 2 ? 'Please enter your name, not a number.' : ''
  }

  const FieldError = ({ message }) => message
    ? <small style={{ display: 'block', marginTop: 4, color: '#dc2626', fontSize: '0.76rem', fontWeight: 600 }}>{message}</small>
    : null

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!isPasswordValid(form.password, { phone: form.phone.trim() })) { toast.error('Your password does not meet all the rules listed under it'); return }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (!/^\d{10}$/.test(form.phone.trim())) { toast.error('Enter a valid 10-digit WhatsApp number'); return }

    setLoading(true)
    try {
      await register({ ...form, role: 'farmer' })
      toast.success('Registration successful! Welcome to Sathya Bio 🌿')
      navigate('/', { replace: true })
    } catch (err) {
      // Already has an account — send them to sign in with the number carried over.
      if (err?.response?.data?.alreadyRegistered) {
        toast.info('This number is already registered. Please sign in.')
        navigate('/#login')
        return
      }
      toast.error(err?.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{ justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px', minHeight: '100vh' }}>
      <div className="login-card animate-slide-up" style={{ maxWidth: '560px' }}>
        <div className="login-logo">
          <div className="login-logo-icon">🌱</div>
          <div className="login-logo-text">
            <div className="brand">Join Sathya Bio</div>
            <div className="tagline">Farmer Self-Registration</div>
          </div>
        </div>

        <>
            <h2 className="login-title">Create your account</h2>
            <p className="login-subtitle">Register to access our product store, crop advisory, and order tracking</p>

            <form onSubmit={handleRegister}>
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Your name" value={form.name} onChange={set('name')} required />
                  <FieldError message={nameError()} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    className="form-input"
                    placeholder="10-digit number"
                    value={form.phone}
                    onChange={setPhone}
                    required
                    maxLength={10}
                    inputMode="numeric"
                  />
                  <FieldError message={phoneError()} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Village / Town</label>
                  <input className="form-input" placeholder="Village name" value={form.village} onChange={set('village')} />
                </div>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input className="form-input" placeholder="District" value={form.district} onChange={set('district')} />
                </div>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Primary Crop *</label>
                  <select className="form-select" value={form.crop} onChange={set('crop')}>
                    {['Paddy / Rice', 'Cotton', 'Tomato', 'Wheat', 'Sugarcane', 'Corn / Maize', 'Citrus / Fruits', 'Grapes / Fruits', 'Potato', 'All Crops'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Farm Size (Acres)</label>
                  <input className="form-input" type="number" placeholder="e.g. 5" value={form.acreage} onChange={set('acreage')} min="0.5" step="0.5" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-select" value={form.state} onChange={set('state')}>
                  {['Tamil Nadu','Karnataka','Andhra Pradesh','Telangana','Kerala','Maharashtra','Gujarat','Punjab','Haryana','Rajasthan','Uttar Pradesh','Madhya Pradesh','Bihar','West Bengal','Odisha'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" placeholder={passwordPlaceholder('farmer')} value={form.password} onChange={set('password')} required autoComplete="new-password" />
                  <PasswordChecklist password={form.password} phone={form.phone} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input className="form-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                  <FieldError message={confirmError()} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? <><div className="spinner" /> Creating account...</> : '🌿 Create Account'}
              </button>
            </form>
        </>

        <div className="divider"><span>Already registered?</span></div>
        <Link to="/#login"><button className="btn btn-secondary btn-full">← Back to Login</button></Link>
      </div>
    </div>
  )
}
