const USAGE_KEY = 'docgen_usage_count'
const PLAN_KEY = 'docgen_plan'
const CREDITS_KEY = 'docgen_credits'
const MONTHLY_EXPIRY_KEY = 'docgen_monthly_expiry'

export type Plan = 'free' | 'starter' | 'monthly' | 'lifetime'

export function getUsageCount(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(USAGE_KEY) || '0', 10)
}

export function incrementUsage(): void {
  if (typeof window === 'undefined') return
  const count = getUsageCount()
  localStorage.setItem(USAGE_KEY, String(count + 1))
  if (getPlan() === 'starter') {
    const credits = getCredits()
    if (credits > 0) localStorage.setItem(CREDITS_KEY, String(credits - 1))
  }
}

export function getPlan(): Plan {
  if (typeof window === 'undefined') return 'free'
  return (localStorage.getItem(PLAN_KEY) as Plan) || 'free'
}

export function getCredits(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(CREDITS_KEY) || '0', 10)
}

export function getMonthlyExpiry(): Date | null {
  if (typeof window === 'undefined') return null
  const val = localStorage.getItem(MONTHLY_EXPIRY_KEY)
  return val ? new Date(val) : null
}

export function isMonthlyActive(): boolean {
  const expiry = getMonthlyExpiry()
  return expiry !== null && expiry > new Date()
}

export function canGenerate(): boolean {
  const plan = getPlan()
  if (plan === 'lifetime') return true
  if (plan === 'monthly') return isMonthlyActive()
  if (plan === 'starter') return getCredits() > 0
  return getUsageCount() < 3
}

export function setStarterPlan(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PLAN_KEY, 'starter')
  const existing = getCredits()
  localStorage.setItem(CREDITS_KEY, String(existing + 100))
}

export function setMonthlyPlan(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PLAN_KEY, 'monthly')
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)
  localStorage.setItem(MONTHLY_EXPIRY_KEY, expiry.toISOString())
}

export function setLifetimePlan(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PLAN_KEY, 'lifetime')
}

// Legacy compat
export function isPro(): boolean {
  const plan = getPlan()
  if (plan === 'lifetime') return true
  if (plan === 'monthly') return isMonthlyActive()
  return false
}

export function setPro(): void {
  setLifetimePlan()
}
