import { Mail, Heart } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

export default function NewsletterSignup() {
  const [phone, setPhone] = useState('')
  const [crop, setCrop] = useState('Paddy / Rice')

  const submit = async event => {
    event.preventDefault()
    try {
      await axios.post('/api/advisory/subscribe', { phone, crop })
      toast.success('Your crop advisory subscription is confirmed.')
      setPhone('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to subscribe right now.')
    }
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-green-600 to-green-700 text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="inline-block mb-6">
          <span className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold">
            🌾 Join Our Community
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Get Weekly Crop & Pesticide Recommendations
        </h2>

        <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
          Join 15,000+ farmers receiving our free seasonal advisory newsletter. 
          Kharif & Rabi crop schedules, disease alerts, and exclusive offers every week.
        </p>

        {/* Newsletter Form */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
          <form className="flex flex-col sm:flex-row gap-4" onSubmit={submit}>
            <input
              type="tel"
              placeholder="Enter your WhatsApp number"
              value={phone}
              onChange={event => setPhone(event.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
            <select value={crop} onChange={event => setCrop(event.target.value)} className="px-4 py-3 rounded-lg text-gray-900">
              <option>Paddy / Rice</option>
              <option>Cotton</option>
              <option>Tomato</option>
              <option>Wheat</option>
              <option>Sugarcane</option>
            </select>
            <button
              type="submit"
              className="bg-white text-green-600 hover:bg-green-50 font-bold px-8 py-3 rounded-lg transition"
            >
              Subscribe Free
            </button>
          </form>
          <p className="text-sm text-green-100 mt-3">
            No spam. Unsubscribe anytime. Available in 6 South Indian languages.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="text-2xl mb-2">📅</div>
            <p className="text-sm">Kharif & Rabi Schedules</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="text-2xl mb-2">🚨</div>
            <p className="text-sm">Disease & Pest Alerts</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="text-2xl mb-2">🎁</div>
            <p className="text-sm">Exclusive Offers & Deals</p>
          </div>
        </div>
      </div>
    </section>
  )
}
