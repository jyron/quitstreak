import { useState, useEffect } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Wine, Cigarette, CloudFog, Heart, Eye, EyeOff, ArrowRight, Bell, UserCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDateForInput(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function friendlyError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password.'
  if (msg.includes('User already registered')) return 'An account with this email already exists. Try signing in.'
  if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters.'
  if (msg.includes('rate limit') || msg.includes('Rate limit')) return 'Too many attempts. Please wait and try again.'
  return msg
}

// ── Constants ──────────────────────────────────────────────────────────────

const QUIT_TYPES = [
  { value: 'drinking', label: 'Drinking', icon: Wine, adjective: 'alcohol-free' },
  { value: 'smoking', label: 'Smoking', icon: Cigarette, adjective: 'smoke-free' },
  { value: 'vaping', label: 'Vaping', icon: CloudFog, adjective: 'vape-free' },
]

// Quitter screen indices
const S_WELCOME = 0
const S_QUIT_TYPE = 1
const S_QUIT_DATE = 2
const S_NAME = 3
const S_NOTIFICATIONS = 4
const S_ACCOUNT = 5
const S_PAYWALL = 6

const TOTAL_PROGRESS_SCREENS = 5 // screens 1..5 show progress

// ── Sub-components ─────────────────────────────────────────────────────────

