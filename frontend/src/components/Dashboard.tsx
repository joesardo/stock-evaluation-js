import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError('')
        
        // For now, show placeholder stats
        setStats({
          sectors: 12,
          industries: 83,
          watchlistTickers: 0,
          lastUpdate: new Date().toLocaleDateString()
        })
      } catch (err) {
        setError('Failed to load dashboard stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div>
      <h2 className="card-title">Dashboard</h2>
      
      {error && <div className="error">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : stats ? (
        <div className="grid-2">
          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div className="card-title">{stats.sectors} Sectors</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Major industry categories from Yahoo Finance
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
            <div className="card-title">{stats.industries} Industries</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Granular industry classifications
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
            <div className="card-title">Watchlist</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Track your favorite stocks
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
            <div className="card-title">Live Data</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Powered by Yahoo Finance API
            </p>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-title">Quick Start</div>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.75' }}>
          <li>📊 <strong>Sectors</strong> - Browse stocks by broad industry categories</li>
          <li>🏢 <strong>Industries</strong> - Explore granular industry classifications</li>
          <li>⭐ <strong>Watchlist</strong> - Track and evaluate your favorite stocks</li>
          <li>📈 <strong>Evaluation</strong> - Piotroski F-Score and value analysis</li>
        </ul>
      </div>
    </div>
  )
}
