import { useState, useEffect, forwardRef } from 'react'
import { api } from '../api'
import { ScoreIndicator } from './ScoreBar'

interface Industry {
  name: string
  count: number
}

const IndustryBrowser = forwardRef(function IndustryBrowser(_, ref) {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, startTime: 0 })

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
      setShowResults(false)
      setError('')

      // Find the selected industry to get stock count
      const industry = industries.find(i => i.name === industryName)
      const stockCount = industry?.count || 0
      
      // Initialize progress tracking (1 second per stock)
      setProgress({ current: 0, total: stockCount, startTime: Date.now() })

      // Simulate progress updates while fetching
      const progressInterval = setInterval(() => {
        setProgress(p => {
          const elapsed = (Date.now() - p.startTime) / 1000
          const estimated = Math.min(elapsed, p.total - 0.5) // Don't reach 100% until done
          return { ...p, current: estimated }
        })
      }, 500)

      const stocks = await api.evaluateIndustry(industryName)
      
      clearInterval(progressInterval)
      setProgress({ current: stockCount, total: stockCount, startTime: 0 })
      
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

            {loading && progress.total > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span>Fetching stock data...</span>
                  <span>{Math.round(progress.current)} / {progress.total}</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '24px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (progress.current / progress.total) * 100)}%`,
                    backgroundColor: '#10b981',
                    transition: 'width 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {Math.min(100, Math.round((progress.current / progress.total) * 100))}%
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Estimated time: ~{Math.ceil(progress.total * 0.05)}s
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="card" style={{
          animation: 'fadeIn 0.3s ease-in',
          opacity: 1,
        }}>
          <div className="card-title">📊 SUMMARY - {selectedIndustry} Industry ({results.length} stocks)</div>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Market Cap</th>
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
                    <td style={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.company_name}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: stock.market_cap_category === 'Mega' ? '#0ea5e9' :
                                         stock.market_cap_category === 'Large' ? '#10b981' :
                                         stock.market_cap_category === 'Mid' ? '#f59e0b' :
                                         stock.market_cap_category === 'Small' ? '#ef4444' :
                                         stock.market_cap_category === 'Micro' ? '#8b5cf6' :
                                         stock.market_cap_category === 'Penny' ? '#6b7280' :
                                         '#9ca3af',
                        color: '#ffffff'
                      }}>
                        {stock.market_cap_category}
                      </span>
                    </td>
                    <td><ScoreIndicator score={stock.piotroskiScore} max={9} /></td>
                    <td><ScoreIndicator score={stock.valueScore} max={100} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
})

export default IndustryBrowser
