'use client'

import Image from 'next/image'
import { useState } from 'react'
import SmartLink from './SmartLink'

type FeaturedOrgProps = {
  name: string
  logo: string
  description: string
  accentColor: string
  url?: string
}

export default function FeaturedOrg({ name, logo, description, accentColor, url }: FeaturedOrgProps) {
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
      <div className="p-4 sm:p-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 relative flex items-center justify-center bg-gray-50 rounded-md p-2">
          <Image 
            src={logo} 
            alt={`${name} logo`} 
            fill 
            className="object-contain"
          />
        </div>
        
        <div className="mb-2 flex items-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{name}</h3>
          <svg 
            className={`ml-2 w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-300 ${isHovered ? 'translate-x-1 opacity-100' : 'opacity-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M5 7l5 5-5 5" />
          </svg>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        
        {url && (
          <SmartLink
            href={url}
            className={`mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 flex justify-between items-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} hover:no-underline`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">Learn more</span>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${accentColor} flex items-center justify-center transform transition-transform hover:scale-110`}>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </SmartLink>
        )}
      </div>
    </div>
  )
} 