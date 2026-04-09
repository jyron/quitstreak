import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Disable Vercel's default body parsing so we can verify the raw signature
export const config = { api: { bodyParser: false } }

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function updateSubscriptionStatus(userId, status, customerId) {
  const updates = { subscription_status: status }
  if (customerId) updates.stripe_customer_id = customerId
  await supabase.from('profiles').update(updates).eq('id', userId)
}

async function getUserIdFromSubscription(subscription) {
  // First check subscription metadata
  if (subscription.metadata?.supabase_user_id) {
    return subscription.metadata.supabase_user_id
  }
  // Fallback: look up by stripe_customer_id
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single()
  return data?.id
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const userId = await getUserIdFromSubscription(subscription)
        if (userId) {
          await updateSubscriptionStatus(userId, 'active', session.customer)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const userId = await getUserIdFromSubscription(subscription)
      if (!userId) break

      let status
      if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
        status = 'active'
      } else if (subscription.status === 'active' && subscription.cancel_at_period_end) {
        status = 'canceled' // Still has access until period ends
      } else if (subscription.status === 'past_due') {
        status = 'past_due'
      } else {
        status = 'free'
      }
      await updateSubscriptionStatus(userId, status)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const userId = await getUserIdFromSubscription(subscription)
      if (userId) {
        await updateSubscriptionStatus(userId, 'free')
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = await getUserIdFromSubscription(subscription)
        if (userId) {
          await updateSubscriptionStatus(userId, 'past_due')
        }
      }
      break
    }
  }

  return res.status(200).json({ received: true })
}
