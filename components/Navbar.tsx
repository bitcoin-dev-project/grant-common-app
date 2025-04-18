'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrolled])

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-900/95 backdrop-blur shadow-lg py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <div className={`relative w-8 h-8 ${scrolled ? '' : 'animate-pulse-subtle'}`}>
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="32" height="32" rx="16" fill={scrolled ? "#0D0E12" : "transparent"} />
                <path d="M20.5714 14.2857C21.3536 13.2768 21.2746 11.7143 19.8214 11C18.375 10.2857 16.5714 11 16.0714 11.5714L14.2143 13.4286" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12.1429 14.8571C11 15.8571 10.3536 18.0089 11.8929 19.2857C13.4286 20.5536 15.4286 19.8571 16 19.2857L17.8571 17.4286" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 7L16 25" stroke="#F2A900" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="16" cy="7" r="1" fill="#F2A900"/>
                <circle cx="16" cy="25" r="1" fill="#F2A900"/>
              </svg>
            </div>
            <div>
              <span className={`font-bold text-lg transition-colors ${scrolled ? 'text-white' : 'text-white/90'}`}>
                Bitcoin Grants
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/#organizations" scrolled={scrolled}>Organizations</NavLink>
            <NavLink href="/#how-it-works" scrolled={scrolled}>How It Works</NavLink>
            <NavLink href="/#faq" scrolled={scrolled}>FAQ</NavLink>
            <Link 
              href="/apply" 
              className={`bitcoin-btn px-5 py-2 ${
                scrolled 
                ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                : 'bg-yellow-500/90 text-gray-900 hover:bg-yellow-500'
              }`}
            >
              Apply Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 py-3 border-t border-gray-700">
            <div className="flex flex-col space-y-4 pt-2 pb-3">
              <MobileNavLink href="/#organizations" onClick={() => setMobileMenuOpen(false)}>
                Organizations
              </MobileNavLink>
              <MobileNavLink href="/#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </MobileNavLink>
              <MobileNavLink href="/#faq" onClick={() => setMobileMenuOpen(false)}>
                FAQ
              </MobileNavLink>
              <Link 
                href="/apply" 
                className="bitcoin-btn w-full text-center px-5 py-2 bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Apply Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, scrolled, children }: { href: string, scrolled: boolean, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`font-medium transition-colors hover:text-yellow-400 ${
        scrolled ? 'text-gray-200' : 'text-white/90'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, onClick, children }: { href: string, onClick: () => void, children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="block text-gray-200 hover:text-yellow-400 font-medium px-3 py-2"
      onClick={onClick}
    >
      {children}
    </Link>
  )
} 