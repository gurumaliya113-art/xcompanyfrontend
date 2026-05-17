import React from 'react'
import { Link } from 'react-router-dom'
import { GiOwl } from 'react-icons/gi'

const openEnquire = () =>
  window.dispatchEvent(new CustomEvent('open-enquire'))

export default function PublicFooter() {
  return (
    <footer className="bg-[#0F0F0F] text-white pt-20 pb-10 border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-14">
          {/* Brand */}
          <div className="md:col-span-1 pr-4">
            <div className="flex items-center gap-3 mb-5">
              <GiOwl className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold">excompany</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6 text-sm">
              We build software, AI tools, and digital systems that help businesses automate, scale, and grow sustainably.
            </p>
            <button
              type="button"
              onClick={openEnquire}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-7 py-2.5 text-sm font-bold transition-colors"
            >
              Book A Call
            </button>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-5">Solutions</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/solutions" className="text-gray-400 hover:text-orange-500 transition-colors">Custom Software</Link></li>
              <li><Link to="/solutions" className="text-gray-400 hover:text-orange-500 transition-colors">Website Development</Link></li>
              <li><Link to="/solutions" className="text-gray-400 hover:text-orange-500 transition-colors">AI & Automation</Link></li>
              <li><Link to="/solutions" className="text-gray-400 hover:text-orange-500 transition-colors">Fleet Management</Link></li>
              <li><Link to="/solutions" className="text-gray-400 hover:text-orange-500 transition-colors">Restaurant Systems</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-gray-400 hover:text-orange-500 transition-colors">Home</Link></li>
              <li><Link to="/portfolio" className="text-gray-400 hover:text-orange-500 transition-colors">Our Work</Link></li>
              <li><Link to="/industries" className="text-gray-400 hover:text-orange-500 transition-colors">Industries</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-orange-500 transition-colors">About</Link></li>
              <li><Link to="/blogs" className="text-gray-400 hover:text-orange-500 transition-colors">Blogs</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-orange-500 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-3">Office</h4>
            <p className="text-gray-400 leading-relaxed mb-5 text-sm">
              Kailash Nagar, Narnaul
            </p>

            <h4 className="font-bold text-lg mb-2">Call Us</h4>
            <a href="tel:+918053317489" className="block text-gray-400 hover:text-orange-500 transition-colors mb-5 text-sm">
              +91 80533 17489
            </a>

            <h4 className="font-bold text-lg mb-2">Email</h4>
            <a href="mailto:business.gurutron@gmail.com" className="block text-gray-400 hover:text-orange-500 transition-colors text-sm break-all">
              business.gurutron@gmail.com
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} excompany. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-500 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
