import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DocGen AI — AI Documentation Generator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '80px',
        }}
      >
        {/* Gradient circle accent */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 700,
              background: 'linear-gradient(90deg, #a78bfa, #22d3ee)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            DocGen AI
          </span>
          <span
            style={{
              fontSize: '18px',
              color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.4)',
              borderRadius: '9999px',
              padding: '4px 14px',
            }}
          >
            beta
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '900px',
            marginBottom: '24px',
          }}
        >
          AI Documentation Generator
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: '26px',
            color: 'rgba(232,232,240,0.6)',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          Generate professional docs in seconds. JSDoc, TSDoc, README & more.
        </div>

        {/* Powered by */}
        <div
          style={{
            marginTop: '48px',
            fontSize: '18px',
            color: 'rgba(232,232,240,0.35)',
          }}
        >
          Powered by Claude AI
        </div>
      </div>
    ),
    size,
  )
}
