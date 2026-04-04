import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCheckins } from '../hooks/useCheckins'
import { useProfile } from '../hooks/useProfile'
import MoodSelector from '../components/MoodSelector'
import CravingScale from '../components/CravingScale'

function getConfirmationMessage(quitDate) {
  if (!quitDate) return "You're doing great."
  const days = Math.max(0, Math.floor((Date.now() - new Date(quitDate).getTime()) / (1000 * 60 * 60 * 24)))
  if (days === 7) return "One week. That's real."
  if (days === 14) return "Two weeks. You're building something."
  if (days < 7) return `Day ${days}. Every day counts.`
  if (days >= 30) return `Day ${days}. Look how far you've come.`
  return "You're doing great."
}

export default function CheckIn() {
  const navigate = useNavigate()
  const { submitCheckin } = useCheckins()
  const { profile } = useProfile()
  const [step, setStep] = useState(1)
  const [mood, setMood] = useState(null)
  const [craving, setCraving] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Auto-redirect after confirmation
  useEffect(() => {
    if (step !== 'done') return
    const timer = setTimeout(() => navigate('/app'), 3000)
    return () => clearTimeout(timer)
  }, [step, navigate])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const { error } = await submitCheckin({ mood, craving, note })
    setSubmitting(false)
    if (error) {
      setError(typeof error === 'string' ? error : error.message)
    } else {
      setStep('done')
    }
  }

  function handleSkip() {
    setNote('')
    handleSubmit()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-lg mx-auto px-6 pt-12 pb-24 w-full">
        {/* Progress dots */}
        {step !== 'done' && (
          <div className="flex justify-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Mood */}
        {step === 1 && (
          <div>
            <h1 className="font-serif text-3xl font-bold text-text">How are you feeling?</h1>
            <p className="mt-2 text-text-secondary">No wrong answers here.</p>
            <div className="mt-8">
              <MoodSelector value={mood} onChange={setMood} />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={mood === null}
              className="mt-8 w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Cravings */}
        {step === 2 && (
          <div>
            <h1 className="font-serif text-3xl font-bold text-text">Any cravings?</h1>
            <p className="mt-2 text-text-secondary">Be honest — it helps to track.</p>
            <div className="mt-8">
              <CravingScale value={craving} onChange={setCraving} />
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={craving === null}
                className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Notes */}
        {step === 3 && (
          <div>
            <h1 className="font-serif text-3xl font-bold text-text">Anything on your mind?</h1>
            <p className="mt-2 text-text-secondary">This is just for you.</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              rows={4}
              placeholder="Write a quick note..."
              className="mt-8 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <p className="mt-1 text-right text-xs text-text-secondary">{note.length}/280</p>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSkip}
                disabled={submitting}
                className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {step === 'done' && (
          <div className="text-center pt-16">
            <h1 className="font-serif text-5xl font-bold text-text">Logged.</h1>
            <p className="mt-6 text-lg text-text-secondary">
              {getConfirmationMessage(profile?.quit_date)}
            </p>
            <button
              onClick={() => navigate('/app')}
              className="mt-10 py-3 px-8 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
