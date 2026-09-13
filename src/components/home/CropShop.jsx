export default function CropShop() {
  const crops = [
    {
      id: 1,
      name: 'Paddy / Rice',
      tagline: 'BLAST DEFENSE',
      image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=400&q=80',
      icon: '🍚'
    },
    {
      id: 2,
      name: 'Cotton',
      tagline: 'WHITEFLY SHIELD',
      image: 'https://images.unsplash.com/photo-1605001011156-cbf0b0f67a35?w=400&q=80',
      icon: '🌾'
    },
    {
      id: 3,
      name: 'Tomato',
      tagline: 'BLIGHT CARE',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
      icon: '🍅'
    },
    {
      id: 4,
      name: 'Wheat',
      tagline: 'RUST CONTROL',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
      icon: '🌾'
    },
    {
      id: 5,
      name: 'Sugarcane',
      tagline: 'BORER SOLUTION',
      image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&q=80',
      icon: '🎋'
    },
    {
      id: 6,
      name: 'Corn / Maize',
      tagline: 'ARMYWORM DEFENSE',
      image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&q=80',
      icon: '🌽'
    },
    {
      id: 7,
      name: 'Grapes',
      tagline: 'MILDEW PROTECT',
      image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&q=80',
      icon: '🍇'
    },
    {
      id: 8,
      name: 'Potato',
      tagline: 'TUBER GUARD',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
      icon: '🥔'
    }
  ]

  return (
    <section id="crops" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Crop
          </h2>
          <p className="text-lg text-gray-600">
            Select your crop to get customized pesticide & nutrient recommendations
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {crops.map((crop) => (
            <button
              key={crop.id}
              className="group cursor-pointer rounded-xl overflow-hidden hover:shadow-xl transition transform hover:-translate-y-2"
            >
              <div className="relative h-64 overflow-hidden bg-gray-300">
                <img
                  src={crop.image}
                  alt={crop.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col justify-end p-4">
                  <p className="text-sm font-bold text-yellow-300 mb-2">{crop.tagline}</p>
                  <h3 className="text-lg font-bold text-white">{crop.name}</h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
