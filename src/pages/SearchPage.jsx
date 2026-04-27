import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function SearchPage() {
  const [query, setQuery]     = useState('')
  const [mode, setMode]       = useState('hybrid')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const navigate = useNavigate()

  async function doSearch(e) {
    e && e.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(null)
    try {
      const data = await api.search(query.trim(), mode)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Search the knowledge base</h2>
        <p>Find papers, passages, and concepts across your entire corpus</p>
      </div>
      <div className="page-body">
        <form onSubmit={doSearch}>
          <div className="search-wrap">
            <input className="search-input" type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by concept, method, author, keyword…" autoFocus />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? '…' : 'Search'}
            </button>
          </div>
          <div className="mode-tabs">
            {[['hybrid','⚡ Hybrid'],['vector','🔮 Semantic'],['bm25','🔤 Keyword']].map(([m, label]) => (
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

        {results && !loading && (
          <div>
            <div style={{ marginTop: 28, marginBottom: 4, fontSize: 12.5, color: 'var(--ink-3)' }}>
              {results.total} result{results.total !== 1 ? 's' : ''} for &ldquo;{results.query}&rdquo; — {results.mode} search
            </div>
            {results.results.length === 0 ? (
              <div className="no-results"><p>No matching documents found.</p></div>
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
              Hybrid search fans out to both semantic vectors and keyword index simultaneously,
              then fuses results using Reciprocal Rank Fusion.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['network meta-analysis','randomised controlled trial','machine learning classification','systematic review methodology'].map(e => (
                <button key={e} className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setQuery(e)}>{e}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
