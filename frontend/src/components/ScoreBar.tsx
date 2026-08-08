interface ScoreIndicatorProps {
  score: number
  max: number
}

export function ScoreIndicator({ score, max }: ScoreIndicatorProps) {
  // Determine color based on score
  let bgColor = '#ef4444' // Red - poor
  let textColor = '#fff'

  if (max === 9) {
    // Piotroski F-Score (0-9)
    if (score >= 7) bgColor = '#10b981' // Green - good
    else if (score >= 5) bgColor = '#f59e0b' // Orange - medium
  } else {
    // Value Score (0-100)
    if (score >= 70) bgColor = '#10b981' // Green - good
    else if (score >= 40) bgColor = '#f59e0b' // Orange - medium
  }

  return (
    <div
      style={{
        display: 'inline-block',
        backgroundColor: bgColor,
        color: textColor,
        padding: '0.35rem 0.75rem',
        borderRadius: '0.375rem',
        fontWeight: '600',
        fontSize: '0.875rem',
        minWidth: '3rem',
        textAlign: 'center'
      }}
    >
      {score.toFixed(1)}
    </div>
  )
}

export function getPiotroskiColor(score: number): string {
  if (score >= 7) return '#10b981'
  if (score >= 5) return '#f59e0b'
  return '#ef4444'
}

export function getValueColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}
