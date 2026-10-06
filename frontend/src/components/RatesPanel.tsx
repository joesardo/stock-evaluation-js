import { RatesSnapshot } from '../api'

interface RatesPanelProps {
  rates: RatesSnapshot | null
  loading: boolean
  error: string
  onRefresh: () => void
}

function formatInstrumentValue(symbol: string, value: number | null) {
  if (value === null || value === undefined) return 'N/A'
  if (symbol === '^IRX' || symbol === '^TNX') return `${value.toFixed(2)}%`
  return `$${value.toFixed(2)}`
}

function formatChange(changePct: number | null) {
  if (changePct === null || changePct === undefined) {
    return { text: 'N/A', color: 'var(--text-secondary)' }
  }

  if (changePct > 0) {
    return { text: `+${changePct.toFixed(2)}%`, color: '#10b981' }
  }
  if (changePct < 0) {
    return { text: `${changePct.toFixed(2)}%`, color: '#ef4444' }
  }
  return { text: '0.00%', color: 'var(--text-secondary)' }
}

function getRegimeTone(level: string, trend: string): { emoji: string; text: string; color: string } {
  if (level === 'high' && trend === 'rising') {
    return { emoji: '📈', text: 'High & Rising', color: '#ef4444' }
  }
  if (level === 'high' && trend === 'falling') {
    return { emoji: '↘️', text: 'High but Falling', color: '#f59e0b' }
  }
  if (level === 'low' && trend === 'falling') {
    return { emoji: '📉', text: 'Low & Falling', color: '#3b82f6' }
  }
  if (level === 'low' && trend === 'rising') {
    return { emoji: '↗️', text: 'Low but Rising', color: '#10b981' }
  }
  return { emoji: '➖', text: 'Mixed/Stable', color: '#94a3b8' }
}

function RatesPanel({ rates, loading, error, onRefresh }: RatesPanelProps) {
  const tone = rates ? getRegimeTone(rates.regime.level, rates.regime.trend) : null

  return (
    <div className="card rates-panel">
      <div className="rates-panel-header">
        <div>
          <div className="card-title" style={{ marginBottom: '0.35rem' }}>🏦 Rates Dashboard</div>
          {rates && tone ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: tone.color }}>{tone.emoji} {tone.text}</strong> · {rates.regime.summary}
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              3M T-Bill, 10Y Treasury, Gold, and Crude Oil from Yahoo Finance
            </div>
          )}
        </div>

        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Rates'}
        </button>
      </div>

      {error && <div className="error" style={{ marginTop: '0.8rem' }}>{error}</div>}

      {rates && (
        <div className="rates-grid">
          {[rates.rates.threeMonth, rates.rates.tenYear, rates.rates.gold, rates.rates.crudeOil].map((item) => {
            const change = formatChange(item.changePct)
            return (
              <div key={item.symbol} className="rates-item">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatInstrumentValue(item.symbol, item.yield)}</div>
                <div style={{ fontSize: '0.82rem', color: change.color, marginTop: '0.2rem', fontWeight: 600 }}>
                  {change.text} today
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RatesPanel
