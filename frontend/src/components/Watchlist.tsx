import { useState, useEffect } from 'react'
import { api } from '../api'
import { ScoreIndicator } from './ScoreBar'

export default function Watchlist() {
  const [ticker, setTicker] = useState('')
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  // Load watchlist from backend on mount
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const data = await api.getWatchlist()
        setWatchlist(data.tickers)
      } catch (e) {
        console.error('Failed to load watchlist from backend')
      }
    }
    loadWatchlist()
  }, [])

  const addTicker = async () => {
    const symbol = ticker.toUpperCase().trim()
    if (!symbol) {
      setError('Please enter a ticker symbol')
      return
    }

    try {
      setError('')
      const updatedTickers = await api.addToWatchlist(symbol)
      setWatchlist(updatedTickers)
      setTicker('')
      setSuccess(`Added ${symbol} to watchlist`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to add ${symbol}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const removeTicker = async (symbol: string) => {
    try {
      const updatedTickers = await api.removeFromWatchlist(symbol)
      setWatchlist(updatedTickers)
      setSuccess(`Removed ${symbol} from watchlist`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to remove ${symbol}`)
    }
  }

  const evaluateWatchlist = async () => {
    if (watchlist.length === 0) {
      setError('Watchlist is empty')
      return
    }

    try {
      setLoading(true)
      setError('')
      setShowResults(false)

      const stocks = await api.evaluateWatchlist(watchlist)
      setResults(stocks)
      setShowResults(true)
    } catch (err) {
      setError('Failed to evaluate watchlist. Make sure backend is running on port 3000.')
    } finally {
      setLoading(false)
    }
  }

  const clearWatchlist = async () => {
    if (confirm('Clear all tickers from watchlist?')) {
      try {
        const updatedTickers = await api.clearWatchlist()
        setWatchlist(updatedTickers)
        setSuccess('Watchlist cleared')
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError('Failed to clear watchlist')
      }
    }
  }

  return (
    <div>
      <h2 className="card-title">Watchlist</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <div className="card-title">Add Ticker</div>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter stock ticker (e.g., AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTicker()}
            style={{ textTransform: 'uppercase' }}
          />
          <button className="btn" onClick={addTicker}>Add</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Your Tickers ({watchlist.length})</div>

        {watchlist.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            No tickers yet. Add some above to get started!
          </p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((symbol) => (
                  <tr key={symbol}>
                    <td><strong>{symbol}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => removeTicker(symbol)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn"
                onClick={evaluateWatchlist}
                disabled={loading}
              >
                {loading ? 'Evaluating...' : '📊 Evaluate'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={clearWatchlist}
              >
                Clear All
              </button>
            </div>
          </>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="card">
          <div className="card-title">📊 Watchlist Results</div>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Piotroski F-Score</th>
                <th>Value Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((stock) => (
                <tr key={stock.symbol}>
                  <td><strong>{stock.symbol}</strong></td>
                  <td>{stock.piotroskiScore ? <ScoreIndicator score={stock.piotroskiScore} max={9} /> : '-'}</td>
                  <td>{stock.valueScore ? <ScoreIndicator score={stock.valueScore} max={100} /> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
