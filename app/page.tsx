'use client'

import { useState, useEffect } from 'react'
import {
  getUsageCount,
  incrementUsage,
  canGenerate,
  getPlan,
  getCredits,
  getMonthlyExpiry,
  isMonthlyActive,
  setStarterPlan,
  setMonthlyPlan,
  setLifetimePlan,
  type Plan,
} from '@/lib/usage'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

const FREE_LIMIT = 3

const DOC_TYPES = [
  { value: 'jsdoc', label: 'JSDoc' },
  { value: 'tsdoc', label: 'TSDoc' },
  { value: 'readme', label: 'README section' },
  { value: 'api', label: 'API reference' },
]

const PRICING_TIERS = [
  {
    key: 'starter' as const,
    name: 'Starter',
    price: '$29',
    period: 'per project',
    amount: '29.00',
    description: '100 generations — great for a single project',
    features: ['100 AI doc generations', 'JSDoc, TSDoc, README & API', 'Copy & .md download'],
    recommended: false,
    badge: null,
  },
  {
    key: 'lifetime' as const,
    name: 'Lifetime',
    price: '$49',
    period: 'one-time',
    amount: '49.00',
    description: 'Unlimited forever — best value',
    features: ['Unlimited AI generations', 'JSDoc, TSDoc, README & API', 'Copy & .md download', 'All future features'],
    recommended: true,
    badge: '⚡ Best Value',
  },
  {
    key: 'monthly' as const,
    name: 'Pro Monthly',
    price: '$19',
    period: 'per month',
    amount: '19.00',
    description: 'Unlimited for 30 days',
    features: ['Unlimited AI generations (30 days)', 'JSDoc, TSDoc, README & API', 'Copy & .md download'],
    recommended: false,
    badge: null,
  },
]

// Countdown timer: 48-hour urgency window stored per-visitor
const COUNTDOWN_KEY = 'docgen_deal_expiry'
const COUNTDOWN_HOURS = 48

function getOrCreateExpiry(): number {
  if (typeof window === 'undefined') return Date.now() + COUNTDOWN_HOURS * 3600 * 1000
  const stored = localStorage.getItem(COUNTDOWN_KEY)
  if (stored) {
    const val = parseInt(stored, 10)
    if (val > Date.now()) return val
  }
  const expiry = Date.now() + COUNTDOWN_HOURS * 3600 * 1000
  localStorage.setItem(COUNTDOWN_KEY, String(expiry))
  return expiry
}

