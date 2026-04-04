export const MOODS = [
  { value: 1, label: 'Rough', mouth: 'M6 11 Q8 13 10 11' },
  { value: 2, label: 'Low', mouth: 'M6 10.5 Q8 12 10 10.5' },
  { value: 3, label: 'Okay', mouth: 'M6 10 L10 10' },
  { value: 4, label: 'Good', mouth: 'M6 9.5 Q8 11.5 10 9.5' },
  { value: 5, label: 'Great', mouth: 'M5.5 9 Q8 12.5 10.5 9' },
]

export const CRAVING_LEVELS = [
  { value: 1, label: 'None' },
  { value: 2, label: 'Mild' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Strong' },
  { value: 5, label: 'Overwhelming' },
]

export function getMood(value) {
  return MOODS.find(m => m.value === value)
}

export function getCravingLevel(value) {
  return CRAVING_LEVELS.find(l => l.value === value)
}
