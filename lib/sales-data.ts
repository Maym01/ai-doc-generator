// Manual sales tracking — add entries here as purchases come in
// Run `git commit` after each update to keep a history

export type Tier = 'starter' | 'monthly' | 'lifetime'

export interface Purchase {
  date: string // ISO date, e.g. '2026-04-14'
  tier: Tier
}

// 30-day launch window start date
export const LAUNCH_DATE = '2026-04-14'

// Revenue goal
export const GOAL_AMOUNT = 3000

// Tier prices
export const TIER_PRICE: Record<Tier, number> = {
  starter: 29,
  monthly: 19,
  lifetime: 49,
}

// === ADD PURCHASES BELOW ===
export const purchases: Purchase[] = [
  // Example (remove when you have real data):
  // { date: '2026-04-14', tier: 'lifetime' },
]
