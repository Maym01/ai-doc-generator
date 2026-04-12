import Stripe from 'stripe'
import { NextRequest } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    // automatic_payment_methods enables Apple Pay, Google Pay, Link, bank
    // transfers, and any other methods enabled in the Stripe dashboard
    automatic_payment_methods: { enabled: true },
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${appUrl}/?success=1`,
    cancel_url: `${appUrl}/`,
    allow_promotion_codes: true,
    metadata: {
      product: 'docgen_ai_lifetime',
    },
  })

  return Response.json({ url: session.url })
}
