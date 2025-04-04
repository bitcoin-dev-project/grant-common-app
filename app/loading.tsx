'use client'

import BitcoinLoader from '../components/BitcoinLoader'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <BitcoinLoader 
          size={80} 
          color="#F2A900" 
          bgColor="rgba(242, 169, 0, 0.1)" 
          duration={2}
          text="Loading Bitcoin Grants..."
        />
      </div>
    </div>
  )
} 