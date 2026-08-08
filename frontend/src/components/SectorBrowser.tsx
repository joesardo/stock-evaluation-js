import { useState, useEffect } from 'react'

interface Sector {
  name: string
  stocks: string[]
}

export default function SectorBrowser() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  // Load sectors from cache/sectors.json
  useEffect(() => {
    const loadSectors = async () => {
      try {
        setLoading(true)
        
        // For demo, show placeholder sectors
        setSectors([
          { name: 'Technology', stocks: ['AAPL', 'MSFT', 'GOOGL'] },
          { name: 'Healthcare', stocks: ['JNJ', 'UNH', 'PFE'] },
          { name: 'Banking', stocks: ['JPM', 'BAC', 'WFC'] },
          { name: 'Retail', stocks: ['AMZN', 'WMT', 'TM'] },
          { name: 'Energy', stocks: ['XOM', 'CVX', 'MPC'] },
        ])
      } catch (err) {
        setError('Failed to load sectors')
      } finally {
        setLoading(false)
      }
    }

    loadSectors()
  }, [])

  const evaluateSector = async (sectorName: string) => {
    try {
      setLoading(true)
      setError('')

      // For demo, show placeholder results
      const sector = sectors.find(s => s.name === sectorName)
      setResults(
        (sector?.stocks || []).map((symbol) => ({
          symbol,
          piotroskiScore: Math.random() * 9,
          valueScore: Math.random() * 100,
        }))
      )
      setShowResults(true)
    } catch (err) {
      setError('Failed to evaluate sector')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="card-title">Sectors</h2>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="card-title">Browse Sectors</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Select a sector to see all stocks in that category and evaluate them
        </p>

        {loading ? (
          <div className="loading">Loading sectors...</div>
        ) : sectors.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No sectors available</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {sectors.map((sector) => (
              <button
                key={sector.name}
                className={`card ${selectedSector === sector.name ? 'active' : ''}`}
                onClick={() => setSelectedSector(sector.name)}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: selectedSector === sector.name ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: selectedSector === sector.name ? 'var(--bg-tertiary)' : 'transparent',
                }}
              >
                <div className="card-title" style={{ fontSize: '1rem' }}>{sector.name}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {sector.stocks.length} stocks
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedSector && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="btn"
              onClick={() => evaluateSector(selectedSector)}
              disabled={loading}
            >
              {loading ? 'Evaluating...' : `📊 Evaluate ${selectedSector}`}
            </button>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="card">
          <div className="card-title">📊 SUMMARY - {selectedSector} Sector ({results.length} stocks)</div>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Piotroski F-Score</th>
                <th>Value Score</th>
              </tr>
            </thead>
            <tbody>
              {results
                .sort((a, b) => b.piotroskiScore - a.piotroskiScore)
                .map((stock) => (
                  <tr key={stock.symbol}>
                    <td><strong>{stock.symbol}</strong></td>
                    <td>{stock.piotroskiScore.toFixed(1)}</td>
                    <td>{stock.valueScore.toFixed(1)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
