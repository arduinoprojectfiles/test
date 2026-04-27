import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TimelinePage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [method, setMethod]   = useState('')
  const [keyword, setKeyword] = useState('')
  const [author, setAuthor]   = useState('')
  const [expanded, setExpanded] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (method)  p.set('method',  method)
    if (keyword) p.set('keyword', keyword)
    if (author)  p.set('author',  author)
    fetch('/api/timeline?' + p.toString())
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [method, keyword, author])

  const toggle = (yr) => setExpanded(e => ({ ...e, [yr]: !e[yr] }))
  const maxCount = Math.max(...(data?.timeline || []).map(t => t.count), 1)

  return (
    <div>
      <div className="page-header">
        <h2>Research Timeline</h2>
        <p>How topics and methods evolved chronologically across your corpus</p>
      </div>
      <div className="page-body">

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Method</div>
            <select value={method} onChange={e => setMethod(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--rule)', fontFamily: 'var(--font-sans)', fontSize: 13, background: '#fff', color: 'var(--ink)', minWidth: 180 }}>
              <option value="">All methods</option>
              {(data?.all_methods || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Keyword</div>
            <select value={keyword} onChange={e => setKeyword(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--rule)', fontFamily: 'var(--font-sans)', fontSize: 13, background: '#fff', color: 'var(--ink)', minWidth: 180 }}>
              <option value="">All keywords</option>
              {(data?.all_keywords || []).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Author</div>
            <input type="text" placeholder="Filter by author…" value={author} onChange={e => setAuthor(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--rule)', fontFamily: 'var(--font-sans)', fontSize: 13, background: '#fff', color: 'var(--ink)', width: 180, outline: 'none' }} />
          </div>
          {(method || keyword || author) && (
            <button className="btn btn-ghost" style={{ fontSize: 12.5, alignSelf: 'flex-end' }}
              onClick={() => { setMethod(''); setKeyword(''); setAuthor('') }}>Clear filters</button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--ink-3)', padding: '40px 0' }}>
            <div className="spinner" /> Loading timeline…
          </div>
        ) : !data || data.total === 0 ? (
          <div className="empty-state">
            <h3>No documents match</h3>
            <p>Try adjusting your filters, or upload more documents.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 32, fontSize: 13.5, color: 'var(--ink-3)' }}>
              <span><strong style={{ color: 'var(--ink)' }}>{data.total}</strong> documents</span>
              {data.earliest && data.latest && (
                <span>
                  <strong style={{ color: 'var(--ink)' }}>{data.earliest}</strong>
                  {' — '}
                  <strong style={{ color: 'var(--ink)' }}>{data.latest}</strong>
                  {data.year_span > 0 && <span> · {data.year_span} year span</span>}
                </span>
              )}
            </div>

            {/* Publication Density Chart */}
            <div className="timeline-chart-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14 }}>Publication Density by Year</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Click a year to explore documents</div>
              </div>
              <div className="timeline-bars">
                {(data.timeline || []).filter(t => t.year).map(t => {
                  const methodColor = t.dominant_method === 'nlp' ? 'method-nlp' 
                    : t.dominant_method === 'ml' ? 'method-ml'
                    : t.dominant_method === 'stats' ? 'method-stats' : ''
                  return (
                    <div key={t.year} 
                      className={`timeline-bar ${methodColor}`}
                      title={`${t.year}: ${t.count} doc${t.count !== 1 ? 's' : ''} · ${t.dominant_method || 'mixed methods'}`}
                      style={{
                        height: Math.max(12, Math.round((t.count / maxCount) * 200)) + 'px',
                      }}
                      onClick={() => toggle(t.year)} />
                  )
                })}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', display: 'flex', gap: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, background: 'linear-gradient(180deg, #2d5be3 0%, #1e40af 100%)', borderRadius: 2 }} />
                  General
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)', borderRadius: 2 }} />
                  NLP
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, background: 'linear-gradient(180deg, #ec4899 0%, #be185d 100%)', borderRadius: 2 }} />
                  Machine Learning
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, background: 'linear-gradient(180deg, #06b6d4 0%, #0e7490 100%)', borderRadius: 2 }} />
                  Statistics
                </span>
              </div>
            </div>
                  }} />
                  <div style={{ fontSize: 9, color: 'var(--ink-3)', writingMode: 'vertical-lr',
                                transform: 'rotate(180deg)', height: 24, overflow: 'hidden' }}>
                    {t.year}
                  </div>
                </div>
              ))}
            </div>

            {/* Year rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(data.timeline || []).map(entry => {
                const key = entry.year ?? 'undated'
                const isOpen = !!expanded[key]
                return (
                  <div key={key} style={{ borderRadius: 10, border: '1px solid var(--rule)', background: '#fff', overflow: 'hidden' }}>
                    <button onClick={() => toggle(key)}
                      style={{ width: '100%', padding: '13px 20px', background: isOpen ? 'var(--accent-2)' : '#fff',
                               border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                               gap: 14, fontFamily: 'var(--font-sans)', transition: 'background 0.12s' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600,
                           color: 'var(--ink)', marginBottom: 8, display: 'block' }}>
              {t.year}
            </span>
                      <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                        {entry.count} document{entry.count !== 1 ? 's' : ''}
                      </span>
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--rule)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: Math.min(entry.count * 14, 100) + '%',
                                      background: isOpen ? 'var(--accent)' : 'var(--ink-3)', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--rule)' }}>
                        {entry.docs.map((doc, i) => (
                          <button key={doc.slug} onClick={() => navigate('/document/' + doc.slug)}
                            style={{ width: '100%', padding: '13px 20px 13px 72px', textAlign: 'left',
                                     border: 'none', borderBottom: i < entry.docs.length - 1 ? '1px solid var(--rule-2)' : 'none',
                                     background: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                                     transition: 'background 0.1s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--ink)',
                              marginBottom: 2 }}>
                  {doc.title}
                </div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {(doc.methods || []).slice(0, 2).map(m => (
                                <span key={m} style={{ background: '#eff6ff', color: '#1d4ed8',
                                                       padding: '1px 7px', borderRadius: 99, fontSize: 11 }}>{m}</span>
                              ))}
                              {(doc.keywords || []).slice(0, 3).map(k => (
                                <span key={k} className="tag" style={{ fontSize: 11 }}>{k}</span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
