import { useState, useEffect } from 'react'

const COLORS = ['#2D6A6A', '#D4A053', '#C0564B', '#6B6B6B', '#FAF8F5']

export default function Confetti({ count = 30 }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="confetti-container">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
            animationDelay: `${Math.random() * 0.8}s`,
            animationDuration: `${1 + Math.random() * 1}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            width: `${6 + Math.random() * 6}px`,
            height: `${6 + Math.random() * 6}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
