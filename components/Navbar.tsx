'use client'

import SmartLink from './SmartLink'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  // Detect if we're on a light background page
  const isLightPage = pathname === '/apply'

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
      // Close mobile menu when scrolling
      if (mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrolled, mobileMenuOpen])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && event.target instanceof Element) {
        const nav = event.target.closest('nav')
        if (!nav) {
          setMobileMenuOpen(false)
        }
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [mobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLightPage 
          ? 'bg-white/98 backdrop-blur shadow-lg py-2' 
          : scrolled 
            ? 'bg-gray-900/98 backdrop-blur shadow-lg py-2' 
            : 'bg-transparent py-3 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <SmartLink href="/" className="flex items-center space-x-2">
            <div className={`relative w-7 h-7 sm:w-8 sm:h-8 ${scrolled || isLightPage ? '' : 'animate-pulse-subtle'}`}>
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="32" height="32" rx="16" fill={
                  isLightPage 
                    ? "#F3F4F6" 
                    : scrolled 
                      ? "#0D0E12" 
                      : "transparent"
                } />
                <path d="M20.5714 14.2857C21.3536 13.2768 21.2746 11.7143 19.8214 11C18.375 10.2857 16.5714 11 16.0714 11.5714L14.2143 13.4286" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12.1429 14.8571C11 15.8571 10.3536 18.0089 11.8929 19.2857C13.4286 20.5536 15.4286 19.8571 16 19.2857L17.8571 17.4286" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 7L16 25" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="7" r="1" fill="#F2A900"/>
                <circle cx="16" cy="25" r="1" fill="#F2A900"/>
              </svg>
            </div>
            <div>
              <span className={`font-bold text-base sm:text-lg transition-colors ${
                isLightPage 
                  ? 'text-gray-900' 
                  : scrolled 
                    ? 'text-white' 
                    : 'text-white/90'
              }`}>
                Bitcoin Grants
              </span>
            </div>
          </SmartLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <NavLink href="/#organizations" scrolled={scrolled} isLightPage={isLightPage}>Organizations</NavLink>
            <NavLink href="/#how-it-works" scrolled={scrolled} isLightPage={isLightPage}>How It Works</NavLink>
            <NavLink href="/#faq" scrolled={scrolled} isLightPage={isLightPage}>FAQ</NavLink>
            <SmartLink 
              href="/apply" 
              className={`bitcoin-btn px-4 py-2 sm:px-5 ${
                scrolled 
                ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                : 'bg-yellow-500/90 text-gray-900 hover:bg-yellow-500'
              }`}
            >
              Apply Now
            </SmartLink>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden transition-colors p-2 ${isLightPage ? 'text-gray-900' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="md:hidden fixed left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
              style={{ top: '100%', height: '100vh' }}
            />
            
            {/* Menu content */}
            <div className={`md:hidden absolute top-full left-0 right-0 shadow-lg border-t z-50 ${
              isLightPage 
                ? 'bg-white border-gray-200' 
                : 'bg-gray-900 border-gray-700'
            }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col space-y-1 py-3">
                  <MobileNavLink href="/#organizations" onClick={() => setMobileMenuOpen(false)} isLightPage={isLightPage}>
                    Organizations
                  </MobileNavLink>
                  <MobileNavLink href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} isLightPage={isLightPage}>
                    How It Works
                  </MobileNavLink>
                  <MobileNavLink href="/#faq" onClick={() => setMobileMenuOpen(false)} isLightPage={isLightPage}>
                    FAQ
                  </MobileNavLink>
                  <div className="pt-2">
                    <SmartLink 
                      href="/apply" 
                      className="bitcoin-btn w-full text-center px-4 py-3 sm:px-5 bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Apply Now
                    </SmartLink>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, scrolled, isLightPage, children }: { href: string, scrolled: boolean, isLightPage: boolean, children: React.ReactNode }) {
  return (
    <SmartLink 
      href={href} 
      className={`font-medium transition-colors hover:text-yellow-400 text-sm sm:text-base ${
        isLightPage 
          ? 'text-gray-700 hover:text-yellow-600' 
          : scrolled 
            ? 'text-gray-200' 
            : 'text-white/90'
      }`}
    >
      {children}
    </SmartLink>
  )
}

function MobileNavLink({ href, onClick, isLightPage, children }: { href: string, onClick: () => void, isLightPage: boolean, children: React.ReactNode }) {
  return (
    <SmartLink 
      href={href} 
      className={`block font-medium px-3 py-3 transition-all duration-200 text-base min-h-[44px] flex items-center rounded-md ${
        isLightPage 
          ? 'text-gray-700 hover:text-yellow-600 hover:bg-gray-50' 
          : 'text-gray-200 hover:text-yellow-400 hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      {children}
    </SmartLink>
  )
} 