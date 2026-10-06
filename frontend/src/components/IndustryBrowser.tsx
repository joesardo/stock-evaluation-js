import { useState, useEffect, forwardRef } from 'react'
import { api, RatesRegime } from '../api'
import { ScoreIndicator } from './ScoreBar'

interface Industry {
  name: string
  count: number
}

interface IndustryBrowserProps {
  ratesRegime?: RatesRegime | null
}

const GROUP_ORDER = [
  'Technology',
  'Financials',
  'Healthcare',
  'Consumer',
  'Energy',
  'Industrials',
  'Materials',
  'Utilities',
  'Transportation',
  'Media & Telecom',
  'Real Estate',
  'Distribution',
  'Other'
]

function getIndustryGroup(name: string): string {
  const n = name.toLowerCase()

  if (
    n.includes('semiconductor') ||
    n.includes('computer') ||
    n.includes('software') ||
    n.includes('information technology') ||
    n.includes('data processing') ||
    n.includes('electronic') ||
    n.includes('internet')
  ) return 'Technology'

  if (
    n.includes('bank') ||
    n.includes('insurance') ||
    n.includes('investment') ||
    n.includes('financial') ||
    n.includes('finance') ||
    n.includes('leasing') ||
    n.includes('trusts/mutual funds')
  ) return 'Financials'

  if (
    n.includes('pharmaceutical') ||
    n.includes('biotech') ||
    n.includes('medical') ||
    n.includes('health') ||
    n.includes('hospital') ||
    n.includes('nursing')
  ) return 'Healthcare'

  if (
    n.includes('retail') ||
    n.includes('store') ||
    n.includes('restaurant') ||
    n.includes('apparel') ||
    n.includes('footwear') ||
    n.includes('consumer') ||
    n.includes('food') ||
    n.includes('beverages') ||
    n.includes('tobacco') ||
    n.includes('hotel') ||
    n.includes('resort') ||
    n.includes('cruise') ||
    n.includes('gaming') ||
    n.includes('home furnishings') ||
    n.includes('home improvement')
  ) return 'Consumer'

  if (
    n.includes('oil') ||
    n.includes('gas') ||
    n.includes('coal') ||
    n.includes('drilling') ||
    n.includes('refining') ||
    n.includes('oilfield') ||
    n.includes('pipeline')
  ) return 'Energy'

  if (
    n.includes('industrial') ||
    n.includes('machinery') ||
    n.includes('manufacturing') ||
    n.includes('aerospace') ||
    n.includes('defense') ||
    n.includes('building products') ||
    n.includes('engineering') ||
    n.includes('construction') ||
    n.includes('commercial services') ||
    n.includes('office equipment') ||
    n.includes('tools & hardware')
  ) return 'Industrials'

  if (
    n.includes('steel') ||
    n.includes('metals') ||
    n.includes('minerals') ||
    n.includes('aluminum') ||
    n.includes('chemicals') ||
    n.includes('forest products') ||
    n.includes('pulp') ||
    n.includes('paper') ||
    n.includes('textiles') ||
    n.includes('packaging') ||
    n.includes('construction materials')
  ) return 'Materials'

  if (
    n.includes('utilities') ||
    n.includes('power generation') ||
    n.includes('gas distributors') ||
    n.includes('water utilities')
  ) return 'Utilities'

  if (
    n.includes('railroad') ||
    n.includes('transportation') ||
    n.includes('air freight') ||
    n.includes('airlines') ||
    n.includes('shipping') ||
    n.includes('trucking') ||
    n.includes('courier')
  ) return 'Transportation'

  if (
    n.includes('telecommunications') ||
    n.includes('cable') ||
    n.includes('satellite') ||
    n.includes('broadcasting') ||
    n.includes('publishing') ||
    n.includes('media') ||
    n.includes('advertising')
  ) return 'Media & Telecom'

  if (
    n.includes('real estate') ||
    n.includes('reit') ||
    n.includes('homebuilding')
  ) return 'Real Estate'

  if (
    n.includes('distributor') ||
    n.includes('distribution') ||
    n.includes('wholesale')
  ) return 'Distribution'

  return 'Other'
}

type OutlookTone = {
  emoji: string
  label: string
  color: string
  reason: string
}

