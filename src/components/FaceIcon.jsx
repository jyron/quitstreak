export default function FaceIcon({ mood, size = 36, color = '#2D6A6A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" stroke={color} strokeWidth="1" fill="none" />
      <circle cx="5.5" cy="6.5" r="1" fill={color} />
      <circle cx="10.5" cy="6.5" r="1" fill={color} />
      <path d={mood.mouth} stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  )
}