function ProgressBar({ screen }) {
  if (screen <= 0 || screen >= S_PAYWALL) return null
  const pct = Math.round((screen / TOTAL_PROGRESS_SCREENS) * 100)
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-8">
      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

function ScreenWrap({ animating, children }) {
  return (
    <div className={`transition-all duration-200 ${animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
      {children}
    </div>
  )
}

function MockStreakCounter() {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return (
    <div className="text-center py-8 select-none">
      <div className="relative inline-flex items-center justify-center">
        <div className="absolute w-48 h-48 rounded-full bg-primary/5 shadow-[0_0_30px_rgba(45,106,106,0.15)]" />
        <div className="absolute w-40 h-40 rounded-full border-2 border-primary/15" />
        <div className="relative font-serif text-text z-10">
          <span className="text-8xl font-bold leading-none">1</span>
          <p className="text-lg text-text-secondary font-medium mt-2">day free</p>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-6">
        {[['hr', h], ['min', m], ['sec', s]].map(([unit, val]) => (
          <div key={unit} className="flex flex-col items-center">
            <span className="font-serif text-2xl font-bold tabular-nums text-text">{val}</span>
            <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mt-0.5">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
    >
      Back
    </button>
  )
}

function PaywallScreen({ session, onSkip, adjective }) {
  const [plan, setPlan] = useState('yearly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ plan, successPath: '/app' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-secondary" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-text">
          Share your {adjective} journey.
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">
          Give someone who cares a live view of your streak, moods, and milestones — and let them send encouragement whenever you need it.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setPlan('monthly')}
          className={`py-4 px-3 rounded-xl border-2 text-center transition-all ${plan === 'monthly' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
        >
          <p className="font-serif text-xl font-bold text-text">$5.99</p>
          <p className="text-xs text-text-secondary mt-1">per month</p>
        </button>
        <button
          onClick={() => setPlan('yearly')}
          className={`py-4 px-3 rounded-xl border-2 text-center transition-all relative ${plan === 'yearly' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
        >
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
            Save 44%
          </div>
          <p className="font-serif text-xl font-bold text-text">$39.99</p>
          <p className="text-xs text-text-secondary mt-1">per year</p>
        </button>
      </div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Redirecting...' : 'Start sharing my journey'}
      </button>
      {error && <p className="mt-2 text-sm text-danger text-center">{error}</p>}
      <button
        onClick={onSkip}
        className="mt-3 w-full py-2 text-sm text-text-secondary hover:text-text transition-colors"
      >
        Continue with free plan
      </button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Landing() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, setProfile } = useProfile()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref') || localStorage.getItem('pendingShareCode')

  const [mode, setMode] = useState(ref ? 'supporter' : 'quitter')
  const [screen, setScreen] = useState(0)
  const [animating, setAnimating] = useState(false)

  // Quitter answers
  const [quitType, setQuitType] = useState(null)
  const [quitDate, setQuitDate] = useState(formatDateForInput(new Date()))
  const [displayName, setDisplayName] = useState('')

  // Supporter answers
  const [supporterName, setSupporterName] = useState('')

  // Auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authMode, setAuthMode] = useState('signup')
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [signedUpSession, setSignedUpSession] = useState(null)

  useEffect(() => {
    const r = searchParams.get('ref')
    if (r) localStorage.setItem('pendingShareCode', r)
  }, [])

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-spinner" />
      </div>
    )
  }

  // Only redirect if user is fully set up (has a profile)
  if (user && profile) {
    if (ref) return <Navigate to={`/partner/${ref}`} replace />
    return <Navigate to="/app" replace />
  }

  function goTo(n) {
    setAnimating(true)
    setTimeout(() => {
      setScreen(n)
      setAnimating(false)
      window.scrollTo(0, 0)
    }, 200)
  }
  function next() { goTo(screen + 1) }
  function back() { goTo(screen - 1) }

  async function requestNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    next()
  }

  async function handleSignUp(isSupporter) {
    setSubmitting(true)
    setAuthError(null)

    if (authMode === 'signin') {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setSubmitting(false); setAuthError(friendlyError(error.message)); return }
      const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', signInData.user.id).maybeSingle()
      setSubmitting(false)
      if (existingProfile) setProfile(existingProfile)
      localStorage.removeItem('pendingShareCode')
      navigate(ref ? `/partner/${ref}` : '/app', { replace: true })
      return
    }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setSubmitting(false)
      setAuthError(friendlyError(error.message))
      if (error.message.includes('User already registered')) setAuthMode('signin')
      return
    }

    const userId = data.user.id

    if (isSupporter) {
      const { data: profileData, error: pe } = await supabase.from('profiles').upsert({
        id: userId,
        account_type: 'supporter',
        display_name: supporterName.trim() || null,
      }, { onConflict: 'id' }).select().single()
      setSubmitting(false)
      if (pe) { setAuthError(pe.message); return }
      setProfile(profileData)
      localStorage.removeItem('pendingShareCode')
      navigate(ref ? `/partner/${ref}` : '/app', { replace: true })
      return
    }

    // Quitter profile
    const today = formatDateForInput(new Date())
    const quitTimestamp = quitDate === today
      ? new Date().toISOString()
      : new Date(quitDate + 'T00:00:00').toISOString()

    const { data: profileData, error: pe } = await supabase.from('profiles').upsert({
      id: userId,
      account_type: 'addict',
      display_name: displayName.trim() || null,
      quit_type: quitType,
      quit_date: quitTimestamp,
    }, { onConflict: 'id' }).select().single()

    setSubmitting(false)
    if (pe) { setAuthError(pe.message); return }

    setProfile(profileData)
    setSignedUpSession(data.session)
    sessionStorage.setItem('showConfetti', '1')
    goTo(S_PAYWALL)
  }

  const isToday = quitDate === formatDateForInput(new Date())
  const adjective = QUIT_TYPES.find(q => q.value === quitType)?.adjective ?? 'free'

  // Shared auth form markup
  function renderAuthForm(isSupporter) {
    return (
      <div className="mt-6 space-y-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-secondary">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {authError && <p className="text-sm text-danger">{authError}</p>}
        <button
          onClick={() => handleSignUp(isSupporter)}
          disabled={submitting || !email || !password}
          className="w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting
            ? (authMode === 'signup' ? 'Creating account...' : 'Signing in...')
            : authMode === 'signup' ? (isSupporter ? 'Create my account' : 'Start free') : 'Sign in'}
        </button>
        <p className="text-sm text-text-secondary text-center">
          {authMode === 'signup' ? (
            <>Already have an account?{' '}
              <button onClick={() => { setAuthMode('signin'); setAuthError(null) }} className="text-primary font-medium">Sign in</button>
            </>
          ) : (
            <>Don't have an account?{' '}
              <button onClick={() => { setAuthMode('signup'); setAuthError(null) }} className="text-primary font-medium">Sign up free</button>
            </>
          )}
        </p>
      </div>
    )
  }

  // ── SUPPORTER MODE ────────────────────────────────────────────────────────
  if (mode === 'supporter') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 max-w-lg mx-auto px-6 pt-12 pb-24 w-full">
          <ScreenWrap animating={animating}>

            {screen === 0 && (
              <div className="animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Heart size={36} className="text-primary/50" />
                </div>
                <h1 className="font-serif text-3xl font-bold text-text text-center">
                  You're here to help someone quit.
                </h1>
                <p className="mt-3 text-text-secondary leading-relaxed text-center">
                  Create a free account to follow their progress, see their daily moods, and send encouragement.
                </p>
                <button
                  onClick={() => goTo(1)}
                  className="mt-8 w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Set up my supporter account
                </button>
                <button
                  onClick={() => { setMode('quitter'); goTo(0) }}
                  className="mt-3 w-full py-2 text-sm text-text-secondary hover:text-text transition-colors"
                >
                  I'm also tracking my own journey
                </button>
              </div>
            )}

            {screen === 1 && (
              <div className="animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <UserCircle size={36} className="text-primary/50" />
                </div>
                <h1 className="font-serif text-3xl font-bold text-text">What should we call you?</h1>
                <p className="mt-3 text-text-secondary">So they know who's cheering them on.</p>
                <input
                  type="text"
                  value={supporterName}
                  onChange={e => setSupporterName(e.target.value)}
                  placeholder="e.g. Mom, Jake, Coach Sarah"
                  className="mt-6 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-lg"
                  autoFocus
                />
                <div className="flex gap-3 mt-8">
                  <BackBtn onClick={() => goTo(0)} />
                  <button
                    onClick={() => goTo(2)}
                    disabled={!supporterName.trim()}
                    className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {screen === 2 && (
              <div className="animate-fade-in">
                <h1 className="font-serif text-3xl font-bold text-text">
                  {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="mt-3 text-text-secondary">
                  {authMode === 'signup' ? 'Free to follow and encourage.' : 'Sign in to follow their progress.'}
                </p>
                {renderAuthForm(true)}
                <div className="mt-4">
                  <BackBtn onClick={() => goTo(1)} />
                </div>
              </div>
            )}

          </ScreenWrap>
        </div>
      </div>
    )
  }

  // ── QUITTER MODE ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-lg mx-auto px-6 pt-8 pb-24 w-full">
        <ProgressBar screen={screen} />

        <ScreenWrap animating={animating}>

          {/* 0: WELCOME */}
          {screen === S_WELCOME && (
            <div className="animate-fade-in pt-2">
              <div className="flex justify-between items-center mb-2">
                <p className="font-serif text-sm text-primary font-semibold tracking-wider">QuitStreak</p>
                <button
                  onClick={() => { goTo(S_ACCOUNT); setAuthMode('signin') }}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  Sign in
                </button>
              </div>
              <MockStreakCounter />
              <div className="text-center mt-4">
                <h1 className="font-serif text-3xl font-bold text-text">Your streak starts today.</h1>
                <p className="mt-3 text-text-secondary leading-relaxed max-w-sm mx-auto">
                  A live counter that proves you're doing it — and shares your progress with someone who cares.
                </p>
              </div>
              <button
                onClick={next}
                className="mt-8 w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]"
              >
                Start my journey
              </button>
              <button
                onClick={() => setMode('supporter')}
                className="mt-3 w-full py-2 text-sm text-text-secondary hover:text-text transition-colors flex items-center justify-center gap-1"
              >
                I'm here to support someone <ArrowRight size={14} />
              </button>
              <p className="mt-10 text-center text-xs text-text-secondary leading-relaxed px-4">
                If you're struggling, please reach out to SAMHSA's helpline:{' '}
                <a href="tel:1-800-662-4357" className="underline">1-800-662-4357</a>
              </p>
            </div>
          )}

          {/* 1: WHAT ARE YOU QUITTING? */}
          {screen === S_QUIT_TYPE && (
            <div className="animate-fade-in">
              <h1 className="font-serif text-3xl font-bold text-text">What are you quitting?</h1>
              <div className="mt-8 flex flex-col gap-4">
                {QUIT_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setQuitType(value)}
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                      quitType === value ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <Icon size={28} className={quitType === value ? 'text-primary' : 'text-text-secondary'} />
                    <span className={`text-lg font-medium ${quitType === value ? 'text-primary' : 'text-text'}`}>{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={next}
                disabled={!quitType}
                className="mt-8 w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          )}

          {/* 2: WHEN DID YOU QUIT? */}
          {screen === S_QUIT_DATE && (
            <div className="animate-fade-in">
              <h1 className="font-serif text-3xl font-bold text-text">When did your streak start?</h1>
              <p className="mt-2 text-text-secondary">This is when your counter counts from.</p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => setQuitDate(formatDateForInput(new Date()))}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                    isToday ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl">🕐</span>
                  <div>
                    <p className={`font-medium ${isToday ? 'text-primary' : 'text-text'}`}>Starting today</p>
                    <p className="text-sm text-text-secondary">My streak starts right now</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (isToday) {
                      const y = new Date()
                      y.setDate(y.getDate() - 1)
                      setQuitDate(formatDateForInput(y))
                    }
                  }}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                    !isToday ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className={`font-medium ${!isToday ? 'text-primary' : 'text-text'}`}>I already quit</p>
                    <p className="text-sm text-text-secondary">Pick the day I started</p>
                  </div>
                </button>
              </div>
              {!isToday && (
                <input
                  type="date"
                  value={quitDate}
                  max={formatDateForInput(new Date())}
                  min="2020-01-01"
                  onChange={e => setQuitDate(e.target.value)}
                  className="mt-4 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-lg animate-fade-in"
                />
              )}
              <div className="flex gap-3 mt-8">
                <BackBtn onClick={back} />
                <button onClick={next} className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* 3: YOUR NAME */}
          {screen === S_NAME && (
            <div className="animate-fade-in">
              <h1 className="font-serif text-3xl font-bold text-text">What should we call you?</h1>
              <p className="mt-3 text-text-secondary leading-relaxed">
                Just a first name or nickname. This is what your supporters see when they cheer you on.
              </p>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Name or nickname"
                className="mt-6 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-lg"
                autoFocus
              />
              <div className="flex gap-3 mt-8">
                <BackBtn onClick={back} />
                <button
                  onClick={next}
                  disabled={!displayName.trim()}
                  className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* 4: NOTIFICATION PRIMING */}
          {screen === S_NOTIFICATIONS && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Bell size={36} className="text-primary/50" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-text text-center">Stay on track.</h1>
              <p className="mt-3 text-text-secondary leading-relaxed text-center">
                Daily reminders to log a 30-second check-in, plus alerts when you hit a milestone.
              </p>
              <button
                onClick={requestNotifications}
                className="mt-8 w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Enable reminders
              </button>
              <button
                onClick={next}
                className="mt-3 w-full py-2 text-sm text-text-secondary hover:text-text transition-colors"
              >
                Not right now
              </button>
            </div>
          )}

          {/* 5: ACCOUNT CREATION */}
          {screen === S_ACCOUNT && (
            <div className="animate-fade-in">
              <h1 className="font-serif text-3xl font-bold text-text">
                {authMode === 'signup' ? 'Save your streak.' : 'Welcome back.'}
              </h1>
              <p className="mt-3 text-text-secondary">
                {authMode === 'signup'
                  ? `Free to start. Create your account and your ${adjective} journey begins.`
                  : 'Sign in to continue your journey.'}
              </p>
              {authMode === 'signup' && quitType && (
                <div className="mt-5 bg-primary/5 rounded-xl px-5 py-4 border border-primary/10 flex items-center gap-4">
                  <div className="text-center min-w-[52px]">
                    <p className="font-serif text-3xl font-bold text-primary">
                      {isToday ? 1 : Math.max(1, Math.floor((Date.now() - new Date(quitDate + 'T00:00:00').getTime()) / 86400000) + 1)}
                    </p>
                    <p className="text-xs text-text-secondary">{isToday ? 'day' : 'days'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-text">{displayName || 'Your streak'}</p>
                    <p className="text-sm text-text-secondary capitalize">{quitType} — {adjective}</p>
                  </div>
                </div>
              )}
              {renderAuthForm(false)}
              {authMode === 'signup' && screen > 0 && (
                <div className="mt-4">
                  <BackBtn onClick={back} />
                </div>
              )}
            </div>
          )}

          {/* 6: PAYWALL */}
          {screen === S_PAYWALL && (
            <PaywallScreen
              session={signedUpSession}
              onSkip={() => { window.location.assign('/app') }}
              adjective={adjective}
            />
          )}

        </ScreenWrap>
      </div>
    </div>
  )
}
