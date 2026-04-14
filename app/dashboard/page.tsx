import { purchases, LAUNCH_DATE, GOAL_AMOUNT, TIER_PRICE, type Tier } from '@/lib/sales-data'

function getDayNumber(dateStr: string, launchDate: string): number {
  const launch = new Date(launchDate)
  const date = new Date(dateStr)
  return Math.floor((date.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function getDaysRemaining(launchDate: string, windowDays = 30): number {
  const end = new Date(launchDate)
  end.setDate(end.getDate() + windowDays)
  const now = new Date()
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function Dashboard() {
  const totalRevenue = purchases.reduce((sum, p) => sum + TIER_PRICE[p.tier], 0)
  const progressPct = Math.min(100, Math.round((totalRevenue / GOAL_AMOUNT) * 100))
  const daysRemaining = getDaysRemaining(LAUNCH_DATE)

  const tierCounts: Record<Tier, number> = { starter: 0, monthly: 0, lifetime: 0 }
  for (const p of purchases) tierCounts[p.tier]++

  // Group by day
  const byDay: Record<number, { starter: number; monthly: number; lifetime: number; revenue: number }> = {}
  for (const p of purchases) {
    const day = getDayNumber(p.date, LAUNCH_DATE)
    if (!byDay[day]) byDay[day] = { starter: 0, monthly: 0, lifetime: 0, revenue: 0 }
    byDay[day][p.tier]++
    byDay[day].revenue += TIER_PRICE[p.tier]
  }

  const dayRows = Object.entries(byDay)
    .map(([day, data]) => ({ day: Number(day), ...data }))
    .sort((a, b) => a.day - b.day)

  const launchDisplay = new Date(LAUNCH_DATE).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              DocGen AI
            </span>
            <span className="text-xs text-white/40">/ Launch Tracker</span>
          </div>
          <a
            href="/"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back to app
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Week 3 Growth Launch</h1>
          <p className="text-white/40 text-sm">
            Started {launchDisplay} · {daysRemaining} days remaining
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Revenue" value={`$${totalRevenue.toLocaleString()}`} sub={`of $${GOAL_AMOUNT.toLocaleString()} goal`} accent="violet" />
          <StatCard label="Days Left" value={String(daysRemaining)} sub="of 30-day window" accent="cyan" />
          <StatCard label="Customers" value={String(purchases.length)} sub="total purchases" accent="emerald" />
          <StatCard label="Progress" value={`${progressPct}%`} sub="toward goal" accent="amber" />
        </div>

        {/* Revenue progress bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">Revenue Goal</span>
            <span className="text-white/50 text-sm">
              ${totalRevenue.toLocaleString()} / ${GOAL_AMOUNT.toLocaleString()}
            </span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-white/40 text-xs mt-2">
            {GOAL_AMOUNT - totalRevenue > 0
              ? `$${(GOAL_AMOUNT - totalRevenue).toLocaleString()} remaining to reach goal`
              : 'Goal reached!'}
          </p>
        </div>

        {/* Tier breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Customer Breakdown by Tier</h2>
          <div className="grid grid-cols-3 gap-4">
            <TierCard
              name="Starter"
              price="$29"
              count={tierCounts.starter}
              revenue={tierCounts.starter * TIER_PRICE.starter}
              color="violet"
            />
            <TierCard
              name="Pro Monthly"
              price="$19/mo"
              count={tierCounts.monthly}
              revenue={tierCounts.monthly * TIER_PRICE.monthly}
              color="blue"
            />
            <TierCard
              name="Lifetime"
              price="$49"
              count={tierCounts.lifetime}
              revenue={tierCounts.lifetime * TIER_PRICE.lifetime}
              color="emerald"
            />
          </div>
        </div>

        {/* Daily table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Daily Purchases</h2>
          {dayRows.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">
              No purchases yet — add entries to <code className="text-violet-400">lib/sales-data.ts</code>
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/10">
                  <th className="text-left pb-2 font-medium">Day</th>
                  <th className="text-right pb-2 font-medium">Starter</th>
                  <th className="text-right pb-2 font-medium">Monthly</th>
                  <th className="text-right pb-2 font-medium">Lifetime</th>
                  <th className="text-right pb-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map((row) => (
                  <tr key={row.day} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2.5 text-white/60">Day {row.day}</td>
                    <td className="py-2.5 text-right">{row.starter || '—'}</td>
                    <td className="py-2.5 text-right">{row.monthly || '—'}</td>
                    <td className="py-2.5 text-right">{row.lifetime || '—'}</td>
                    <td className="py-2.5 text-right font-medium text-emerald-400">
                      ${row.revenue}
                    </td>
                  </tr>
                ))}
                <tr className="text-white/60 font-semibold">
                  <td className="pt-3">Total</td>
                  <td className="pt-3 text-right">{tierCounts.starter}</td>
                  <td className="pt-3 text-right">{tierCounts.monthly}</td>
                  <td className="pt-3 text-right">{tierCounts.lifetime}</td>
                  <td className="pt-3 text-right text-emerald-400">${totalRevenue}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-white/20 text-xs pb-4">
          To update data, edit <code>lib/sales-data.ts</code> and redeploy.
        </p>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent: 'violet' | 'cyan' | 'emerald' | 'amber'
}) {
  const colors = {
    violet: 'text-violet-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[accent]}`}>{value}</p>
      <p className="text-white/30 text-xs mt-0.5">{sub}</p>
    </div>
  )
}

function TierCard({
  name,
  price,
  count,
  revenue,
  color,
}: {
  name: string
  price: string
  count: number
  revenue: number
  color: 'violet' | 'blue' | 'emerald'
}) {
  const colors = {
    violet: 'border-violet-500/30 bg-violet-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
  }
  const text = {
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
  }
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <p className={`text-xs font-semibold mb-1 ${text[color]}`}>{name}</p>
      <p className="text-white/40 text-xs mb-3">{price}</p>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-white/40 text-xs mt-0.5">${revenue} revenue</p>
    </div>
  )
}
