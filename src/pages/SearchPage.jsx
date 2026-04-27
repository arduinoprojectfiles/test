import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function SearchPage() {
  const [query, setQuery]       = useState('')
  const [mode, setMode]         = useState('hybrid')
  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [instant, setInstant]   = useState([])
  const [showInstant, setShowInstant] = useState(false)
  const timeoutRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) {
      setInstant([])
      setShowInstant(false)
      return
    }

    clearTimeout(timeoutRef.current)
    setLoading(true)

    timeoutRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query.trim(), mode)
        setInstant(data.results?.slice(0, 5) || [])
        setShowInstant(true)
        setLoading(false)
      } catch (err) {
        setInstant([])
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutRef.current)
  }, [query, mode])

  async function doSearch(e) {
    e && e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setShowInstant(false)
    try {
      const data = await api.search(query.trim(), mode)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const SearchResultSkeleton = () => (
    <div className="skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-title" style={{ width: '70%' }} />
          <div className="skeleton skeleton-line" style={{ width: '40%' }} />
        </div>
        <div className="skeleton" style={{ width: 80, height: 20 }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="skeleton skeleton-line" style={{ width: '95%' }} />
        <div className="skeleton skeleton-line" style={{ width: '90%' }} />
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h2>Search</h2>
        <p>Find papers, passages, and concepts across your corpus</p>
      </div>
      <div className="page-body">
        <form onSubmit={doSearch} style={{ position: 'relative' }}>
          <div className="search-wrap">
            <input className="search-input" type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowInstant(true)}
              onBlur={() => setTimeout(() => setShowInstant(false), 200)}
              placeholder="Search by concept, method, author, keyword…" autoFocus />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? '…' : 'Search'}
            </button>
          </div>

          {showInstant && instant.length > 0 && (
            <div className="search-instant-results">
              {instant.map(r => (
                <button key={r.document_slug} type="button" className="search-instant-result-item"
                  onClick={() => {
                    setShowInstant(false)
                    navigate('/document/' + r.document_slug)
                  }} >
                  <div className="search-instant-result-title">{r.title}</div>
                  <div className="search-instant-result-meta">
                    {r.authors && r.authors.length > 0 && (
                      <span>{r.authors.slice(0, 2).join(', ')}{r.authors.length > 2 ? ' et al.' : ''} · </span>
                    )}
                    {r.year && <span>{r.year}</span>}
                  </div>
                </button>
              ))}
              {instant.length > 0 && (
                <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--ink-3)', 
                              borderTop: '1px solid var(--rule-2)', textAlign: 'center' }}>
                  Press Enter to view all {instant.length}+ results
                </div>
              )}
            </div>
          )}
                  transition: 'background 0.1s'
                }}
                  onMouseDown={() => navigate('/document/' + r.document_slug)}
                  onMouseEnter={e => e.target.style.background = 'var(--paper-2)'}
                  onMouseLeave={e => e.target.style.background = 'none'}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                    {r.title?.substring(0, 50)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {r.authors?.[0] || 'Unknown'} {r.year ? `· ${r.year}` : ''}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mode-tabs">
            {[['hybrid','Hybrid'],['vector','Semantic'],['bm25','Keyword']].map(([m, label]) => (
              <button key={m} type="button" className={'mode-tab' + (mode === m ? ' active' : '')} onClick={() => setMode(m)}>
                {label}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div style={{ marginTop: 24, padding: '12px 16px', background: '#fef2f2',
                        borderRadius: 8, color: '#c0392b', fontSize: 14 }}>{error}</div>
        )}

        {loading && (
          <div style={{ marginTop: 28 }}>
            {[...Array(3)].map((_, i) => <SearchResultSkeleton key={i} />)}
          </div>
        )}

        {results && !loading && (
          <div>
            <div style={{ marginTop: 28, marginBottom: 4, fontSize: 12.5, color: 'var(--ink-3)' }}>
              {results.total} result{results.total !== 1 ? 's' : ''} for "{results.query}" — {results.mode} search
            </div>
            {results.results.length === 0 ? (
              <div className="empty-state">
                <svg className="icon-empty-state" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3>No results found</h3>
                <p>Try adjusting your search terms or search mode.</p>
              </div>
            ) : (
              <div className="result-list">
                {results.results.map(r => (
                  <button key={r.document_slug} className="result-card"
                    onClick={() => navigate('/document/' + r.document_slug)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div className="result-title">{r.title}</div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginTop: 3 }}>
                        {(r.sources || []).includes('semantic') && <span className="source-pill">semantic</span>}
                        {(r.sources || []).includes('keyword')  && <span className="source-pill kw">keyword</span>}
                      </div>
                    </div>
                    <div className="result-meta">
                      {r.authors && r.authors.length > 0 && (
                        <span>{r.authors.slice(0, 3).join(', ')}{r.authors.length > 3 ? ' et al.' : ''}</span>
                      )}
                      {r.year && <span>{r.year}</span>}
                      {r.section && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{r.section}</span>}
                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                        score {(r.rrf_score || 0).toFixed(4)}
                      </span>
                    </div>
                    {r.snippet_html ? (
                      <div className="result-snippet" dangerouslySetInnerHTML={{ __html: r.snippet_html }} />
                    ) : r.snippet ? (
                      <div className="result-snippet">{r.snippet}</div>
                    ) : null}
                    {((r.keywords && r.keywords.length > 0) || (r.methods && r.methods.length > 0)) && (
                      <div className="tag-list" style={{ marginTop: 10 }}>
                        {(r.keywords || []).slice(0, 4).map(k => <span key={k} className="tag">{k}</span>)}
                        {(r.methods  || []).slice(0, 2).map(m => (
                          <span key={m} className="tag" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{m}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!results && !loading && (
          <div style={{ marginTop: 56, maxWidth: 560 }}>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 16 }}>
              Hybrid search combines semantic vectors with keyword indexing to find relevant papers and passages.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['network meta-analysis','randomised controlled trial','machine learning','systematic review'].map(e => (
                <button key={e} className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setQuery(e)}>{e}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
