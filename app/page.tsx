"use client"

import SmartLink from '../components/SmartLink'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import FeaturedOrg from '../components/FeaturedOrg'
import ProcessStep from '../components/ProcessStep'
import FaqAccordion from '../components/FaqAccordion'
import Footer from '../components/Footer'
import { withAssetPrefix } from '../lib/utils'
import organizationsConfig from '../config/organizations'

export default function Home() {

  const processSteps = [
    {
      number: 1,
      title: "Complete One Application",
      description: "Fill out a single comprehensive application with details about your Bitcoin project.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      )
    },
    {
      number: 2,
      title: "Choose Organizations",
      description: "Select which Bitcoin funding organizations you want to apply to from our partners.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      )
    },
    {
      number: 3,
      title: "Get Funding",
      description: "Selected organizations will review your application and reach out directly if interested.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
  ];

  return (
    <main className="min-h-screen relative">
      <Navbar />
      
      {/* Hero Section */}
      <Hero />

      {/* Featured Organizations */}
      <section id="organizations" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Partner Organizations</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Apply once and reach these premier Bitcoin funding organizations dedicated to advancing Bitcoin development and adoption.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {organizations.slice(0, 3).map((org, index) => (
              <FeaturedOrg 
                key={index}
                name={org.name} 
                logo={org.logo} 
                description={org.description} 
                accentColor={org.accentColor}
              />
            ))}
          </div>
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {organizations.slice(3).map((org, index) => (
              <FeaturedOrg 
                key={index + 3}
                name={org.name} 
                logo={org.logo} 
                description={org.description} 
                accentColor={org.accentColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-yellow-300"></div>
          <div className="absolute bottom-1/3 -right-20 w-64 h-64 rounded-full bg-orange-300"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-amber-100 text-amber-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-5">
              Simplified Process
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">How It Works</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Our streamlined process connects your Bitcoin project with the right funding organizations, saving you time and maximizing your chances of success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {processSteps.map((step) => (
              <ProcessStep 
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Why Use The Common Application</h2>
            <p className="text-gray-300 max-w-3xl mx-auto px-4 sm:px-0 text-sm sm:text-base">
              We&apos;re simplifying the grant application process for the Bitcoin ecosystem
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center p-4 sm:p-6 bg-gray-800/50 rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-yellow-400 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">One Application</h3>
              <p className="text-gray-400 text-sm sm:text-base">Apply to multiple organizations with a single form</p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-gray-800/50 rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-yellow-400 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Save Time</h3>
              <p className="text-gray-400 text-sm sm:text-base">No need to complete multiple applications</p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-gray-800/50 rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-yellow-400 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Multiple Organizations</h3>
              <p className="text-gray-400 text-sm sm:text-base">Access funding from leading Bitcoin organizations</p>
            </div>
            <div className="text-center p-4 sm:p-6 bg-gray-800/50 rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-yellow-400 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Better Security</h3>
              <p className="text-gray-400 text-sm sm:text-base">Submit your information securely in one place</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FaqAccordion />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-amber-500 to-yellow-500 text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-4 sm:px-0">Ready to Apply for Bitcoin Funding?</h2>
          <p className="text-lg sm:text-xl text-black/80 max-w-3xl mx-auto mb-8 sm:mb-10 px-4 sm:px-0">
            Complete our common application form to submit your Bitcoin project for funding consideration from multiple organizations.
          </p>
          <SmartLink 
            href="/apply" 
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-black hover:bg-gray-900 text-white font-bold rounded-lg text-base sm:text-lg transition-all shadow-lg hover:shadow-xl"
          >
            Start Your Application
          </SmartLink>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
} 