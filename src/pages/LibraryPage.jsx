import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function LibraryPage() {
  const [data, setData]         = useState(null)
  const [stats, setStats]       = useState(null)
  const [filter, setFilter]     = useState('')
  const [statusF, setStatusF]   = useState('all')
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  const fetchDocs = useCallback(async () => {
    try {
      const params = { limit: 100 }
      if (statusF !== 'all') params.status = statusF
      const [docsData, statsData] = await Promise.all([api.listDocuments(params), api.getStats()])
      setData(docsData)
      setStats(statsData)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [statusF])

  useEffect(() => { fetchDocs(); const t = setInterval(fetchDocs, 5000); return () => clearInterval(t) }, [fetchDocs])

  const filtered = (data?.documents || []).filter(d =>
    !filter || d.title.toLowerCase().includes(filter.toLowerCase()) ||
    d.filename.toLowerCase().includes(filter.toLowerCase())
  )

  async function handleDelete(e, slug) {
    e.stopPropagation()
    if (!confirm('Delete this document and its index entries?')) return
    await api.deleteDocument(slug)
    fetchDocs()
  }

  const dupBadge = (doc) => {
    if (!doc.dup_status) return null
    const styles = {
      duplicate:          { background: '#fef2f2', color: '#991b1b', label: '⚠ Duplicate' },
      possible_duplicate: { background: '#fef3c7', color: '#92400e', label: '~ Similar' },
      version:            { background: '#eff6ff', color: '#1d4ed8', label: '↑ Version' },
    }
    const s = styles[doc.dup_status] || styles.possible_duplicate
    return <span style={{ ...s, fontSize: 10.5, padding: '1px 7px', borderRadius: 99, fontWeight: 500 }}>{s.label}</span>
  }

  return (
    <div>
      <div className="page-header">
        <h2>Library</h2>
        <p>All ingested documents — click any to explore its content and chunks</p>
      </div>
      <div className="page-body">
        {stats && (
          <div className="stat-row">
            {[
              { label: 'Total', value: stats.total_documents, sub: 'documents' },
              { label: 'Indexed', value: stats.ready, sub: 'ready to search' },
              { label: 'Vectors', value: stats.vector_count.toLocaleString(), sub: 'in ChromaDB' },
              { label: 'Processing', value: stats.processing + stats.pending, sub: 'in queue' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <input type="text" className="search-input"
            style={{ maxWidth: 360, padding: '9px 14px' }}
            placeholder="Filter by title, filename…"
            value={filter} onChange={e => setFilter(e.target.value)} />
          <div className="mode-tabs" style={{ marginTop: 0 }}>
            {['all', 'ready', 'processing', 'error'].map(s => (
              <button key={s} className={'mode-tab' + (statusF === s ? ' active' : '')} onClick={() => setStatusF(s)}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No documents yet</h3>
            <p>Upload some papers, reports, or notes to get started.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/upload')}>Upload documents</button>
          </div>
        ) : (
          <div className="doc-grid">
            {filtered.map(doc => (
              <div key={doc.slug} className="doc-card" onClick={() => navigate('/document/' + doc.slug)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.35, flex: 1 }}>{doc.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                    <span className={'badge badge-' + doc.status}>
                      {doc.status === 'processing' && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
                      {doc.status}
                    </span>
                    {dupBadge(doc)}
                  </div>
                </div>
                {doc.authors && doc.authors.length > 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 6 }}>
                    {doc.authors.slice(0, 3).join(', ')}{doc.authors.length > 3 ? ' et al.' : ''}{doc.year ? ' · ' + doc.year : ''}
                  </div>
                )}
                {doc.abstract && (
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55, marginBottom: 10,
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc.abstract}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(doc.keywords || []).slice(0, 3).map(k => <span key={k} className="tag">{k}</span>)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{doc.chunk_count} chunks</span>
                    <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: 12 }}
                      onClick={e => handleDelete(e, doc.slug)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
