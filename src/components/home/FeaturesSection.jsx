import { Upload, Smartphone, MessageCircle, CheckCircle } from 'lucide-react'

export default function FeaturesSection() {
  const features = [
    {
      id: 1,
      title: 'Soil Report Analyzer',
      subtitle: 'AI SOIL ENGINE',
      description: 'Upload lab PDF & get N-P-K nutrient remedies',
      icon: '🔬',
      image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&q=80',
      cta: 'Upload Soil Report'
    },
    {
      id: 2,
      title: 'AI Leaf Scanner',
      subtitle: 'INSTANT DIAGNOSTIC',
      description: 'Upload leaf photo for 10-second disease check',
      icon: '🍃',
      image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&q=80',
      cta: 'Scan Leaf'
    },
    {
      id: 3,
      title: 'Automated Field Assistant',
      subtitle: '24/7 WHATSAPP AI',
      description: 'Get instant pesticide dosage guides & disease remedies directly on WhatsApp',
      icon: '💬',
      image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&q=80',
      cta: 'Chat on WhatsApp'
    }
  ]

  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Farming Solutions
          </h2>
          <p className="text-lg text-gray-600">
            Smart tools to protect your crops and maximize yield
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.id} className="group">
              {/* Image */}
              <div className="relative h-64 rounded-2xl overflow-hidden mb-6 shadow-lg group-hover:shadow-2xl transition">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/20"></div>
              </div>

              {/* Content */}
              <div>
                <div className="inline-block">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                    {feature.subtitle}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">
                  {feature.title}
                </h3>

                <p className="text-gray-600 mb-6">
                  {feature.description}
                </p>

                <button className="inline-flex items-center text-green-600 font-bold hover:text-green-700">
                  <span>{feature.cta}</span>
                  <span className="ml-2">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Whitespace AI Integration */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  WhatsApp N8N Automation Agent
                </h3>
                <p className="text-gray-700 mb-4">
                  See how automated N8N workflows assist farmers via WhatsApp 24/7
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-700"><strong>WhatsApp Webhook</strong> - Receives farmer incoming message & photo</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-700"><strong>AI Parser</strong> - Extracts crop type & symptoms</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-700"><strong>Catalog Lookup</strong> - Matches exact fungicide remedy</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-700"><strong>Response</strong> - Sends instant dosage & order button</span>
                  </li>
                </ul>
                <button className="mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition">
                  Run N8N Test Flow
                </button>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="bg-gray-100 rounded-lg p-4 space-y-4">
                  <div className="text-sm text-gray-600 font-mono">
                    <p>→ WhatsApp Webhook</p>
                    <p className="text-green-600 mt-2">✓ AI Disease Parser</p>
                    <p className="text-green-600 mt-2">✓ Catalog Lookup DB</p>
                    <p className="text-green-600 mt-2">✓ WhatsApp Response</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-bold text-green-600">Status: Ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
