import { useState, useEffect } from 'react'
import { api } from '../api'
import { ScoreIndicator } from './ScoreBar'

interface Sector {
  name: string
  count: number
}

export default function SectorBrowser() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  // Load sectors from backend
  useEffect(() => {
    const loadSectors = async () => {
      try {
        setLoading(true)
        setError('')
        
        const sectorData = await api.getSectors()
        const sectorList = Object.entries(sectorData).map(([name, stocks]) => ({
          name,
          count: stocks.length
        }))
        setSectors(sectorList)
      } catch (err) {
        setError('Failed to load sectors. Make sure backend is running on port 3000.')
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

      const stocks = await api.evaluateSector(sectorName)
      setResults(stocks)
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
                  {sector.count} stocks
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
                    <td><ScoreIndicator score={stock.piotroskiScore} max={9} /></td>
                    <td><ScoreIndicator score={stock.valueScore} max={100} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
