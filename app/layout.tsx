import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bitcoin Grant Application Portal',
  description: 'A unified platform for applying to Bitcoin-related grants across multiple organizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
