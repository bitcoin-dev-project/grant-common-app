'use client'

import Image from 'next/image'
import { useState } from 'react'

type FeaturedOrgProps = {
  name: string
  logo: string
  description: string
  accentColor: string
}

export default function FeaturedOrg({ name, logo, description, accentColor }: FeaturedOrgProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="bg-white rounded-xl overflow-hidden hover:shadow-xl transform transition-all duration-300 gradient-border group"
      style={{ 
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`h-2 ${accentColor}`}></div>
      <div className="p-6">
        <div className="w-20 h-20 mb-6 relative flex items-center justify-center bg-gray-50 rounded-md p-2">
          <Image 
            src={logo} 
            alt={`${name} logo`} 
            fill 
            className="object-contain"
          />
        </div>
        
        <div className="mb-2 flex items-center">
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          <svg 
            className={`ml-2 w-5 h-5 transform transition-transform duration-300 ${isHovered ? 'translate-x-1 opacity-100' : 'opacity-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M5 7l5 5-5 5" />
          </svg>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        
        <div className={`mt-6 pt-4 border-t border-gray-100 flex justify-between items-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-sm font-medium text-gray-500">Learn more</span>
          <div className={`w-8 h-8 rounded-full ${accentColor} flex items-center justify-center`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
} 