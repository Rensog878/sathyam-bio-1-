import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="public-site-footer">
      {/* Main Footer */}
      <div className="public-footer-grid">
          {/* Brand */}
          <div>
            <h3>SATHYA <span>BIO</span></h3>
            <p>
              India's leading digital platform for high-efficacy bio-pesticides, crop protection chemicals, and soil health fertilizers.
            </p>
            <p>
              Providing 100% bio-certified products with fast express dispatch to 15,000+ farmers across India.
            </p>
          </div>

          {/* Store Categories */}
          <div><h4>Store Categories</h4><ul>
              <li><Link to="/categories?category=Fungicide">Bio-Fungicides</Link></li><li><Link to="/categories?category=Insecticide">Insecticides</Link></li><li><Link to="/categories?category=Herbicide">Herbicides</Link></li><li><Link to="/categories?category=Bio-Stimulant">Bio-Stimulants</Link></li><li><Link to="/categories?category=Nematicide">Nematicides</Link></li>
            </ul>
          </div>

          {/* Top Crops */}
          <div><h4>Top Crops</h4><ul>
              <li><Link to="/crops?crop=Paddy%20%2F%20Rice">Paddy / Rice Care</Link></li>
              <li><Link to="/crops?crop=Cotton">Cotton Protection</Link></li>
              <li><Link to="/crops?crop=Vegetables">Tomato & Vegetables</Link></li>
              <li><Link to="/crops?crop=Sugarcane">Sugarcane Care</Link></li>
              <li><Link to="/crops?crop=Horticulture">Horticulture & Fruits</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div><h4>Customer Support</h4><ul>
              <li className="flex items-center space-x-2">
                <Phone size={16} />
                <div>
                  <p>Toll Free</p>
                  <p>1800-425-9999</p>
                </div>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={16} />
                <div>
                  <p>Email</p>
                  <p>support@sathyabio.com</p>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin size={16} />
                <div>
                  <p>Address</p>
                  <p>Sathya Bio Tech Park<br />Hyderabad, India</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <hr />

        {/* Bottom Footer */}
        <div className="public-footer-bottom">
          <div>
            <p>© 2026 Sathya Bio Agro Tech Ltd. All rights reserved.</p>
          </div>

          <div>
            <a href="#" className="hover:text-green-400 transition">Privacy Policy</a>
            <a href="#" className="hover:text-green-400 transition">Terms of Sale</a>
            <a href="#" className="hover:text-green-400 transition">Refund Policy</a>
          </div>

          <div className="public-social-links">
            <a href="#" className="text-gray-500 hover:text-green-400 transition">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-500 hover:text-green-400 transition">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-500 hover:text-green-400 transition">
              <Instagram size={20} />
            </a>
          </div>
        </div>

      {/* Payment Methods */}
      <div className="public-payment-strip">
          <p>✓ 100% Secure Payment (UPI, COD, NetBanking) | ✓ Express Delivery | ✓ 24/7 Support</p>
        </div>
    </footer>
  )
}
