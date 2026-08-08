const API_URL = 'http://localhost:3000/api'

export interface Stock {
  symbol: string
  piotroskiScore: number
  valueScore: number
  quality?: number
  value?: number
}

export interface SectorData {
  name: string
  stocks: Stock[]
}

export interface IndustryData {
  name: string
  stocks: Stock[]
}

export const api = {
  async getSectors(): Promise<Record<string, Stock[]>> {
    try {
      const response = await fetch(`${API_URL}/sectors`)
      if (!response.ok) throw new Error('Failed to fetch sectors')
      return response.json()
    } catch (error) {
      console.error('Error fetching sectors:', error)
      return {}
    }
  },

  async getIndustries(): Promise<Record<string, Stock[]>> {
    try {
      const response = await fetch(`${API_URL}/industries`)
      if (!response.ok) throw new Error('Failed to fetch industries')
      return response.json()
    } catch (error) {
      console.error('Error fetching industries:', error)
      return {}
    }
  },

  async evaluateSector(sectorName: string): Promise<Stock[]> {
    try {
      const response = await fetch(`${API_URL}/evaluate/sector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: sectorName })
      })
      if (!response.ok) throw new Error('Failed to evaluate sector')
      return response.json()
    } catch (error) {
      console.error('Error evaluating sector:', error)
      return []
    }
  },

  async evaluateIndustry(industryName: string): Promise<Stock[]> {
    try {
      const response = await fetch(`${API_URL}/evaluate/industry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: industryName })
      })
      if (!response.ok) throw new Error('Failed to evaluate industry')
      return response.json()
    } catch (error) {
      console.error('Error evaluating industry:', error)
      return []
    }
  },

  async evaluateWatchlist(tickers: string[]): Promise<Stock[]> {
    try {
      const response = await fetch(`${API_URL}/evaluate/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      })
      if (!response.ok) throw new Error('Failed to evaluate watchlist')
      return response.json()
    } catch (error) {
      console.error('Error evaluating watchlist:', error)
      return []
    }
  }
}
