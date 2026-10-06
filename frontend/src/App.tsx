import { FormEvent, useRef, useState } from 'react'
import './App.css'
import Watchlist from './components/Watchlist'
import SectorBrowser from './components/SectorBrowser'
import IndustryBrowser from './components/IndustryBrowser'
import QuoteLookup from './components/QuoteLookup'

type View = 'watchlist' | 'sectors' | 'industries' | 'quote'

function App() {
  const [view, setView] = useState<View>('sectors')
  const [quoteInput, setQuoteInput] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null)
  // Store component instances to preserve state when switching tabs
  const sectorBrowserRef = useRef<any>(null)
  const industryBrowserRef = useRef<any>(null)

  const onQuoteSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const symbol = quoteInput.trim().toUpperCase()
    if (!symbol) return

    setSelectedQuote(symbol)
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
              placeholder="Search quote (AAPL, MSFT, MFA...)"
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
        <div style={{ display: view === 'watchlist' ? 'block' : 'none' }}>
          <Watchlist />
        </div>
        <div style={{ display: view === 'sectors' ? 'block' : 'none' }}>
          <SectorBrowser ref={sectorBrowserRef} />
        </div>
        <div style={{ display: view === 'industries' ? 'block' : 'none' }}>
          <IndustryBrowser ref={industryBrowserRef} />
        </div>
        <div style={{ display: view === 'quote' ? 'block' : 'none' }}>
          <QuoteLookup symbol={selectedQuote} />
        </div>
      </main>
    </div>
  )
}

export default App
