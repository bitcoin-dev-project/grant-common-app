'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'framer-motion'

type ProcessStepProps = {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}

export default function ProcessStep({ number, title, description, icon }: ProcessStepProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hasAnimated, setHasAnimated] = useState(false)
  
  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true)
    }
  }, [isInView, hasAnimated])
  
  return (
    <div 
      ref={ref} 
      className={`text-center transform transition-all duration-700 ease-out ${
        hasAnimated 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-12 opacity-0'
      }`}
      style={{ 
        transitionDelay: `${(number - 1) * 150}ms`
      }}
    >
      <div className="group">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 sm:mb-6 relative">
          <div className="absolute inset-0 rounded-full bg-amber-400 opacity-0 group-hover:opacity-10 transform group-hover:scale-110 transition-all duration-300" aria-hidden="true"></div>
          <span className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-md">
            {number}
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8">
            {icon}
          </div>
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 group-hover:text-amber-600 transition-colors">
          {title}
        </h3>
        
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mx-auto max-w-xs px-4 sm:px-0">
          {description}
        </p>
      </div>
    </div>
  )
} 