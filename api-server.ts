import express, { Request, Response } from 'express'
import cors from 'cors'
import { SectorBuilder } from './src/sector-builder'
import { DataFetcher } from './src/data-fetcher'
import { PiotroskiEvaluator } from './src/piotroski-evaluator'
import { ValueEvaluator } from './src/value-evaluator'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

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

    // Evaluate stocks
    const results = await Promise.all(
      targetSector.symbols.map(async (symbol: string) => {
        try {
          const data = await DataFetcher.fetchStockData(symbol)
          const piotroskiScore = PiotroskiEvaluator.calculateFScore(data)
          const valueScore = ValueEvaluator.calculateValueScore(data)
          return {
            symbol,
            piotroskiScore,
            valueScore
          }
        } catch (err) {
          return {
            symbol,
            piotroskiScore: 0,
            valueScore: 0
          }
        }
      })
    )

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

    // Evaluate stocks
    const results = await Promise.all(
      targetIndustry.symbols.map(async (symbol: string) => {
        try {
          const data = await DataFetcher.fetchStockData(symbol)
          const piotroskiScore = PiotroskiEvaluator.calculateFScore(data)
          const valueScore = ValueEvaluator.calculateValueScore(data)
          return {
            symbol,
            piotroskiScore,
            valueScore
          }
        } catch (err) {
          return {
            symbol,
            piotroskiScore: 0,
            valueScore: 0
          }
        }
      })
    )

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

    const results = await Promise.all(
      tickers.map(async (symbol: string) => {
        try {
          const data = await DataFetcher.fetchStockData(symbol.toUpperCase())
          const piotroskiScore = PiotroskiEvaluator.calculateFScore(data)
          const valueScore = ValueEvaluator.calculateValueScore(data)
          return {
            symbol: symbol.toUpperCase(),
            piotroskiScore,
            valueScore
          }
        } catch (err) {
          return {
            symbol: symbol.toUpperCase(),
            piotroskiScore: 0,
            valueScore: 0
          }
        }
      })
    )

    res.json(results.sort((a: any, b: any) => b.piotroskiScore - a.piotroskiScore))
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate watchlist' })
  }
})

app.listen(PORT, () => {
  console.log(`Stock Evaluation API running on http://localhost:${PORT}`)
})
