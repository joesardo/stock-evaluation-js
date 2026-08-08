import { useState, useEffect } from 'react'
import { api } from '../api'

interface Industry {
  name: string
  count: number
}

export default function IndustryBrowser() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  // Load industries from backend
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        setLoading(true)
        setError('')

        const industryData = await api.getIndustries()
        const industryList = Object.entries(industryData).map(([name, stocks]) => ({
          name,
          count: stocks.length
        }))
        setIndustries(industryList)
      } catch (err) {
        setError('Failed to load industries. Make sure backend is running on port 3000.')
      } finally {
        setLoading(false)
      }
    }

    loadIndustries()
  }, [])

  const filteredIndustries = industries.filter(ind =>
    ind.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const evaluateIndustry = async (industryName: string) => {
    try {
      setLoading(true)
      setError('')

      const stocks = await api.evaluateIndustry(industryName)
      setResults(stocks)
      setShowResults(true)
    } catch (err) {
      setError('Failed to evaluate industry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="card-title">Industries</h2>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="card-title">Browse Industries</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Explore 83+ granular industry classifications. Select an industry to evaluate all stocks in it.
        </p>

        <div className="input-group">
          <input
            type="search"
            placeholder="Search industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading">Loading industries...</div>
        ) : filteredIndustries.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>
            {searchTerm ? 'No industries match your search' : 'No industries available'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {filteredIndustries.map((industry) => (
              <button
                key={industry.name}
                className="card"
                onClick={() => setSelectedIndustry(industry.name)}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: selectedIndustry === industry.name ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: selectedIndustry === industry.name ? 'var(--bg-tertiary)' : 'transparent',
                }}
              >
                <div className="card-title" style={{ fontSize: '0.95rem' }}>{industry.name}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {industry.count} stocks
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedIndustry && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="btn"
              onClick={() => evaluateIndustry(selectedIndustry)}
              disabled={loading}
            >
              {loading ? 'Evaluating...' : `📊 Evaluate ${selectedIndustry}`}
            </button>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="card">
          <div className="card-title">📊 SUMMARY - {selectedIndustry} Industry ({results.length} stocks)</div>
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
