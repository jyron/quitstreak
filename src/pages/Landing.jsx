import { useState, useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Calendar, ClipboardCheck, Users, Check } from 'lucide-react'

const steps = [
  {
    icon: Calendar,
    title: 'Set your quit date',
    description: 'Pick your substance, set the day, and your streak starts counting immediately.',
  },
  {
    icon: ClipboardCheck,
    title: 'Track daily',
    description: 'Quick 30-second check-ins: mood, cravings, and a note if you want.',
  },
  {
    icon: Users,
    title: 'Share with someone who cares',
    description: 'Give a loved one a live dashboard of your progress.',
    tag: 'Subscription',
  },
]

const testimonials = [
  {
    quote: 'My wife can see my streak. That\'s more accountability than any app ever gave me.',
    name: 'Jake',
    context: '90 days smoke-free',
  },
  {
    quote: 'I bought this for my brother. He\'s 47 days in. I check every morning.',
    name: 'Maria',
    context: 'Support partner',
  },
  {
    quote: 'The daily check-in takes 10 seconds but it\'s the thing that keeps me honest.',
    name: 'David',
    context: '6 months alcohol-free',
  },
]

const freeFeatures = [
  'Streak tracking with live counter',
  'Daily mood & craving check-ins',
  'Milestone achievements & health facts',
  'Money saved & consumption stats',
  'Push notification reminders',
]

const plusFeatures = [
  'Everything in Free',
  'Partner Support Dashboard',
  'Partner milestone alerts',
  'Encouragement messages',
  'Priority support',
]

