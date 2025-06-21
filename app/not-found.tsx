'use client'

import SmartLink from '../components/SmartLink'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center px-4 py-24">
        <div className="max-w-lg w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <svg className="w-64 h-64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="3"/>
                <path d="M15 12L12 7L9 12M12 7V17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div className="mb-8">
              <span className="text-9xl font-extrabold bg-gradient-to-r from-yellow-500 to-amber-600 text-transparent bg-clip-text">404</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            
            <p className="text-gray-600 mb-8">
              The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/" 
                className="bitcoin-btn px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold rounded-lg shadow-lg hover:shadow-yellow-500/30 transition-all"
              >
                Go to Homepage
              </Link>
              <Link 
                href="/apply" 
                className="bitcoin-btn px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg border border-gray-700 transition-all"
              >
                Apply for Funding
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 