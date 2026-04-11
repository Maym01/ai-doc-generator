# DocGen AI — Deploy Guide

## Prerequisites

- Node.js 18+
- Vercel account
- Anthropic API key
- Stripe account

## Local Development

```bash
cp .env.example .env.local
# Fill in your keys in .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Stripe Setup

1. Create a Stripe product: "DocGen AI — Lifetime Access"
2. Create a one-time price: $49.00
3. Copy the **Price ID** (starts with `price_`)
4. Add it as `STRIPE_PRICE_ID` in your env

For webhooks (optional for MVP but recommended):
- Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
- Events: `checkout.session.completed`
- Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or push to GitHub and import in Vercel dashboard.

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...`) |
| `STRIPE_PRICE_ID` | Your $49 one-time price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://docgen.vercel.app`) |

## Freemium Model

- 3 free generations tracked in `localStorage` (no login required)
- After 3 uses, paywall modal appears
- One-time $49 Stripe payment → redirected back with `?success=1`
- Pro status stored in `localStorage` (simple, no auth needed for MVP)
