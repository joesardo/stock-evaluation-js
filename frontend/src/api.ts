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

  async evaluateSectorStream(
    sectorName: string,
    onResult: (result: Stock) => void,
    onComplete: (allResults: Stock[]) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      console.log(`[Stream] Connecting to /evaluate/sector-stream for ${sectorName}`)
      const url = `${API_URL}/evaluate/sector-stream?sector=${encodeURIComponent(sectorName)}`
      console.log(`[Stream] URL: ${url}`)
      
      const eventSource = new EventSource(url)
      const allResults: Stock[] = []
      let hasReceivedData = false

      const timeout = setTimeout(() => {
        if (!hasReceivedData) {
          console.error('[Stream] Timeout - no data received')
          eventSource.close()
          onError('Connection timeout - no data received')
        }
      }, 5000)

      eventSource.onmessage = (event) => {
        hasReceivedData = true
        clearTimeout(timeout)
        console.log(`[Stream] Message:`, event.data.substring(0, 100))
        
        try {
          const data = JSON.parse(event.data)
          console.log(`[Stream] Parsed:`, data.type, data.symbol || '')
          
          if (data.type === 'progress' && data.result) {
            onResult(data.result)
            allResults.push(data.result)
          } else if (data.type === 'complete') {
            console.log(`[Stream] Complete`)
            onComplete(data.results || allResults)
            eventSource.close()
          } else if (data.type === 'error') {
            console.error(`[Stream] Error from server:`, data.error)
            onError(data.error || 'Unknown error')
            eventSource.close()
          }
        } catch (err) {
          console.error('[Stream] Parse error:', err, event.data)
        }
      }

      eventSource.onerror = (error) => {
        clearTimeout(timeout)
        console.error('[Stream] EventSource error:', error)
        console.error('[Stream] ReadyState:', eventSource.readyState)
        eventSource.close()
        onError('Connection error')
      }
      
      eventSource.onopen = () => {
        console.log('[Stream] Connection opened')
      }
    } catch (error) {
      console.error('[Stream] Exception:', error)
      onError(error instanceof Error ? error.message : 'Unknown error')
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

  async evaluateIndustryStream(
    industryName: string,
    onResult: (result: Stock) => void,
    onComplete: (allResults: Stock[]) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      console.log(`[Stream] Connecting to /evaluate/industry-stream for ${industryName}`)
      const url = `${API_URL}/evaluate/industry-stream?industry=${encodeURIComponent(industryName)}`
      console.log(`[Stream] URL: ${url}`)
      
      const eventSource = new EventSource(url)
      const allResults: Stock[] = []
      let hasReceivedData = false

      const timeout = setTimeout(() => {
        if (!hasReceivedData) {
          console.error('[Stream] Timeout - no data received')
          eventSource.close()
          onError('Connection timeout - no data received')
        }
      }, 5000)

      eventSource.onmessage = (event) => {
        hasReceivedData = true
        clearTimeout(timeout)
        console.log(`[Stream] Message:`, event.data.substring(0, 100))
        
        try {
          const data = JSON.parse(event.data)
          console.log(`[Stream] Parsed:`, data.type, data.symbol || '')
          
          if (data.type === 'progress' && data.result) {
            onResult(data.result)
            allResults.push(data.result)
          } else if (data.type === 'complete') {
            console.log(`[Stream] Complete`)
            onComplete(data.results || allResults)
            eventSource.close()
          } else if (data.type === 'error') {
            console.error(`[Stream] Error from server:`, data.error)
            onError(data.error || 'Unknown error')
            eventSource.close()
          }
        } catch (err) {
          console.error('[Stream] Parse error:', err, event.data)
        }
      }

      eventSource.onerror = (error) => {
        clearTimeout(timeout)
        console.error('[Stream] EventSource error:', error)
        console.error('[Stream] ReadyState:', eventSource.readyState)
        eventSource.close()
        onError('Connection error')
      }
      
      eventSource.onopen = () => {
        console.log('[Stream] Connection opened')
      }
    } catch (error) {
      console.error('[Stream] Exception:', error)
      onError(error instanceof Error ? error.message : 'Unknown error')
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
  },

  async getWatchlist(): Promise<{ tickers: string[]; lastUpdated: string }> {
    try {
      const response = await fetch(`${API_URL}/watchlist`)
      if (!response.ok) throw new Error('Failed to fetch watchlist')
      return response.json()
    } catch (error) {
      console.error('Error fetching watchlist:', error)
      return { tickers: [], lastUpdated: new Date().toISOString() }
    }
  },

  async addToWatchlist(ticker: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/watchlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      })
      if (!response.ok) throw new Error('Failed to add to watchlist')
      const data = await response.json()
      return data.tickers
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      throw error
    }
  },

  async removeFromWatchlist(ticker: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/watchlist/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      })
      if (!response.ok) throw new Error('Failed to remove from watchlist')
      const data = await response.json()
      return data.tickers
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      throw error
    }
  },

  async clearWatchlist(): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/watchlist/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (!response.ok) throw new Error('Failed to clear watchlist')
      const data = await response.json()
      return data.tickers
    } catch (error) {
      console.error('Error clearing watchlist:', error)
      throw error
    }
  },

  async setWatchlist(tickers: string[]): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/watchlist/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      })
      if (!response.ok) throw new Error('Failed to set watchlist')
      const data = await response.json()
      return data.tickers
    } catch (error) {
      console.error('Error setting watchlist:', error)
      throw error
    }
  }
}
