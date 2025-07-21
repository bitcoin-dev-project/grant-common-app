import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { withAssetPrefix } from '../lib/utils'
import EnvironmentBanner from '../components/EnvironmentBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bitcoin Grants Common Application',
  description: 'A unified platform for applying to Bitcoin-related grants across multiple organizations. Apply once, reach multiple Bitcoin funding organizations.',
  icons: {
    icon: [
      { url: withAssetPrefix('/favicon.ico'), sizes: '32x32', type: 'image/x-icon' },
      { url: withAssetPrefix('/favicon.svg'), type: 'image/svg+xml' },
    ],
    apple: [
      { url: withAssetPrefix('/apple-touch-icon.png'), sizes: '180x180', type: 'image/png' },
    ],
  },
  keywords: ['Bitcoin', 'grants', 'funding', 'cryptocurrency', 'open source', 'OpenSats', 'Brink', 'Btrust', 'Maelstrom', 'Spiral'],
  authors: [{ name: 'Bitcoin Grants Common Application' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://grants.bitcoindevs.xyz',
    title: 'Bitcoin Grants Common Application',
    description: 'Apply once, reach multiple Bitcoin funding organizations. Submit your project for consideration and accelerate your path to funding.',
    siteName: 'Bitcoin Grants Common Application',
    images: [
      {
        url: withAssetPrefix('/og-image.png'),
        width: 1200,
        height: 630,
        alt: 'Bitcoin Grants Common Application - Apply once, reach multiple organizations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bitcoin Grants Common Application',
    description: 'Apply once, reach multiple Bitcoin funding organizations. Submit your project for consideration and accelerate your path to funding.',
    images: [withAssetPrefix('/og-image.png')],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL('https://grants.bitcoindevs.xyz'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`h-full antialiased ${inter.className}`}>
        <EnvironmentBanner />
        {children}
      </body>
    </html>
  )
}
