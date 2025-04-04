import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bitcoin Grants Common Application',
  description: 'A unified platform for applying to Bitcoin-related grants across multiple organizations.',
  icons: {
    icon: '/favicon.ico',
  },
  keywords: ['Bitcoin', 'grants', 'funding', 'cryptocurrency', 'open source', 'OpenSats', 'Brink', 'Btrust', 'HRF'],
  authors: [{ name: 'Bitcoin Grants Common Application' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bitcoingrants.org',
    title: 'Bitcoin Grants Common Application',
    description: 'One application. Multiple organizations. Apply for Bitcoin funding with ease.',
    siteName: 'Bitcoin Grants Common Application',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bitcoin Grants Common Application',
    description: 'One application. Multiple organizations. Apply for Bitcoin funding with ease.',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`h-full antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}
