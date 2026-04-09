import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Authenticate user via Supabase JWT
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // Validate plan
  const { plan } = req.body || {}
  const priceId = PRICE_IDS[plan]
  if (!priceId) return res.status(400).json({ error: 'Invalid plan. Use "monthly" or "yearly".' })

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  // Create Checkout session
  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || process.env.VITE_APP_URL
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/app/partner-setup?checkout=success`,
    cancel_url: `${origin}/app/partner-setup`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    metadata: { supabase_user_id: user.id },
  })

  return res.status(200).json({ url: session.url })
}
