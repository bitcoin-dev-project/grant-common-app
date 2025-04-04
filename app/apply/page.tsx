"use client"
import GrantApplicationForm from '../../components/GrantApplicationForm'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { motion } from 'framer-motion'

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="pt-24 pb-12">
        {/* Header */}
        <div className="bg-gray-900 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 mix-blend-multiply"></div>
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0" 
              style={{ 
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', 
                backgroundSize: '30px 30px' 
              }}
            ></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16">
            <motion.div 
              className="max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/" className="inline-flex items-center text-gray-300 hover:text-yellow-300 mb-8 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to home
              </Link>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Bitcoin Grant Application</h1>
              <p className="text-xl text-gray-300 max-w-3xl">
                Complete the form below to apply for funding from Bitcoin organizations. Your application will be sent to the organizations you select.
              </p>
            </motion.div>
          </div>
          
          {/* Wave pattern */}
          <div className="absolute bottom-0 left-0 right-0 h-8 transform translate-y-1/2">
            <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 48H1440V0C1200 32 960 48 720 48C480 48 240 32 0 0V48Z" fill="#F9FAFB"/>
            </svg>
          </div>
        </div>

        {/* Application Form Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
          <motion.div 
            className="bg-white rounded-xl shadow-xl overflow-hidden gradient-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 px-8">
              <h2 className="text-2xl font-bold">Grant Application Form</h2>
              <p className="text-gray-300 text-sm mt-1">
                All fields marked with an asterisk (*) are required. Be thorough in your responses for the best chance of success.
              </p>
            </div>
            <div className="p-8">
              <GrantApplicationForm />
            </div>
          </motion.div>
          
          {/* Additional Information Cards */}
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md gradient-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Application Tips</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Be specific about your project goals and timeline</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Clearly explain how your project contributes to Bitcoin</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Include links to your GitHub or prior work</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Provide a detailed budget breakdown</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md gradient-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">What Happens Next</h3>
              <ol className="space-y-3 text-gray-600 list-decimal list-inside">
                <li>Your application will be sent to the organizations you select</li>
                <li>Each organization will review according to their own criteria</li>
                <li>You may be contacted for additional information</li>
                <li>Organizations will reach out directly if they&apos;re interested in funding your project</li>
              </ol>
              <p className="mt-4 text-sm text-gray-500">
                Review times vary by organization, typically ranging from 2-8 weeks.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
} 