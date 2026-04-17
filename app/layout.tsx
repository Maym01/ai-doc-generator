import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = 'https://default-alpha-eight.vercel.app'
const SITE_NAME = 'DocGen AI'
const TITLE = 'AI Documentation Generator — Generate professional docs in seconds'
const DESCRIPTION =
  'Paste any code snippet and instantly generate JSDoc, TSDoc, README sections, or API reference blocks. Powered by Claude AI. No login required.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'AI documentation generator',
    'JSDoc generator',
    'TSDoc generator',
    'README generator',
    'code documentation',
    'Claude AI',
    'automatic docs',
    'API reference generator',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: DESCRIPTION,
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '29.00',
      priceCurrency: 'USD',
      description: '100 AI doc generations',
    },
    {
      '@type': 'Offer',
      name: 'Lifetime',
      price: '49.00',
      priceCurrency: 'USD',
      description: 'Unlimited AI generations, forever',
    },
    {
      '@type': 'Offer',
      name: 'Pro Monthly',
      price: '19.00',
      priceCurrency: 'USD',
      description: 'Unlimited AI generations for 30 days',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] antialiased">
        {children}
      </body>
    </html>
  )
}
