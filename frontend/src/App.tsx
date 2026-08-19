import { useState, useRef } from 'react'
import './App.css'
import Watchlist from './components/Watchlist'
import SectorBrowser from './components/SectorBrowser'
import IndustryBrowser from './components/IndustryBrowser'

type View = 'watchlist' | 'sectors' | 'industries'

interface ViewState {
  sectors?: any
  industries?: any
}

function App() {
  const [view, setView] = useState<View>('sectors')
  // Store component instances to preserve state when switching tabs
  const sectorBrowserRef = useRef<any>(null)
  const industryBrowserRef = useRef<any>(null)

  return (
    <div className="app">
      <header className="header">
        <h1>📊 Stock Evaluator</h1>
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
      </main>
    </div>
  )
}

export default App