export default function Landing() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  // Store the ref in localStorage so we can restore it after the magic link redirect
  useEffect(() => {
    if (ref) {
      localStorage.setItem('pendingShareCode', ref)
    }
  }, [ref])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  // Already logged in: if they came from a partner link, send them there
  if (user) {
    if (ref) {
      return <Navigate to={`/partner/${ref}`} replace />
    }
    return <Navigate to="/app" replace />
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setSending(true)

    const redirectTo = ref
      ? `${window.location.origin}/app?ref=${ref}`
      : `${window.location.origin}/app`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    setSending(false)

    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
    }
  }

  function scrollToSignup() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 pt-20 pb-12">
        {/* Hero */}
        <div className="max-w-lg">
          <h1 className="font-serif text-4xl font-bold text-text leading-tight">
            Quit drinking. Quit smoking. Quit vaping.
          </h1>
          <p className="mt-2 font-serif text-xl text-primary font-semibold">
            And prove it to someone who cares.
          </p>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Track your streak, log your journey, and share a live dashboard with the person rooting for you hardest.
          </p>
        </div>

        {/* Sign in form */}
        <div className="mt-10 max-w-lg">
          {ref && (
            <div className="mb-4 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
              <p className="text-sm text-primary font-medium">
                You're signing in to follow someone's journey.
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                You'll be taken back to their progress page after signing in.
              </p>
            </div>
          )}
          {submitted ? (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="font-serif text-xl font-semibold text-primary">Check your email</p>
              <p className="mt-2 text-text-secondary">
                We sent a magic link to <span className="font-medium text-text">{email}</span>. Click it to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignIn}>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                {ref ? 'Enter your email to continue' : 'Enter your email to get started'}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="submit"
                disabled={sending}
                className="mt-4 w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : ref ? 'Continue' : 'Start free — no credit card'}
              </button>
              {error && (
                <p className="mt-3 text-sm text-danger">{error}</p>
              )}
              <p className="mt-3 text-xs text-text-secondary text-center">
                Already have an account? Use the same email — the magic link signs you in automatically.
              </p>
            </form>
          )}
        </div>

        {/* How It Works */}
        <section className="mt-24">
          <h2 className="font-serif text-2xl font-bold text-text">How it works</h2>
          <div className="mt-8 space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Step {i + 1}</span>
                    {step.tag && (
                      <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">{step.tag}</span>
                    )}
                  </div>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-text">{step.title}</h3>
                  <p className="mt-1 text-text-secondary text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partner View Preview */}
        <section className="mt-24">
          <h2 className="font-serif text-2xl font-bold text-text text-center">
            Your mom. Your partner. Your best friend. Your sponsor.
          </h2>
          <p className="mt-2 text-text-secondary text-center">
            Give them peace of mind.
          </p>
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Mock partner dashboard */}
            <div className="bg-primary/5 px-6 py-4 border-b border-gray-100">
              <p className="text-sm text-text-secondary">Partner Dashboard</p>
              <p className="font-serif text-lg font-semibold text-text mt-1">Alex's Journey</p>
            </div>
            <div className="px-6 py-6 space-y-5">
              {/* Mock streak */}
              <div className="text-center py-4">
                <p className="text-text-secondary text-sm">has been alcohol-free for</p>
                <p className="font-serif text-4xl font-bold text-primary mt-1">47 days</p>
                <p className="text-text-secondary text-sm mt-1">3 hours 22 minutes</p>
              </div>
              {/* Mock mood row */}
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">This week's mood</p>
                <div className="flex justify-between">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={day} className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        i < 5
                          ? [
                              'bg-secondary/20 text-secondary',
                              'bg-primary/20 text-primary',
                              'bg-primary/20 text-primary',
                              'bg-secondary/20 text-secondary',
                              'bg-primary/20 text-primary',
                            ][i]
                          : 'bg-gray-100 text-gray-300'
                      }`}>
                        {i < 5 ? [':|', ':)', ':)', ':|', ':)'][i] : '?'}
                      </div>
                      <span className="text-xs text-text-secondary">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Mock milestone */}
              <div className="bg-secondary/5 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-sm font-bold">
                  !
                </div>
                <div>
                  <p className="text-sm font-medium text-text">2 months reached</p>
                  <p className="text-xs text-text-secondary">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-text-secondary">
            Recovery is easier when someone's in your corner.
          </p>
        </section>

        {/* Social Proof */}
        <section className="mt-24">
          <h2 className="font-serif text-2xl font-bold text-text text-center">
            People are quitting for good
          </h2>
          <div className="mt-8 space-y-4">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-text leading-relaxed">"{t.quote}"</p>
                <p className="mt-3 text-sm text-text-secondary">
                  — {t.name}, {t.context}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-24">
          <h2 className="font-serif text-2xl font-bold text-text text-center">
            Simple pricing
          </h2>
          <p className="mt-2 text-text-secondary text-center">
            Start free. Upgrade when you're ready to share your journey.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* Free tier */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-serif text-lg font-semibold text-text">Free</h3>
              <p className="mt-1 text-text-secondary text-sm">Everything you need to track your streak.</p>
              <p className="mt-4 font-serif text-3xl font-bold text-text">$0</p>
              <ul className="mt-5 space-y-2.5">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={scrollToSignup}
                className="mt-6 w-full py-2.5 px-4 rounded-xl border-2 border-primary text-primary font-medium hover:bg-primary/5 transition-colors"
              >
                Start free
              </button>
            </div>
            {/* Plus tier */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-primary relative">
              <div className="absolute -top-3 left-6 bg-secondary text-white text-xs font-medium px-3 py-1 rounded-full">
                Save 44% annually
              </div>
              <h3 className="font-serif text-lg font-semibold text-text">QuitStreak+</h3>
              <p className="mt-1 text-text-secondary text-sm">Share your progress with someone who cares.</p>
              <div className="mt-4 flex items-baseline gap-2">
                <p className="font-serif text-3xl font-bold text-text">$5.99</p>
                <span className="text-text-secondary text-sm">/month</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">or $39.99/year</p>
              <ul className="mt-5 space-y-2.5">
                {plusFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={scrollToSignup}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Start free
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="mailto:hello@quitstreak.app" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="mt-4 text-xs text-text-secondary leading-relaxed">
            If you're struggling with addiction, please reach out to SAMHSA's helpline:{' '}
            <a href="tel:1-800-662-4357" className="underline hover:text-primary">1-800-662-4357</a>
          </p>
          <p className="mt-3 text-xs text-text-secondary">
            Built with care for people who are trying.
          </p>
        </footer>
      </div>
    </div>
  )
}
