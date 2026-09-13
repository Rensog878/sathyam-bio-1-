import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { GripVertical, Plus, Save, Trash2 } from 'lucide-react'

const TYPES = ['text', 'email', 'tel', 'number', 'date', 'textarea', 'select']

export default function ProfileFields() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    axios.get('/api/admin/profile-fields').then(({ data }) => setFields(data.data || [])).catch(() => toast.error('Could not load profile form')).finally(() => setLoading(false))
  }, [])

  const update = (index, patch) => setFields(current => current.map((field, position) => position === index ? { ...field, ...patch } : field))
  const add = () => setFields(current => [...current, { id: `profile-field-${Date.now()}`, title: 'New information', type: 'text', required: false, editable: true, options: [] }])
  const remove = index => setFields(current => current.filter((_, position) => position !== index))
  const save = async () => {
    setSaving(true)
    try {
      const { data } = await axios.put('/api/admin/profile-fields', { fields })
      setFields(data.data)
      toast.success('Profile form saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save profile form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-fields-page animate-fade-in">
      <div className="page-header"><div><p className="eyebrow">CUSTOMER EXPERIENCE</p><h1>Personal information form</h1><p>Create the titles and input types customers see on their profile page.</p></div><div className="profile-fields-actions"><button className="btn btn-secondary" onClick={add}><Plus size={16} /> Add field</button><button className="btn btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save form'}</button></div></div>
      <div className="card profile-field-list">
        {loading ? <div className="empty-state"><p>Loading form fields...</p></div> : fields.map((field, index) => <div className="profile-field-row" key={field.id}><GripVertical size={17} className="profile-drag-icon" /><input className="profile-field-title" value={field.title} onChange={event => update(index, { title: event.target.value })} placeholder="Field title" /><select value={field.type} onChange={event => update(index, { type: event.target.value })}>{TYPES.map(type => <option key={type}>{type}</option>)}</select><label className="profile-checkbox"><input type="checkbox" checked={field.required} onChange={event => update(index, { required: event.target.checked })} /> Required</label><label className="profile-checkbox"><input type="checkbox" checked={field.editable !== false} onChange={event => update(index, { editable: event.target.checked })} /> Customer can edit</label><button className="icon-action danger" title="Remove field" onClick={() => remove(index)}><Trash2 size={16} /></button></div>)}
      </div>
      <div className="card profile-field-guidance"><strong>Recommended customer information</strong><p>Collect identity and contact details, farm location, primary crop, acreage, preferred language, and delivery notes. Keep phone number and account role controlled by the system.</p></div>
    </div>
  )
}
