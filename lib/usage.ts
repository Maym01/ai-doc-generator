const USAGE_KEY = 'docgen_usage_count'
const PRO_KEY = 'docgen_pro'

export function getUsageCount(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(USAGE_KEY) || '0', 10)
}

export function incrementUsage(): void {
  if (typeof window === 'undefined') return
  const current = getUsageCount()
  localStorage.setItem(USAGE_KEY, String(current + 1))
}

export function isPro(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(PRO_KEY) === '1'
}

export function setPro(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PRO_KEY, '1')
}
