import express, { Request, Response } from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { SectorBuilder } from './src/sector-builder'
import { DataFetcher } from './src/data-fetcher'
import { PiotroskiEvaluator } from './src/piotroski-evaluator'
import { ValueEvaluator } from './src/value-evaluator'

const app = express()
const PORT = 3000
const WATCHLIST_PATH = path.join(__dirname, 'watchlist.json')

app.use(cors())
app.use(express.json())

// Helper function to add timeout to async operations
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`))
    }, timeoutMs)
  })
  
  try {
    const result = await Promise.race([promise, timeoutPromise])
    if (timeoutHandle) clearTimeout(timeoutHandle)
    return result
  } catch (error) {
    if (timeoutHandle) clearTimeout(timeoutHandle)
    throw error
  }
}

// GET /api/sectors
app.get('/api/sectors', async (_req: Request, res: Response) => {
  try {
    const sectors = await SectorBuilder.getSectors()
    // Transform to array format for frontend
    const sectorArray = Object.entries(sectors).map(([key, data]: [string, any]) => ({
      name: data.name,
      symbols: data.symbols
    }))
    const result: { [key: string]: any[] } = {}
    Object.values(sectors).forEach((sector: any) => {
      result[sector.name] = sector.symbols.map((symbol: string) => ({ symbol }))
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sectors' })
  }
})

// GET /api/industries
app.get('/api/industries', async (_req: Request, res: Response) => {
  try {
    const industries = await SectorBuilder.getIndustries()
    // Transform to array format for frontend
    const result: { [key: string]: any[] } = {}
    Object.values(industries).forEach((industry: any) => {
      result[industry.name] = industry.symbols.map((symbol: string) => ({ symbol }))
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industries' })
  }
})

// Helper function to classify market cap
function getMarketCapCategory(marketCap: number | null): string {
  if (!marketCap || marketCap === 0) return 'N/A'
  const billionsMC = marketCap / 1_000_000_000
  if (billionsMC >= 200) return 'Mega'
  if (billionsMC >= 10) return 'Large'
  if (billionsMC >= 2) return 'Mid'
  if (billionsMC >= 0.3) return 'Small'
  if (billionsMC >= 0.05) return 'Micro'
  return 'Penny'
}

// Helper function to process stocks in batches with progress callback
async function evaluateStocksSequentially(
  symbols: string[], 
  onProgress?: (current: number, total: number, result?: any) => void
): Promise<any[]> {
  const results: any[] = []
  const batchSize = 1 // Fully sequential (batch size 1) to avoid any parallel API calls to Yahoo Finance

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    
    // Process this batch sequentially
    const batchPromises = batch.map(async (symbol: string) => {
      try {
        const data = await withTimeout(DataFetcher.fetchStockData(symbol), 15000)
        const piotroskiScore = PiotroskiEvaluator.calculateFScore(data)
        const valueScore = ValueEvaluator.calculateValueScore(data)
        const result = {
          symbol,
          company_name: data.company_name,
          piotroskiScore,
          valueScore,
          market_cap: data.market_cap,
          market_cap_category: getMarketCapCategory(data.market_cap),
          price: data.price
        }
        
        // Report individual result immediately for lazy loading
        if (onProgress) {
          onProgress(results.length + 1, symbols.length, result)
        }
        
        return result
      } catch (err) {
        console.error(`Failed to fetch ${symbol}: ${err instanceof Error ? err.message : String(err)}`)
        const result = {
          symbol,
          company_name: 'Unknown',
          piotroskiScore: 0,
          valueScore: 0,
          market_cap: null,
          market_cap_category: 'N/A',
          price: 0
        }
        
        // Still report even on error
        if (onProgress) {
          onProgress(results.length + 1, symbols.length, result)
        }
        
        return result
      }
    })

    // Wait for entire batch to complete before moving to next
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }

  return results
}

// POST /api/evaluate/sector
app.post('/api/evaluate/sector', async (req: Request, res: Response) => {
  try {
    const { sector } = req.body
    if (!sector) {
      return res.status(400).json({ error: 'Sector name required' })
    }

    const sectors = await SectorBuilder.getSectors()
    
    // Find the sector by comparing with the simplified name
    let targetSector: any = null
    for (const [_, sectorData] of Object.entries(sectors)) {
      if ((sectorData as any).name === sector) {
        targetSector = sectorData
        break
      }
    }

    if (!targetSector || !targetSector.symbols || targetSector.symbols.length === 0) {
      return res.status(404).json({ error: 'Sector not found' })
    }

    // Evaluate stocks sequentially to avoid rate limiting
    const results = await evaluateStocksSequentially(targetSector.symbols)
    res.json(results.sort((a: any, b: any) => b.piotroskiScore - a.piotroskiScore))
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate sector' })
  }
})

// POST /api/evaluate/industry
app.post('/api/evaluate/industry', async (req: Request, res: Response) => {
  try {
    const { industry } = req.body
    if (!industry) {
      return res.status(400).json({ error: 'Industry name required' })
    }

    const industries = await SectorBuilder.getIndustries()
    
    // Find the industry by comparing with the name
    let targetIndustry: any = null
    for (const [_, industryData] of Object.entries(industries)) {
      if ((industryData as any).name === industry) {
        targetIndustry = industryData
        break
      }
    }

    if (!targetIndustry || !targetIndustry.symbols || targetIndustry.symbols.length === 0) {
      return res.status(404).json({ error: 'Industry not found' })
    }

    // Evaluate stocks sequentially to avoid rate limiting
    const results = await evaluateStocksSequentially(targetIndustry.symbols)
    res.json(results.sort((a: any, b: any) => b.piotroskiScore - a.piotroskiScore))
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate industry' })
  }
})

// POST /api/evaluate/watchlist
app.post('/api/evaluate/watchlist', async (req: Request, res: Response) => {
  try {
    const { tickers } = req.body
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'Tickers array required' })
    }

    // Use sequential fetching for watchlist too
    const results = await evaluateStocksSequentially(tickers.map(t => t.toUpperCase()))
    res.json(results.sort((a: any, b: any) => b.piotroskiScore - a.piotroskiScore))
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate watchlist' })
  }
})

// Helper to read watchlist.json
function readWatchlist(): { tickers: string[]; lastUpdated: string } {
  try {
    const data = fs.readFileSync(WATCHLIST_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    return { tickers: [], lastUpdated: new Date().toISOString() }
  }
}

// Helper to write watchlist.json
function writeWatchlist(tickers: string[]): void {
  const data = {
    tickers,
    lastUpdated: new Date().toISOString()
  }
  fs.writeFileSync(WATCHLIST_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// GET /api/watchlist - Get current watchlist
app.get('/api/watchlist', (_req: Request, res: Response) => {
  try {
    const watchlist = readWatchlist()
    res.json(watchlist)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read watchlist' })
  }
})

// POST /api/watchlist/add - Add ticker to watchlist
app.post('/api/watchlist/add', (req: Request, res: Response) => {
  try {
    const { ticker } = req.body
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker required' })
    }

    const watchlist = readWatchlist()
    const symbol = ticker.toUpperCase().trim()

    if (watchlist.tickers.includes(symbol)) {
      return res.status(400).json({ error: `${symbol} is already in watchlist` })
    }

    watchlist.tickers.push(symbol)
    writeWatchlist(watchlist.tickers)

    res.json({ success: true, tickers: watchlist.tickers })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add ticker to watchlist' })
  }
})

// POST /api/watchlist/remove - Remove ticker from watchlist
app.post('/api/watchlist/remove', (req: Request, res: Response) => {
  try {
    const { ticker } = req.body
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker required' })
    }

    const watchlist = readWatchlist()
    const symbol = ticker.toUpperCase().trim()
    const originalLength = watchlist.tickers.length

    watchlist.tickers = watchlist.tickers.filter(t => t !== symbol)

    if (watchlist.tickers.length === originalLength) {
      return res.status(404).json({ error: `${symbol} not found in watchlist` })
    }

    writeWatchlist(watchlist.tickers)
    res.json({ success: true, tickers: watchlist.tickers })
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove ticker from watchlist' })
  }
})

// POST /api/watchlist/clear - Clear all tickers from watchlist
app.post('/api/watchlist/clear', (_req: Request, res: Response) => {
  try {
    writeWatchlist([])
    res.json({ success: true, tickers: [] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear watchlist' })
  }
})

// POST /api/watchlist/set - Set entire watchlist
app.post('/api/watchlist/set', (req: Request, res: Response) => {
  try {
    const { tickers } = req.body
    if (!Array.isArray(tickers)) {
      return res.status(400).json({ error: 'Tickers array required' })
    }

    const normalizedTickers = tickers.map(t => t.toUpperCase().trim())
    writeWatchlist(normalizedTickers)

    res.json({ success: true, tickers: normalizedTickers })
  } catch (error) {
    res.status(500).json({ error: 'Failed to set watchlist' })
  }
})

// GET /api/evaluate/sector-stream - Server-Sent Events for streaming results
app.get('/api/evaluate/sector-stream', async (req: Request, res: Response) => {
  try {
    const sector = req.query.sector as string
    if (!sector) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.write('data: ' + JSON.stringify({ error: 'Sector name required', type: 'error' }) + '\n\n')
      res.end()
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const sectors = await SectorBuilder.getSectors()
    
    // Find the sector
    let targetSector: any = null
    for (const [_, sectorData] of Object.entries(sectors)) {
      if ((sectorData as any).name === sector) {
        targetSector = sectorData
        break
      }
    }

    if (!targetSector || !targetSector.symbols || targetSector.symbols.length === 0) {
      res.write('data: ' + JSON.stringify({ error: 'Sector not found', type: 'error' }) + '\n\n')
      res.end()
      return
    }

    // Evaluate with progress callback
    const results = await evaluateStocksSequentially(
      targetSector.symbols,
      (current, total, result) => {
        if (result) {
          res.write('data: ' + JSON.stringify({ type: 'progress', result, current, total }) + '\n\n')
        }
      }
    )

    // Send final results for sorting
    const sorted = results.sort((a: any, b: any) => b.piotroskiScore - a.piotroskiScore)
    res.write('data: ' + JSON.stringify({ type: 'complete', results: sorted }) + '\n\n')
    res.end()
  } catch (error) {
    console.error('Error in sector-stream:', error)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.write('data: ' + JSON.stringify({ error: 'Failed to evaluate sector', type: 'error' }) + '\n\n')
    res.end()
  }
})

// GET /api/evaluate/industry-stream - Server-Sent Events for streaming results
app.get('/api/evaluate/industry-stream', async (req: Request, res: Response) => {
  try {
    const industry = req.query.industry as string
    if (!industry) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.write('data: ' + JSON.stringify({ error: 'Industry name required', type: 'error' }) + '\n\n')
      res.end()
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const industries = await SectorBuilder.getIndustries()
    
    // Find the industry
    let targetIndustry: any = null
    for (const [_, industryData] of Object.entries(industries)) {
      if ((industryData as any).name === industry) {
        targetIndustry = industryData
        break
      }
    }

    if (!targetIndustry || !targetIndustry.symbols || targetIndustry.symbols.length === 0) {
      res.write('data: ' + JSON.stringify({ error: 'Industry not found', type: 'error' }) + '\n\n')
      res.end()
      return
    }

    // Evaluate with progress callback
    const results = await evaluateStocksSequentially(
      targetIndustry.symbols,
      (current, total, result) => {
        if (result) {
          res.write('data: ' + JSON.stringify({ type: 'progress', result, current, total }) + '\n\n')
        }
      }
    )

    // Send final results for sorting
    const sorted = results.sort((a: any, b: any) => b.piotroskiScore - a.piotroskiScore)
    res.write('data: ' + JSON.stringify({ type: 'complete', results: sorted }) + '\n\n')
    res.end()
  } catch (error) {
    console.error('Error in industry-stream:', error)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.write('data: ' + JSON.stringify({ error: 'Failed to evaluate industry', type: 'error' }) + '\n\n')
    res.end()
  }
})

app.listen(PORT, () => {
  console.log(`Stock Evaluation API running on http://localhost:${PORT}`)
})
