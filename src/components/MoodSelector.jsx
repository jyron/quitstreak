import { MOODS } from '../lib/checkinData'
import FaceIcon from './FaceIcon'

export default function MoodSelector({ value, onChange }) {
  return (
    <div className="flex gap-3 justify-center">
      {MOODS.map((mood) => {
        const selected = value === mood.value
        return (
          <button
            key={mood.value}
            onClick={() => onChange(mood.value)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-w-[60px] ${
              selected
                ? 'border-primary bg-primary/5'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <FaceIcon mood={mood} color={selected ? '#2D6A6A' : '#9CA3AF'} />
            <span className={`text-xs font-medium ${selected ? 'text-primary' : 'text-text-secondary'}`}>
              {mood.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
