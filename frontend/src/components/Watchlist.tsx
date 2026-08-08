import { useState, useEffect } from 'react'
import { api, Stock } from '../api'
import { ScoreIndicator } from './ScoreBar'

export default function Watchlist() {
  const [ticker, setTicker] = useState('')
  const [watchlist, setWatchlist] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [results, setResults] = useState<Stock[]>([])
  const [showResults, setShowResults] = useState(false)

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('watchlist')
    if (stored) {
      try {
        setWatchlist(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to load watchlist from localStorage')
      }
    }
  }, [])

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  const addTicker = () => {
    const symbol = ticker.toUpperCase().trim()
    if (!symbol) {
      setError('Please enter a ticker symbol')
      return
    }

    if (watchlist.some(s => s.symbol === symbol)) {
      setError(`${symbol} is already in your watchlist`)
      return
    }

    const newStock: Stock = { symbol, piotroskiScore: 0, valueScore: 0 }
    setWatchlist([...watchlist, newStock])
    setTicker('')
    setError('')
    setSuccess(`Added ${symbol} to watchlist`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const removeTicker = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s.symbol !== symbol))
    setSuccess(`Removed ${symbol} from watchlist`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const evaluateWatchlist = async () => {
    if (watchlist.length === 0) {
      setError('Watchlist is empty')
      return
    }

    try {
      setLoading(true)
      setError('')

      const tickers = watchlist.map(s => s.symbol)
      const stocks = await api.evaluateWatchlist(tickers)
      setResults(stocks)
      setShowResults(true)
    } catch (err) {
      setError('Failed to evaluate watchlist. Make sure backend is running on port 3000.')
    } finally {
      setLoading(false)
    }
  }

  const clearWatchlist = () => {
    if (confirm('Clear all tickers from watchlist?')) {
      setWatchlist([])
      setSuccess('Watchlist cleared')
      setTimeout(() => setSuccess(''), 3000)
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
                {watchlist.map((stock) => (
                  <tr key={stock.symbol}>
                    <td><strong>{stock.symbol}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => removeTicker(stock.symbol)}
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
