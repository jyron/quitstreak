import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Landing() {
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setSending(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    })

    setSending(false)

    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 pt-20 pb-12">
        {/* Hero */}
        <h1 className="font-serif text-4xl font-bold text-text leading-tight">
          Quit drinking. Quit smoking. Quit vaping.
        </h1>
        <p className="mt-2 font-serif text-xl text-primary font-semibold">
          And prove it to someone who cares.
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          Track your streak, log your journey, and share a live dashboard with the person rooting for you hardest.
        </p>

        {/* Sign in form */}
        <div className="mt-10">
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
                Enter your email to get started
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
                {sending ? 'Sending...' : 'Start free — no credit card'}
              </button>
              {error && (
                <p className="mt-3 text-sm text-danger">{error}</p>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-xs text-text-secondary leading-relaxed">
            If you're struggling with addiction, please reach out to SAMHSA's helpline: 1-800-662-4357
          </p>
        </div>
      </div>
    </div>
  )
}
