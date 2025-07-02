'use client'

import SmartLink from './SmartLink'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Hero() {
  const [hasLoaded, setHasLoaded] = useState(false)
  
  useEffect(() => {
    setHasLoaded(true)
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  }

  const shapes = [
    { size: 'w-12 h-12', position: 'top-[15%] right-[15%]', rotation: 'rotate-12', animation: 'animate-pulse-subtle' },
    { size: 'w-16 h-16', position: 'bottom-[25%] left-[10%]', rotation: 'rotate-45', animation: 'animate-pulse-subtle' },
    { size: 'w-20 h-20', position: 'top-[10%] left-[20%]', rotation: '-rotate-12', animation: 'animate-pulse-subtle' },
    { size: 'w-8 h-8', position: 'bottom-[15%] right-[25%]', rotation: '-rotate-45', animation: 'animate-pulse-subtle' },
  ]

  return (
    <div className="relative overflow-hidden bg-gray-900 h-screen flex items-center">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-yellow-500/20 mix-blend-multiply"></div>
        {/* Bitcoin Symbols */}
        {shapes.map((shape, index) => (
          <div 
            key={index} 
            className={`absolute ${shape.position} ${shape.size} ${shape.rotation} ${shape.animation}`}
            style={{ animationDelay: `${index * 0.7}s` }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="rgba(242, 169, 0, 0.4)" strokeWidth="1" />
              <path d="M15 12L12 7L9 12M12 7V17" stroke="rgba(242, 169, 0, 0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        ))}
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 md:py-24 lg:py-32">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial="hidden"
          animate={hasLoaded ? "show" : "hidden"}
          variants={container}
        >
          <motion.div variants={item}>
            <div className="inline-flex items-center justify-center px-4 py-2 bg-gray-800/70 backdrop-blur-sm rounded-full text-sm font-medium text-yellow-400 mb-8 gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              Just Launched - One Application For All Organizations
            </div>
          </motion.div>

          <motion.h1 
            variants={item}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6"
          >
            Bitcoin Grants
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text">
              Common Application
            </span>
          </motion.h1>

          <motion.p 
            variants={item}
            className="text-xl text-gray-300 max-w-2xl mx-auto mb-10"
          >
            Apply once, reach multiple Bitcoin funding organizations. Submit your project for consideration and accelerate your path to funding.
          </motion.p>

          <motion.div 
            variants={item}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <SmartLink 
              href="/apply" 
              className="bitcoin-btn px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold rounded-lg text-lg shadow-lg hover:shadow-yellow-500/30 focus:ring-offset-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:shadow-xl transition-all duration-200"
            >
              Start Application
            </SmartLink>
            <SmartLink 
              href="#organizations" 
              className="bitcoin-btn px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg text-lg border border-gray-700 transition-all"
            >
              View Organizations
            </SmartLink>
          </motion.div>

          <motion.div 
            variants={item} 
            className="mt-16 flex justify-center"
          >
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-full px-6 py-3 flex items-center justify-center gap-3 shadow-inner border border-gray-700/50">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-white text-sm">Easy Application</span>
              </div>
              <span className="h-4 w-[1px] bg-gray-700"></span>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-white text-sm">5 Organizations</span>
              </div>
              <span className="h-4 w-[1px] bg-gray-700"></span>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white text-sm">Save Time</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Down Arrow */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <a 
          href="#organizations" 
          className="flex flex-col items-center text-gray-400 hover:text-yellow-400 transition-colors"
        >
          <span className="text-sm mb-2">Learn More</span>
          <svg 
            className="w-6 h-6 animate-bounce" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </a>
      </div>
    </div>
  )
} 