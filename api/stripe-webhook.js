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

// ─── Self-subscription helpers ──────────────────────────────────────────────

async function updateSubscriptionStatus(userId, status, customerId) {
  const updates = { subscription_status: status }
  if (customerId) updates.stripe_customer_id = customerId
  await supabase.from('profiles').update(updates).eq('id', userId)
}

async function getUserIdFromSubscription(subscription) {
  if (subscription.metadata?.supabase_user_id) {
    return subscription.metadata.supabase_user_id
  }
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single()
  return data?.id
}

// ─── Gift helpers ───────────────────────────────────────────────────────────

function stripeStatusToLocal(subscription) {
  if (subscription.status === 'active' && !subscription.cancel_at_period_end) return 'active'
  if (subscription.status === 'active' && subscription.cancel_at_period_end) return 'canceled'
  if (subscription.status === 'past_due') return 'past_due'
  return 'free'
}

async function upsertGiftedSubscription(subscription) {
  const meta = subscription.metadata || {}
  const giftForEmail = (meta.gift_for_email || '').toLowerCase().trim()
  const gifterUserId = meta.gift_from_user_id || null
  if (!giftForEmail) return

  // Try to match the recipient to an existing profile by email
  let recipientUserId = null
  const { data: matchedUser } = await supabase.rpc('lookup_profile_id_by_email', { p_email: giftForEmail })
  if (matchedUser) recipientUserId = matchedUser

  const localStatus = stripeStatusToLocal(subscription)

  await supabase
    .from('gifted_subscriptions')
    .upsert(
      {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        gifter_user_id: gifterUserId,
        recipient_email: giftForEmail,
        recipient_user_id: recipientUserId,
        status: localStatus,
      },
      { onConflict: 'stripe_subscription_id' }
    )
}

async function updateGiftedSubscriptionStatus(subscription) {
  const localStatus = stripeStatusToLocal(subscription)
  await supabase
    .from('gifted_subscriptions')
    .update({ status: localStatus })
    .eq('stripe_subscription_id', subscription.id)
}

function isGiftSubscription(subscription) {
  return subscription?.metadata?.kind === 'gift'
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        if (isGiftSubscription(subscription)) {
          await upsertGiftedSubscription(subscription)
        } else {
          const userId = await getUserIdFromSubscription(subscription)
          if (userId) await updateSubscriptionStatus(userId, 'active', session.customer)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      if (isGiftSubscription(subscription)) {
        await updateGiftedSubscriptionStatus(subscription)
      } else {
        const userId = await getUserIdFromSubscription(subscription)
        if (!userId) break
        await updateSubscriptionStatus(userId, stripeStatusToLocal(subscription))
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      if (isGiftSubscription(subscription)) {
        await supabase
          .from('gifted_subscriptions')
          .update({ status: 'free' })
          .eq('stripe_subscription_id', subscription.id)
      } else {
        const userId = await getUserIdFromSubscription(subscription)
        if (userId) await updateSubscriptionStatus(userId, 'free')
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        if (isGiftSubscription(subscription)) {
          await updateGiftedSubscriptionStatus(subscription)
        } else {
          const userId = await getUserIdFromSubscription(subscription)
          if (userId) await updateSubscriptionStatus(userId, 'past_due')
        }
      }
      break
    }
  }

  return res.status(200).json({ received: true })
}