function formatCountdown(ms: number): { hours: string; minutes: string; seconds: string } {
  const total = Math.max(0, ms)
  const s = Math.floor(total / 1000) % 60
  const m = Math.floor(total / 60000) % 60
  const h = Math.floor(total / 3600000)
  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  }
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    const expiry = getOrCreateExpiry()
    const tick = () => setTimeLeft(expiry - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (timeLeft === null) return null

  const { hours, minutes, seconds } = formatCountdown(timeLeft)

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-center">
      <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold mb-1.5">
        ⚡ Lifetime deal price expires in
      </p>
      <div className="flex items-center justify-center gap-2">
        {[
          { value: hours, label: 'hrs' },
          { value: minutes, label: 'min' },
          { value: seconds, label: 'sec' },
        ].map(({ value, label }, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <span className="text-amber-400/60 font-bold text-lg">:</span>}
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300 tabular-nums leading-none">{value}</div>
              <div className="text-xs text-amber-400/60 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


const DEMO_CODE = `import { useState, useCallback } from 'react'

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await asyncFn()
      setData(result)
      options.onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [asyncFn, options])

  return { data, error, loading, execute }
}`

function PlanBadge({ plan, usageCount, credits }: { plan: Plan; usageCount: number; credits: number }) {
  if (plan === 'lifetime') {
    return (
      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
        Lifetime — Unlimited
      </span>
    )
  }
  if (plan === 'monthly' && isMonthlyActive()) {
    const expiry = getMonthlyExpiry()!
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return (
      <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />
        Pro Monthly — {daysLeft}d left
      </span>
    )
  }
  if (plan === 'starter') {
    return (
      <span className="text-xs bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/30 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full inline-block" />
        Starter — {credits} credits left
      </span>
    )
  }
  const remaining = Math.max(0, FREE_LIMIT - usageCount)
  return (
    <span className="text-sm text-white/50">
      {remaining} free generation{remaining !== 1 ? 's' : ''} left
    </span>
  )
}

export default function Home() {
  const [code, setCode] = useState(DEMO_CODE)
  const [docType, setDocType] = useState('jsdoc')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usageCount, setUsageCount] = useState(0)
  const [plan, setPlanState] = useState<Plan>('free')
  const [credits, setCredits] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'starter' | 'monthly' | 'lifetime'>('lifetime')

  useEffect(() => {
    setUsageCount(getUsageCount())
    setPlanState(getPlan())
    setCredits(getCredits())
  }, [])

  const userCanGenerate = canGenerate()
  const isUnlimited = plan === 'lifetime' || (plan === 'monthly' && isMonthlyActive())

  async function handleGenerate() {
    if (!code.trim()) {
      setError('Please paste some code first.')
      return
    }
    if (!userCanGenerate) {
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

      if (!isUnlimited) {
        incrementUsage()
        setUsageCount(getUsageCount())
        setCredits(getCredits())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handlePaymentSuccess(tier: 'starter' | 'monthly' | 'lifetime') {
    if (tier === 'starter') {
      setStarterPlan()
      setCredits(getCredits())
      setPlanState('starter')
    } else if (tier === 'monthly') {
      setMonthlyPlan()
      setPlanState('monthly')
    } else {
      setLifetimePlan()
      setPlanState('lifetime')
    }
    setShowPaywall(false)
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

  const activeTier = PRICING_TIERS.find((t) => t.key === selectedTier)!

  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID! }}>
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
              <PlanBadge plan={plan} usageCount={usageCount} credits={credits} />
              {!isUnlimited && (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="text-sm bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-medium px-4 py-1.5 rounded-lg transition-all"
                >
                  Upgrade
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
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-4">
            Paste any function, class, or API route. Get production-ready docs in seconds.
          </p>
          <p className="text-sm text-white/40 py-2">Powered by Claude AI · Free to try — no login required</p>
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
                  {plan === 'free' && Math.max(0, FREE_LIMIT - usageCount) > 0 && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {Math.max(0, FREE_LIMIT - usageCount)} left
                    </span>
                  )}
                  {plan === 'starter' && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {credits} credits
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
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

        {/* Pricing modal */}
        {showPaywall && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl my-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Unlock DocGen AI</h2>
                <p className="text-white/60">Choose a plan and start generating unlimited documentation.</p>
              </div>

              {/* Countdown timer */}
              <CountdownTimer />

              {/* Tier selector */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {PRICING_TIERS.map((tier) => (
                  <button
                    key={tier.key}
                    onClick={() => setSelectedTier(tier.key)}
                    className={`relative rounded-xl p-4 text-left border transition-all ${
                      selectedTier === tier.key
                        ? tier.recommended
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/30 bg-white/5'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    {tier.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-xs bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-3 py-1 rounded-full font-semibold">
                          {tier.badge}
                        </span>
                      </div>
                    )}
                    <div className="font-semibold text-sm mb-1">{tier.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{tier.price}</span>
                      <span className="text-white/40 text-xs">{tier.period}</span>
                    </div>
                    <p className="text-white/50 text-xs mt-1 leading-snug">{tier.description}</p>
                  </button>
                ))}
              </div>

              {/* Selected tier features */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-white/70 mb-3">{activeTier.name} includes:</p>
                <div className="space-y-2">
                  {activeTier.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-sm text-white/80">
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              {/* PayPal button for selected tier */}
              <div className="mb-3">
                <p className="text-center text-white/50 text-sm mb-3">
                  Pay <strong className="text-white/80">{activeTier.price}</strong> {activeTier.period} — secure PayPal checkout
                </p>
                <PayPalButtons
                  key={selectedTier}
                  style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                  createOrder={(_data, actions) => {
                    return actions.order.create({
                      intent: 'CAPTURE',
                      purchase_units: [
                        {
                          amount: {
                            currency_code: 'USD',
                            value: activeTier.amount,
                          },
                          description: `DocGen AI — ${activeTier.name} Plan`,
                        },
                      ],
                    })
                  }}
                  onApprove={(_data, actions) => {
                    return actions.order!.capture().then(() => {
                      handlePaymentSuccess(selectedTier)
                    })
                  }}
                  onError={() => {
                    setError('Payment failed. Please try again.')
                    setShowPaywall(false)
                  }}
                />
              </div>

              <button
                onClick={() => setShowPaywall(false)}
                className="w-full mt-1 py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
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
    </PayPalScriptProvider>
  )
}
