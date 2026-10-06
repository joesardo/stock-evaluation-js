import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { api, RatesSnapshot } from './api'
import Watchlist from './components/Watchlist'
import SectorBrowser from './components/SectorBrowser'
import IndustryBrowser from './components/IndustryBrowser'
import QuoteLookup from './components/QuoteLookup'
import RatesPanel from './components/RatesPanel'

type View = 'watchlist' | 'sectors' | 'industries' | 'quote'

function App() {
  const [view, setView] = useState<View>('sectors')
  const [quoteInput, setQuoteInput] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null)
  const [rates, setRates] = useState<RatesSnapshot | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState('')
  // Store component instances to preserve state when switching tabs
  const sectorBrowserRef = useRef<any>(null)
  const industryBrowserRef = useRef<any>(null)

  const loadRates = useCallback(async () => {
    try {
      setRatesLoading(true)
      setRatesError('')
      const snapshot = await api.getRates()
      setRates(snapshot)
    } catch (err) {
      setRatesError(err instanceof Error ? err.message : 'Failed to load rates')
    } finally {
      setRatesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  const onQuoteSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const query = quoteInput.trim()
    if (!query) return

    setSelectedQuote(query)
    setView('quote')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>📊 Stock Evaluator</h1>
          <form className="quote-search-form" onSubmit={onQuoteSearch}>
            <input
              type="search"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              placeholder="Search ticker or company (AAPL, Apple, MFA...)"
              aria-label="Search stock symbol"
            />
            <button className="btn" type="submit">Search</button>
          </form>
        </div>
        <nav className="nav">
          <button 
            className={`nav-btn ${view === 'watchlist' ? 'active' : ''}`}
            onClick={() => setView('watchlist')}
          >
            Watchlist
          </button>
          <button 
            className={`nav-btn ${view === 'sectors' ? 'active' : ''}`}
            onClick={() => setView('sectors')}
          >
            Sectors
          </button>
          <button 
            className={`nav-btn ${view === 'industries' ? 'active' : ''}`}
            onClick={() => setView('industries')}
          >
            Industries
          </button>
          <button 
            className={`nav-btn ${view === 'quote' ? 'active' : ''}`}
            onClick={() => setView('quote')}
          >
            Quote Search
          </button>
        </nav>
      </header>

      <main className="main-content">
        <RatesPanel
          rates={rates}
          loading={ratesLoading}
          error={ratesError}
          onRefresh={loadRates}
        />

        <div style={{ display: view === 'watchlist' ? 'block' : 'none' }}>
          <Watchlist />
        </div>
        <div style={{ display: view === 'sectors' ? 'block' : 'none' }}>
          <SectorBrowser ref={sectorBrowserRef} />
        </div>
        <div style={{ display: view === 'industries' ? 'block' : 'none' }}>
          <IndustryBrowser ref={industryBrowserRef} ratesRegime={rates?.regime ?? null} />
        </div>
        <div style={{ display: view === 'quote' ? 'block' : 'none' }}>
          <QuoteLookup symbol={selectedQuote} />
        </div>
      </main>
    </div>
  )
}

export default App
