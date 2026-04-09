import { useState, useEffect, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Calendar, ClipboardCheck, Users, Check, Eye, EyeOff } from 'lucide-react'

function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, visible]
}

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
  'Milestone achievements',
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
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [howRef, howVisible] = useReveal()
  const [partnerRef, partnerVisible] = useReveal()
  const [testimonialsRef, testimonialsVisible] = useReveal()
  const [pricingRef, pricingVisible] = useReveal()

  useEffect(() => {
    if (ref) {
      localStorage.setItem('pendingShareCode', ref)
    }
  }, [ref])

  if (!loading && user) {
    if (ref) {
      return <Navigate to={`/partner/${ref}`} replace />
    }
    return <Navigate to="/app" replace />
  }

  function friendlyError(msg) {
    if (msg.includes('Invalid login credentials')) return 'Wrong email or password.'
    if (msg.includes('User already registered')) return 'An account with this email already exists. Try signing in.'
    if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.'
    if (msg.includes('rate limit') || msg.includes('Rate limit')) return 'Too many attempts. Please wait and try again.'
    return msg
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setSubmitting(false)

    if (error) {
      const msg = error.message
      setError(friendlyError(msg))
      if (msg.includes('User already registered')) {
        setMode('signin')
      }
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
          <h1 className="font-serif text-4xl font-bold text-text leading-tight animate-fade-in">
            Quit drinking. Quit smoking. Quit vaping.
          </h1>
          <p className="mt-2 font-serif text-xl text-primary font-semibold animate-fade-in" style={{ animationDelay: '0.15s' }}>
            And prove it to someone who cares.
          </p>
          <p className="mt-4 text-text-secondary leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Track your streak, log your journey, and share a live dashboard with the person rooting for you hardest.
          </p>
        </div>

        {/* Sign in form */}
        <div className="mt-10 max-w-lg animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
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
          <form onSubmit={handleSubmit}>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <div className="relative mt-3">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (6+ characters)"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {mode === 'signup'
                  ? (submitting ? 'Creating account...' : ref ? 'Create account' : 'Start free — no credit card')
                  : (submitting ? 'Signing in...' : 'Sign in')}
              </button>
              {error && (
                <p className="mt-3 text-sm text-danger">{error}</p>
              )}
              <p className="mt-3 text-xs text-text-secondary text-center">
                {mode === 'signup' ? (
                  <>Already have an account?{' '}
                    <button type="button" onClick={() => { setMode('signin'); setError(null) }} className="text-primary font-medium">
                      Sign in
                    </button>
                  </>
                ) : (
                  <>Don't have an account?{' '}
                    <button type="button" onClick={() => { setMode('signup'); setError(null) }} className="text-primary font-medium">
                      Sign up free
                    </button>
                  </>
                )}
              </p>
            </form>
        </div>

        {/* How It Works */}
        <section ref={howRef} className={`mt-24 transition-all duration-700 ${howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="font-serif text-2xl font-bold text-text">How it works</h2>
          <div className="mt-8 space-y-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex gap-5 items-start transition-all duration-500 ${howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                style={{ transitionDelay: howVisible ? `${i * 120}ms` : '0ms' }}
              >
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
        <section ref={partnerRef} className={`mt-24 transition-all duration-700 ${partnerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="font-serif text-2xl font-bold text-text text-center">
            Your mom. Your partner. Your best friend. Your sponsor.
          </h2>
          <p className="mt-2 text-text-secondary text-center">
            Give them peace of mind.
          </p>
          <div className={`mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-1000 ${partnerVisible ? 'animate-float' : ''}`}>
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
        <section ref={testimonialsRef} className={`mt-24 transition-all duration-700 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="font-serif text-2xl font-bold text-text text-center">
            People are quitting for good
          </h2>
          <div className="mt-8 space-y-4">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl p-5 shadow-sm transition-all duration-500 ${testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                style={{ transitionDelay: testimonialsVisible ? `${i * 150}ms` : '0ms' }}
              >
                <p className="text-text leading-relaxed">"{t.quote}"</p>
                <p className="mt-3 text-sm text-text-secondary">
                  — {t.name}, {t.context}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section ref={pricingRef} className={`mt-24 transition-all duration-700 ${pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="font-serif text-2xl font-bold text-text text-center">
            Simple pricing
          </h2>
          <p className="mt-2 text-text-secondary text-center">
            Start free. Upgrade when you're ready to share your journey.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* Free tier */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-primary relative hover:shadow-md hover:-translate-y-1 transition-all duration-300">
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
