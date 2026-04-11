import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DocGen AI — Instant Code Documentation',
  description:
    'Paste any code snippet and get JSDoc, TSDoc, README sections, or API reference blocks in seconds. Powered by Claude AI.',
  openGraph: {
    title: 'DocGen AI — Instant Code Documentation',
    description: 'AI-powered documentation generator. Paste code, get docs.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] antialiased">
        {children}
      </body>
    </html>
  )
}