function toneFromScore(score: number, reason: string): OutlookTone {
  if (score >= 2) return { emoji: '🟢', label: 'Tailwind', color: '#10b981', reason }
  if (score === 1) return { emoji: '🟩', label: 'Mild Tailwind', color: '#34d399', reason }
  if (score === -1) return { emoji: '🟧', label: 'Mild Headwind', color: '#fb923c', reason }
  if (score <= -2) return { emoji: '🔴', label: 'Headwind', color: '#ef4444', reason }
  return { emoji: '⚪', label: 'Mixed', color: 'var(--text-secondary)', reason }
}

function getIndustryRatesOutlook(industryName: string, regime: RatesRegime | null | undefined): OutlookTone {
  if (!regime) {
    return toneFromScore(0, 'Rates outlook unavailable')
  }

  const n = industryName.toLowerCase()
  const isHigh = regime.level === 'high'
  const isLow = regime.level === 'low'
  const isRising = regime.trend === 'rising'
  const isFalling = regime.trend === 'falling'
  const isInverted = regime.curve === 'inverted'

  // Real-estate / long-duration financing sensitive
  if (n.includes('real estate investment trusts') || n.includes('reit')) {
    if (isHigh || isRising) return toneFromScore(-2, 'REIT cash flows are rate-sensitive; mortgage/financing pressure in high/rising rates')
    if (isLow || isFalling) return toneFromScore(2, 'Lower/falling rates typically ease financing costs for REITs')
  }
  if (n.includes('real estate development') || n.includes('homebuilding')) {
    if (isHigh || isRising) return toneFromScore(-2, 'Mortgage affordability and project financing usually weaken in high/rising rates')
    if (isLow || isFalling) return toneFromScore(2, 'Lower/falling rates can improve housing affordability and project economics')
  }

  // Financials (nuanced: banks vs brokers/managers)
  if (n.includes('regional banks') || n.includes('major banks') || n.includes('savings banks')) {
    if (isHigh && !isInverted) return toneFromScore(2, 'Higher rates with normal curve can support bank net interest margins')
    if (isInverted) return toneFromScore(-1, 'Inverted curve can pressure deposit spreads and lending profitability')
    if (isFalling) return toneFromScore(-1, 'Falling rates can compress lending margins')
  }
  if (n.includes('insurance') || n.includes('specialty insurance') || n.includes('life/health insurance')) {
    if (isHigh) return toneFromScore(1, 'Insurers can benefit from higher reinvestment yields')
    if (isLow && isFalling) return toneFromScore(-1, 'Lower yields can pressure portfolio income for insurers')
  }
  if (n.includes('investment banks/brokers') || n.includes('investment managers') || n.includes('investment trusts/mutual funds')) {
    if (isFalling) return toneFromScore(1, 'Falling rates often help risk assets and transaction sentiment')
    if (isHigh && isRising) return toneFromScore(-1, 'Higher funding costs and tighter financial conditions can reduce activity')
  }

  // Utilities / defensives with bond-like duration
  if (n.includes('electric utilities') || n.includes('water utilities') || n.includes('gas distributors') || n.includes('alternative power generation')) {
    if (isHigh || isRising) return toneFromScore(-2, 'Utility valuations and financing tend to face pressure in high/rising rates')
    if (isLow || isFalling) return toneFromScore(2, 'Lower/falling rates are typically supportive for utility valuation multiples')
  }

  // Communications/media long-duration cash flows
  if (n.includes('telecommunications') || n.includes('cable/satellite') || n.includes('broadcasting') || n.includes('media conglomerates')) {
    if (isHigh || isRising) return toneFromScore(-1, 'Long-duration cash flows are usually less favored as discount rates rise')
    if (isLow || isFalling) return toneFromScore(1, 'Lower discount rates can support valuation multiples')
  }

  // Growth tech duration effect
  if (n.includes('software') || n.includes('internet') || n.includes('semiconductor') || n.includes('computer') || n.includes('electronic')) {
    if (isHigh || isRising) return toneFromScore(-1, 'Higher rates typically pressure longer-duration growth valuations')
    if (isLow || isFalling) return toneFromScore(1, 'Lower/falling rates often support growth valuation multiples')
  }

  // Consumer split: discretionary vs staples
  if (
    n.includes('apparel') || n.includes('specialty stores') || n.includes('department stores') ||
    n.includes('discount stores') || n.includes('restaurants') || n.includes('hotels/resorts/cruise lines') ||
    n.includes('casinos/gaming') || n.includes('recreational products') || n.includes('motor vehicles')
  ) {
    if (isHigh || isRising) return toneFromScore(-1, 'Discretionary demand can soften under higher financing costs')
    if (isLow || isFalling) return toneFromScore(1, 'Easier financial conditions can support discretionary spending')
  }
  if (n.includes('food') || n.includes('beverages') || n.includes('tobacco') || n.includes('household/personal care') || n.includes('drugstore chains')) {
    return toneFromScore(0, 'Staples are generally less rate-sensitive and more defensive')
  }

  // Energy and commodity-linked industries
  if (n.includes('integrated oil') || n.includes('oil & gas') || n.includes('oilfield') || n.includes('oil refining/marketing') || n.includes('coal')) {
    if (isHigh || isRising) return toneFromScore(2, 'Energy often benefits in inflationary/rising-rate macro backdrops')
    if (isLow && isFalling) return toneFromScore(-1, 'Lower growth/inflation regimes can soften commodity support')
  }

  // Materials / metals cyclicality
  if (n.includes('steel') || n.includes('metals') || n.includes('minerals') || n.includes('aluminum') || n.includes('chemicals') || n.includes('construction materials')) {
    if (isHigh || isRising) return toneFromScore(1, 'Cyclicals/materials can benefit if rates are rising alongside nominal growth')
    if (isLow && isFalling) return toneFromScore(-1, 'Disinflationary environments can reduce materials pricing support')
  }

  // Transport fuel/financing exposure
  if (n.includes('airlines') || n.includes('trucking') || n.includes('marine shipping') || n.includes('air freight') || n.includes('railroads')) {
    if (isHigh || isRising) return toneFromScore(-1, 'Transport names can face financing and cost pressures in tighter regimes')
    if (isFalling) return toneFromScore(1, 'Easing conditions can be supportive for cyclic transport demand')
  }

  const fallbackGroup = getIndustryGroup(industryName)
  if (fallbackGroup === 'Financials' && isInverted) {
    return toneFromScore(-1, 'Inverted curve can pressure several spread-dependent financial business models')
  }

  return toneFromScore(0, 'No strong rates signal for this industry in the current regime')
}

