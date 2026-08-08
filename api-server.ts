import express from 'express'
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
app.get('/api/sectors', async (_req, res) => {
  try {
    const sectors = await SectorBuilder.getSectors()
    res.json(sectors)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sectors' })
  }
})

// GET /api/industries
app.get('/api/industries', async (_req, res) => {
  try {
    const industries = await SectorBuilder.getIndustries()
    res.json(industries)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch industries' })
  }
})

// POST /api/evaluate/sector
app.post('/api/evaluate/sector', async (req, res) => {
  try {
    const { sector } = req.body
    if (!sector) {
      return res.status(400).json({ error: 'Sector name required' })
    }

    const sectors = await SectorBuilder.getSectors()
    const stocks = sectors[sector] || []

    if (stocks.length === 0) {
      return res.status(404).json({ error: 'Sector not found' })
    }

    // Evaluate stocks
    const results = await Promise.all(
      stocks.map(async (stock: any) => {
        try {
          const data = await DataFetcher.fetchStockData(stock.symbol)
          const piotroskiScore = PiotroskiEvaluator.calculate(data)
          const valueScore = ValueEvaluator.calculate(data)
          return {
            symbol: stock.symbol,
            piotroskiScore,
            valueScore
          }
        } catch (err) {
          return {
            symbol: stock.symbol,
            piotroskiScore: 0,
            valueScore: 0
          }
        }
      })
    )

    res.json(results.sort((a, b) => b.piotroskiScore - a.piotroskiScore))
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate sector' })
  }
})

// POST /api/evaluate/industry
app.post('/api/evaluate/industry', async (req, res) => {
  try {
    const { industry } = req.body
    if (!industry) {
      return res.status(400).json({ error: 'Industry name required' })
    }

    const industries = await SectorBuilder.getIndustries()
    const stocks = industries[industry] || []

    if (stocks.length === 0) {
      return res.status(404).json({ error: 'Industry not found' })
    }

    // Evaluate stocks
    const results = await Promise.all(
      stocks.map(async (stock: any) => {
        try {
          const data = await DataFetcher.fetchStockData(stock.symbol)
          const piotroskiScore = PiotroskiEvaluator.calculate(data)
          const valueScore = ValueEvaluator.calculate(data)
          return {
            symbol: stock.symbol,
            piotroskiScore,
            valueScore
          }
        } catch (err) {
          return {
            symbol: stock.symbol,
            piotroskiScore: 0,
            valueScore: 0
          }
        }
      })
    )

    res.json(results.sort((a, b) => b.piotroskiScore - a.piotroskiScore))
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate industry' })
  }
})

// POST /api/evaluate/watchlist
app.post('/api/evaluate/watchlist', async (req, res) => {
  try {
    const { tickers } = req.body
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'Tickers array required' })
    }

    const results = await Promise.all(
      tickers.map(async (symbol: string) => {
        try {
          const data = await DataFetcher.fetchStockData(symbol.toUpperCase())
          const piotroskiScore = PiotroskiEvaluator.calculate(data)
          const valueScore = ValueEvaluator.calculate(data)
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

    res.json(results.sort((a, b) => b.piotroskiScore - a.piotroskiScore))
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate watchlist' })
  }
})

app.listen(PORT, () => {
  console.log(`Stock Evaluation API running on http://localhost:${PORT}`)
})
