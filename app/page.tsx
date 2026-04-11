'use client'

import { useState, useEffect } from 'react'
import { getUsageCount, incrementUsage, isPro, setPro } from '@/lib/usage'
import { loadStripe } from '@stripe/stripe-js'

const FREE_LIMIT = 3
const DOC_TYPES = [
  { value: 'jsdoc', label: 'JSDoc' },
  { value: 'tsdoc', label: 'TSDoc' },
  { value: 'readme', label: 'README section' },
  { value: 'api', label: 'API reference' },
]

export default function Home() {
  const [code, setCode] = useState('')
  const [docType, setDocType] = useState('jsdoc')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usageCount, setUsageCount] = useState(0)
  const [proUser, setProUser] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    setUsageCount(getUsageCount())
    setProUser(isPro())

    // Handle Stripe success redirect
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') {
      setPro()
      setProUser(true)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const remaining = Math.max(0, FREE_LIMIT - usageCount)
  const canGenerate = proUser || remaining > 0

  async function handleGenerate() {
    if (!code.trim()) {
      setError('Please paste some code first.')
      return
    }

    if (!canGenerate) {
      setShowPaywall(true)
      return
    }

    setLoading(true)
    setError('')
    setOutput('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, docType }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let result = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
        setOutput(result)
      }

      if (!proUser) {
        incrementUsage()
        setUsageCount(getUsageCount())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade() {
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to open checkout. Please try again.')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([output], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `docs-${docType}-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              DocGen AI
            </span>
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
              beta
            </span>
          </div>
          <div className="flex items-center gap-3">
            {proUser ? (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                Pro — Unlimited
              </span>
            ) : (
              <span className="text-sm text-white/50">
                {remaining} free generation{remaining !== 1 ? 's' : ''} left
              </span>
            )}
            {!proUser && (
              <button
                onClick={handleUpgrade}
                className="text-sm bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-medium px-4 py-1.5 rounded-lg transition-all"
              >
                Unlock Pro — $49
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center py-12 px-6">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
          Documentation, instantly.
        </h1>
        <p className="text-lg text-white/60 max-w-xl mx-auto">
          Paste any function, class, or API route. Get production-ready docs in seconds.
        </p>
      </section>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-16 grid sm:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">Paste your code</label>
            <div className="flex gap-1">
              {DOC_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setDocType(t.value)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    docType === t.value
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="code-textarea flex-1 min-h-[320px] w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white/90 placeholder-white/20 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            placeholder={`// Paste your code here\nfunction fetchUser(id: string) {\n  return db.users.findById(id)\n}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <span>Generate {DOC_TYPES.find((t) => t.value === docType)?.label}</span>
                {!proUser && remaining > 0 && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {remaining} left
                  </span>
                )}
              </>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Output panel */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">Generated documentation</label>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-md transition-all flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-md transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  .md
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[320px] bg-white/5 border border-white/10 rounded-xl p-4 relative overflow-auto">
            {output ? (
              <pre className="output-pre text-white/85">{output}</pre>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Your documentation will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Paywall modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">You have used your 3 free generations</h2>
              <p className="text-white/60">
                Unlock unlimited documentation generation forever for a one-time payment.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-2">
              {[
                'Unlimited AI documentation',
                'JSDoc, TSDoc, README & API reference',
                'One-click copy & .md download',
                'Lifetime access — no subscription',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {feat}
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 transition-all text-lg"
            >
              Unlock for $49 — one time
            </button>

            <button
              onClick={() => setShowPaywall(false)}
              className="w-full mt-3 py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-white/30">
        <p>DocGen AI — Powered by Claude AI</p>
      </footer>
    </div>
  )
}
