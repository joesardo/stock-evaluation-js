import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import Watchlist from './components/Watchlist'
import SectorBrowser from './components/SectorBrowser'
import IndustryBrowser from './components/IndustryBrowser'

type View = 'dashboard' | 'watchlist' | 'sectors' | 'industries'

function App() {
  const [view, setView] = useState<View>('dashboard')

  return (
    <div className="app">
      <header className="header">
        <h1>📊 Stock Evaluator</h1>
        <nav className="nav">
          <button 
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
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
        {view === 'dashboard' && <Dashboard />}
        {view === 'watchlist' && <Watchlist />}
        {view === 'sectors' && <SectorBrowser />}
        {view === 'industries' && <IndustryBrowser />}
      </main>
    </div>
  )
}

export default App
