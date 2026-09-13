import { ArrowRight, Leaf, Zap, Shield } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-block">
              <span className="bg-green-200 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                🌾 India's #1 Bio-Pesticide Store
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Protect Your Crops.<br />
              Maximize Harvest Yield.
            </h1>

            <p className="text-lg text-gray-700">
              Order 100% bio-certified fungicides, insecticides, and soil enhancers online. 
              Direct express dispatch to 15,000+ Indian farmers across 28 states.
            </p>

            {/* Key Features */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Leaf className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">100% Bio-Certified Formulations</p>
                  <p className="text-sm text-gray-600">Lab-tested, ICAR approved products</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Same-Day Dispatch</p>
                  <p className="text-sm text-gray-600">Express delivery across India</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-gray-900">Cash On Delivery Available</p>
                  <p className="text-sm text-gray-600">Pay after delivery at your farm</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center space-x-2 transition">
                <span>Shop Catalog</span>
                <ArrowRight size={20} />
              </button>
              <button className="border-2 border-green-600 text-green-600 hover:bg-green-50 font-bold py-3 px-8 rounded-lg transition">
                Upload Soil Report
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-green-300">
              <div>
                <p className="text-2xl font-bold text-green-600">15,000+</p>
                <p className="text-sm text-gray-600">Farmers Served</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">28</p>
                <p className="text-sm text-gray-600">States Covered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">35</p>
                <p className="text-sm text-gray-600">Product Range</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="bg-green-300 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&q=80"
                alt="Soil Testing Laboratory"
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-lg p-4 w-48">
              <p className="text-sm font-bold text-gray-900">AI SOIL ENGINE</p>
              <p className="text-xs text-gray-600 mt-1">Instant N-P-K analysis & fertilizer recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
