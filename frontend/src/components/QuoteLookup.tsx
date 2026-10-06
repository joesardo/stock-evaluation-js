import { useEffect, useState } from 'react'
import { api, DetailedQuote } from '../api'

interface QuoteLookupProps {
  symbol: string | null
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  return value.toFixed(2)
}

function QuoteLookup({ symbol }: QuoteLookupProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<DetailedQuote | null>(null)

  useEffect(() => {
    if (!symbol) {
      setQuote(null)
      setError(null)
      return
    }

    let mounted = true

    const fetchQuote = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await api.getQuote(symbol)
        if (!mounted) return
        setQuote(result)
      } catch (err) {
        if (!mounted) return
        setQuote(null)
        setError(err instanceof Error ? err.message : 'Failed to fetch quote')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchQuote()

    return () => {
      mounted = false
    }
  }, [symbol])

  if (!symbol) {
    return (
      <div className="card">
        <div className="card-title">🔎 Quote Search</div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Search a ticker or company name from the top navigation (example: AAPL, Apple, Microsoft, MFA).
        </p>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading quote analysis for {symbol}...</div>
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}

      {quote && (
        <>
          {quote.query.toUpperCase() !== quote.symbol && (
            <div className="success">
              Matched "{quote.query}" to ticker <strong>{quote.symbol}</strong>
              {quote.matched_name ? ` (${quote.matched_name})` : ''}.
            </div>
          )}

          <div className="card">
            <div className="card-title">🔎 Quote Analysis: {quote.symbol}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Company</div>
                <div style={{ fontWeight: 600 }}>{quote.company_name}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Price</div>
                <div style={{ fontWeight: 600 }}>${quote.price.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>YTD</div>
                <div style={{ fontWeight: 600 }}>{formatPercent(quote.ytd_change)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Recommendation</div>
                <div style={{ fontWeight: 600 }}>{quote.recommendation}</div>
              </div>
            </div>
          </div>

          {quote.valueWarning && <div className="error">{quote.valueWarning}</div>}

          <div className="grid-2">
            <div className="card">
              <div className="card-title">📈 Quality (Piotroski): {quote.piotroski.score}/9 {quote.piotroski.grade}</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                {quote.piotroski.reasons.map((reason, idx) => (
                  <li key={`q-reason-${idx}`}>{reason}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <div className="card-title">💎 Value: {quote.value.score}/100 {quote.value.grade}</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                {quote.value.reasons.map((reason, idx) => (
                  <li key={`v-reason-${idx}`}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📊 Key Metrics</div>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>P/E Ratio</td>
                  <td>{formatNumber(quote.metrics.pe_ratio)}</td>
                </tr>
                <tr>
                  <td>P/B Ratio</td>
                  <td>{formatNumber(quote.metrics.pb_ratio)}</td>
                </tr>
                <tr>
                  <td>Dividend Yield</td>
                  <td>{formatPercent(quote.metrics.dividend_yield)}</td>
                </tr>
                <tr>
                  <td>Debt-to-Equity</td>
                  <td>{formatNumber(quote.metrics.debt_to_equity)}</td>
                </tr>
                <tr>
                  <td>Current Ratio</td>
                  <td>{formatNumber(quote.metrics.current_ratio)}</td>
                </tr>
                <tr>
                  <td>52W Price Position</td>
                  <td>{formatPercent(quote.metrics.price_position)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default QuoteLookup
