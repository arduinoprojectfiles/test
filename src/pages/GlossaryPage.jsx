import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const ALPHABET = ['#','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
const TYPE_STYLE = {
  keyword:      { background: '#f0fdf4', color: '#166534' },
  method:       { background: '#eff6ff', color: '#1d4ed8' },
  acronym:      { background: '#fef3c7', color: '#92400e' },
  named_entity: { background: '#fdf4ff', color: '#7e22ce' },
  concept:      { background: '#fef2f2', color: '#991b1b' },
}

export default function GlossaryPage() {
  const [terms, setTerms]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [prefix, setPrefix]     = useState('')
  const [typeFilter, setType]   = useState('')
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  const fetchTerms = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams({ limit: 300 })
    if (prefix && prefix !== '#') p.set('prefix', prefix)
    if (typeFilter) p.set('term_type', typeFilter)
    fetch('/api/glossary?' + p.toString())
      .then(r => r.json())
      .then(d => { setTerms(d.terms || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [prefix, typeFilter])

  useEffect(() => {
    if (search.length >= 2) {
      setLoading(true)
      fetch('/api/glossary/search?q=' + encodeURIComponent(search))
        .then(r => r.json())
        .then(d => { setTerms(Array.isArray(d) ? d : []); setTotal(Array.isArray(d) ? d.length : 0); setLoading(false) })
        .catch(() => setLoading(false))
    } else if (search.length === 0) {
      fetchTerms()
    }
  }, [search, fetchTerms])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h2>Concept Glossary</h2>
        <p>Terms and concepts extracted and organized from your corpus</p>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--rule)', minWidth: 0 }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
            <input type="text" className="search-input" placeholder="Search terms…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 320, padding: '8px 14px', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {ALPHABET.map(l => (
                <button key={l} onClick={() => { setPrefix(l === '#' ? '' : l); setSearch('') }}
                  style={{ width: 22, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer',
                           fontSize: 10, fontWeight: 500,
                           background: (prefix === l || (l === '#' && !prefix)) ? 'var(--accent)' : 'var(--paper-3)',
                           color:      (prefix === l || (l === '#' && !prefix)) ? '#fff' : 'var(--ink-3)' }}>
                  {l}
                </button>
              ))}
              <select value={typeFilter} onChange={e => setType(e.target.value)}
                style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--rule)',
                         fontSize: 12, fontFamily: 'var(--font-sans)', background: '#fff', color: 'var(--ink)', marginLeft: 4 }}>
                <option value="">All types</option>
                <option value="keyword">Keywords</option>
                <option value="method">Methods</option>
                <option value="acronym">Acronyms</option>
                <option value="named_entity">Named entities</option>
                <option value="concept">Concepts</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{total} terms</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 32, display: 'flex', gap: 10, color: 'var(--ink-3)', alignItems: 'center' }}>
                <div className="spinner" /> Loading…
              </div>
            ) : terms.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: 60 }}>
                <h3>No terms yet</h3>
                <p>Terms are extracted automatically when you upload documents.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {terms.map(t => {
                    const ts = TYPE_STYLE[t.type] || { background: 'var(--paper-3)', color: 'var(--ink-2)' }
                    const isSel = selected && selected.term === t.term
                    return (
                      <tr key={t.term} onClick={() => setSelected(t)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--rule-2)',
                                 background: isSel ? 'var(--accent-2)' : 'transparent' }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--paper-2)' }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = '' }}>
                        <td style={{ padding: '10px 16px 10px 24px', width: '50%' }}>
                          <span style={{ fontSize: 14, color: isSel ? 'var(--accent)' : 'var(--ink)', fontWeight: isSel ? 500 : 400 }}>
                            {t.term}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ ...ts, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>{t.type}</span>
                        </td>
                        <td style={{ padding: '10px 20px 10px 8px', textAlign: 'right', fontSize: 12, color: 'var(--ink-3)' }}>
                          {t.doc_count} doc{t.doc_count !== 1 ? 's' : ''}
                          {t.first_seen && t.last_seen && (
                            <span style={{ marginLeft: 6, fontSize: 11 }}>
                              {t.first_seen === t.last_seen ? t.first_seen : `${t.first_seen}–${t.last_seen}`}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', padding: '20px' }}>
          {selected ? (
            <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>
              {selected.term}
            </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <span style={{ ...(TYPE_STYLE[selected.type] || {}), padding: '2px 10px', borderRadius: 99, fontSize: 12 }}>
                  {selected.type}
                </span>
                {selected.first_seen && (
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {selected.first_seen === selected.last_seen
                      ? selected.first_seen
                      : `${selected.first_seen} – ${selected.last_seen}`}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 10 }}>
                {selected.doc_count} document{selected.doc_count !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(selected.doc_slugs || []).map(d => (
                  <button key={d.slug} onClick={() => navigate('/document/' + d.slug)}
                    style={{ padding: '10px 12px', border: '1px solid var(--rule)', borderRadius: 8,
                             background: '#fff', cursor: 'pointer', textAlign: 'left',
                             fontFamily: 'var(--font-sans)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 3 }}>{d.title}</div>
                    {d.year && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{d.year}</div>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--ink-3)', fontSize: 13.5, paddingTop: 20 }}>
              Select a term to see which documents use it.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
