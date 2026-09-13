import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Search, Menu, X } from 'lucide-react'
import Hero from '../components/home/Hero'
import CategoryShop from '../components/home/CategoryShop'
import CropShop from '../components/home/CropShop'
import FeaturesSection from '../components/home/FeaturesSection'
import ProductCatalog from '../components/home/ProductCatalog'
import Testimonials from '../components/home/Testimonials'
import NewsletterSignup from '../components/home/NewsletterSignup'
import Navigation from '../components/home/Navigation'
import Footer from '../components/home/Footer'

export default function Home() {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation cartCount={cartCount} />

      {/* Hero Section */}
      <Hero />

      {/* Shop by Category */}
      <CategoryShop />

      {/* Shop by Crop */}
      <CropShop />

      {/* Features/AI Services */}
      <FeaturesSection />

      {/* Product Catalog */}
      <ProductCatalog onAddToCart={() => setCartCount(c => c + 1)} />

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Footer */}
      <Footer />
    </div>
  )
}
