import { Star } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: 'K. Venkateswarlu',
      role: 'Paddy Farmer, Guntur (AP)',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=200&q=80',
      text: 'Sathya Bio BlastShield 75 WP completely saved my 5-acre paddy crop from neck blast after heavy rain. High quality product!'
    },
    {
      id: 2,
      name: 'Ramesh Patil',
      role: 'Cotton Grower, Yavatmal (MH)',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
      text: 'FlyKill Ultra controlled whitefly infestation in my cotton crop within 48 hours. Fast delivery and COD service.'
    },
    {
      id: 3,
      name: 'Subramaniam B.',
      role: 'Horticulture Farmer, Salem (TN)',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=200&q=80',
      text: 'RootVigor Gold organic biostimulant increased white root mass and fruit size in my tomato farm by 30%.'
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by 15,000+ Indian Farmers
          </h2>
          <p className="text-lg text-gray-600">
            Real results from paddy, cotton, tomato, and fruit growers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
              {/* Stars */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-800 mb-6 italic">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">15,000+</p>
              <p className="text-gray-600">Farmers Served</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">35</p>
              <p className="text-gray-600">Product Formulations</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">100%</p>
              <p className="text-gray-600">Bio-Certified Lab Tested</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">14+</p>
              <p className="text-gray-600">Years of Expertise</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
