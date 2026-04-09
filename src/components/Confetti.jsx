import { useEffect } from 'react'
import confetti from '@hiseb/confetti'

export default function Confetti() {
  useEffect(() => {
    confetti()
  }, [])

  return null
}
