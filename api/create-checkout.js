import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default async function handler(req, res) {
  try {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Authenticate user via Supabase JWT
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // Validate plan
  const { plan, successPath, giftForEmail } = req.body || {}
  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    console.error('[create-checkout] Missing price id for plan', plan, 'env keys:', {
      monthly: !!process.env.STRIPE_MONTHLY_PRICE_ID,
      yearly: !!process.env.STRIPE_YEARLY_PRICE_ID,
    })
    return res.status(400).json({ error: 'Checkout is temporarily unavailable. Please try again soon.' })
  }

  const isGift = giftForEmail != null
  if (isGift) {
    if (!isValidEmail(giftForEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address for the gift recipient.' })
    }
    if (giftForEmail.toLowerCase() === (user.email || '').toLowerCase()) {
      return res.status(400).json({ error: "You can't gift a subscription to yourself." })
    }
  }

  // Get or create Stripe customer (the gifter's customer in gift mode)
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

  // Build subscription metadata — this is what the webhook keys off of
  const subscriptionMetadata = isGift
    ? {
        kind: 'gift',
        gift_from_user_id: user.id,
        gift_for_email: giftForEmail.toLowerCase().trim(),
      }
    : {
        kind: 'self',
        supabase_user_id: user.id,
      }

  const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || process.env.VITE_APP_URL
  const defaultPath = isGift ? '/app/partner-setup' : '/app/partner-setup'
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}${successPath || defaultPath}?checkout=${isGift ? 'gift_success' : 'success'}`,
    cancel_url: `${origin}${successPath || defaultPath}`,
    subscription_data: {
      metadata: subscriptionMetadata,
    },
    metadata: subscriptionMetadata,
  })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[create-checkout] Unhandled error:', err)
    return res.status(500).json({ error: err?.message || 'Could not start checkout. Please try again.' })
  }
}
