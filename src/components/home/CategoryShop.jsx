import { Bug, Leaf, Droplets, Sprout, Shield } from 'lucide-react'

export default function CategoryShop() {
  const categories = [
    {
      id: 1,
      name: 'Fungicides',
      icon: '🍄',
      description: 'Cure Blast, Blight, Powdery Mildew & Rust',
      color: 'from-purple-100 to-purple-50',
      borderColor: 'border-purple-200',
      image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400&q=80'
    },
    {
      id: 2,
      name: 'Insecticides',
      icon: '🐛',
      description: 'Control Whitefly, Bollworm, Aphids & Borer',
      color: 'from-red-100 to-red-50',
      borderColor: 'border-red-200',
      image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=400&q=80'
    },
    {
      id: 3,
      name: 'Bio-Stimulants',
      icon: '🌱',
      description: 'Root Vigor, Flowering & Fruit Mass Booster',
      color: 'from-green-100 to-green-50',
      borderColor: 'border-green-200',
      image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&q=80'
    },
    {
      id: 4,
      name: 'Herbicides',
      icon: '🌾',
      description: 'Selective Pre & Post Emergence Weed Control',
      color: 'from-yellow-100 to-yellow-50',
      borderColor: 'border-yellow-200',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80'
    },
    {
      id: 5,
      name: 'Nematicides',
      icon: '🛡️',
      description: 'Protect Roots Against Nematode Attacks',
      color: 'from-blue-100 to-blue-50',
      borderColor: 'border-blue-200',
      image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'
    },
    {
      id: 6,
      name: 'All 35 Formulations',
      icon: '📦',
      description: 'Browse complete Sathya Bio product range',
      color: 'from-indigo-100 to-indigo-50',
      borderColor: 'border-indigo-200',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'
    }
  ]

  return (
    <section id="categories" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600">
            Explore crop protection chemicals, bio-stimulants, and soil nutrients
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`group cursor-pointer rounded-2xl overflow-hidden border-2 ${category.borderColor} hover:shadow-lg transition transform hover:-translate-y-1`}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-gray-200">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent`}></div>
              </div>

              {/* Content */}
              <div className={`bg-gradient-to-br ${category.color} p-6`}>
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 text-left">{category.name}</h3>
                <p className="text-sm text-gray-700 mt-2 text-left">{category.description}</p>
                <div className="mt-4 flex items-center text-green-600 font-semibold group-hover:translate-x-1 transition">
                  <span>Shop Now</span>
                  <span className="ml-2">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