const IndustryBrowser = forwardRef(function IndustryBrowser({ ratesRegime }: IndustryBrowserProps) {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [currentStock, setCurrentStock] = useState<string>('')

  // Load industries from backend
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        setLoading(true)
        setError('')

        const industryData = await api.getIndustries()
        const industryList = Object.entries(industryData).map(([name, stocks]) => ({
          name,
          count: stocks.length
        }))
        setIndustries(industryList)
      } catch (err) {
        setError('Failed to load industries. Make sure backend is running on port 3000.')
      } finally {
        setLoading(false)
      }
    }

    loadIndustries()
  }, [])

  const filteredIndustries = industries.filter(ind =>
    ind.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedIndustries = filteredIndustries.reduce<Record<string, Industry[]>>((acc, industry) => {
    const group = getIndustryGroup(industry.name)
    if (!acc[group]) acc[group] = []
    acc[group].push(industry)
    return acc
  }, {})

  const sortedGroups = Object.entries(groupedIndustries)
    .map(([group, items]) => ({
      group,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
      totalStocks: items.reduce((sum, i) => sum + i.count, 0)
    }))
    .sort((a, b) => {
      const aIndex = GROUP_ORDER.indexOf(a.group)
      const bIndex = GROUP_ORDER.indexOf(b.group)
      const normalizedA = aIndex === -1 ? GROUP_ORDER.length : aIndex
      const normalizedB = bIndex === -1 ? GROUP_ORDER.length : bIndex
      return normalizedA - normalizedB
    })

  const evaluateIndustry = async (industryName: string) => {
    try {
      setLoading(true)
      setShowResults(true)
      setError('')
      setResults([])
      setCurrentStock('')

      await api.evaluateIndustryStream(
        industryName,
        (result) => {
          // Add each result as it arrives
          setResults(prev => {
            const newResults = [...prev, result]
            return newResults.sort((a: any, b: any) => {
              if (b.piotroskiScore !== a.piotroskiScore) {
                return b.piotroskiScore - a.piotroskiScore
              }
              return b.valueScore - a.valueScore
            })
          })
          setCurrentStock(result.symbol)
        },
        (finalResults) => {
          // All done
          setCurrentStock('')
          setLoading(false)
        },
        (error) => {
          setError(error || 'Failed to evaluate industry')
          setLoading(false)
        }
      )
    } catch (err) {
      setError('Failed to evaluate industry')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="card-title">Industries</h2>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="card-title">Browse Industries</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Explore 120+ granular industry classifications. Each industry card includes a rates-sensitive outlook indicator based on the live rates regime.
        </p>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.9rem', fontSize: '0.78rem' }}>
          Legend: 🟢 Tailwind · 🟩 Mild Tailwind · ⚪ Mixed · 🟧 Mild Headwind · 🔴 Headwind
        </p>

        <div className="input-group">
          <input
            type="search"
            placeholder="Search industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? null : filteredIndustries.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>
            {searchTerm ? 'No industries match your search' : 'No industries available'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {sortedGroups.map(({ group, items, totalStocks }) => (
              <div key={group}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.6rem',
                  paddingBottom: '0.4rem',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{group}</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {items.length} industries · {totalStocks.toLocaleString()} stocks
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {items.map((industry) => {
                    const outlook = getIndustryRatesOutlook(industry.name, ratesRegime)
                    return (
                      <button
                        key={industry.name}
                        className="card"
                        onClick={() => setSelectedIndustry(industry.name)}
                        style={{
                          textAlign: 'left',
                          cursor: 'pointer',
                          border: selectedIndustry === industry.name ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: selectedIndustry === industry.name ? 'var(--bg-tertiary)' : 'transparent',
                        }}
                      >
                        <div className="card-title" style={{ fontSize: '0.95rem' }}>{industry.name}</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          {industry.count} stocks
                        </p>
                        <div
                          title={`${outlook.label}: ${outlook.reason}`}
                          style={{ fontSize: '0.92rem', color: outlook.color }}
                          aria-label={`${outlook.label}: ${outlook.reason}`}
                        >
                          {outlook.emoji}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedIndustry && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="btn"
              onClick={() => evaluateIndustry(selectedIndustry)}
              disabled={loading}
            >
              {loading ? 'Evaluating...' : `📊 Evaluate ${selectedIndustry}`}
            </button>

            {loading && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  border: '3px solid var(--border)',
                  borderTop: '3px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Fetching stocks...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="card" style={{
          animation: 'fadeIn 0.3s ease-in',
          opacity: 1,
        }}>
          <div className="card-title">📊 SUMMARY - {selectedIndustry} Industry ({results.length} stocks)</div>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Market Cap</th>
                <th>Piotroski F-Score</th>
                <th>Value Score</th>
              </tr>
            </thead>
            <tbody>
              {results
                .sort((a, b) => b.piotroskiScore - a.piotroskiScore)
                .map((stock) => (
                  <tr key={stock.symbol}>
                    <td><strong>{stock.symbol}</strong></td>
                    <td style={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.company_name}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: stock.market_cap_category === 'Mega' ? '#0ea5e9' :
                                         stock.market_cap_category === 'Large' ? '#10b981' :
                                         stock.market_cap_category === 'Mid' ? '#f59e0b' :
                                         stock.market_cap_category === 'Small' ? '#ef4444' :
                                         stock.market_cap_category === 'Micro' ? '#8b5cf6' :
                                         stock.market_cap_category === 'Penny' ? '#6b7280' :
                                         '#9ca3af',
                        color: '#ffffff'
                      }}>
                        {stock.market_cap_category}
                      </span>
                    </td>
                    <td><ScoreIndicator score={stock.piotroskiScore} max={9} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ScoreIndicator score={stock.valueScore} max={100} />
                        {stock.valueWarning ? (
                          <span title={stock.valueWarning} style={{ cursor: 'help' }}>⚠️</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
})

export default IndustryBrowser
