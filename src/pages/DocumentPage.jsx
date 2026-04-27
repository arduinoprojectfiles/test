import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import AnnotationsPanel from '../components/AnnotationsPanel.jsx'

export default function DocumentPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc]           = useState(null)
  const [chunks, setChunks]     = useState(null)
  const [connections, setConns] = useState(null)
  const [tab, setTab]           = useState('overview')
  const [loading, setLoading]   = useState(true)
  const [chunksPage, setChunksPage] = useState(0)
  const [annCount, setAnnCount] = useState(0)
  const [annotations, setAnnotations] = useState([])
  const [selectedAnnotation, setSelectedAnnotation] = useState(null)
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false)
  const PER_PAGE = 10

  useEffect(() => {
    setLoading(true)
    setTab('overview')
    Promise.all([
      api.getDocument(slug),
      api.getDocumentChunks(slug, { limit: PER_PAGE, offset: 0 }),
      api.getDocumentConnections(slug),
      fetch(`/api/annotations/${slug}`).then(r => r.json()),
    ]).then(([d, c, conn, annData]) => {
      setDoc(d)
      setChunks(c)
      setConns(conn)
      setAnnotations(annData.annotations || [])
      setAnnCount((annData.annotations || []).length)
    }).catch(console.error).finally(() => setLoading(false))
  }, [slug])

  async function loadMoreChunks() {
    const offset = (chunksPage + 1) * PER_PAGE
    const data   = await api.getDocumentChunks(slug, { limit: PER_PAGE, offset })
    setChunks(prev => ({ ...prev, chunks: [...(prev?.chunks || []), ...data.chunks] }))
    setChunksPage(p => p + 1)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
  if (!doc) return <div className="page-body"><p style={{ color: 'var(--ink-3)' }}>Document not found.</p></div>

  const shownChunks  = (chunks?.chunks || []).length
  const totalChunks  = chunks?.total || doc.chunk_count || 0
  const connList     = connections?.connections || []
  const isPDF        = doc.file_type === 'pdf'
  const isText       = ['txt', 'md'].includes(doc.file_type)

  const TABS = [
    { key: 'overview',     label: 'Overview' },
    ...(isPDF || isText ? [{ key: 'viewer', label: isPDF ? 'PDF Viewer' : 'Viewer' }] : []),
    { key: 'annotations',  label: `Annotations (${annCount})` },
    { key: 'chunks',       label: `Chunks (${totalChunks})` },
    { key: 'connections',  label: `Connections (${connList.length})` },
  ]

  return (
    <div>
      <div className="detail-header">
        <button className="back-link" onClick={() => navigate(-1)}>← Back</button>
        <div className="detail-title">{doc.title}</div>
        <div className="detail-meta-row">
          {doc.authors?.length > 0 && <span>{doc.authors.join(', ')}</span>}
          {doc.year    && <span>{doc.year}</span>}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{(doc.file_type || '').toUpperCase()}</span>
          <span>{(doc.word_count || 0).toLocaleString()} words</span>
          <span>{doc.chunk_count} chunks</span>
          <span className={'badge badge-' + doc.status}>{doc.status}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--rule)', padding: '0 48px' }}>
        <div style={{ display: 'flex' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '12px 20px', border: 'none', background: 'none',
              fontSize: 13.5, fontFamily: 'var(--font-sans)', cursor: 'pointer',
              color: tab === t.key ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: tab === t.key ? 500 : 400, transition: 'all 0.12s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      {tab === 'overview' && (
        <div className="page-body">
          <div className="detail-body" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
            <div>
              {doc.abstract
                ? <div className="detail-abstract"><h4>Abstract / Summary</h4>{doc.abstract}</div>
                : <div style={{ color: 'var(--ink-3)', fontSize: 14, padding: '20px 0' }}>No abstract extracted.</div>
              }
              {connList.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                                color: 'var(--ink-3)', marginBottom: 10 }}>Connected documents</div>
                  {connList.slice(0, 3).map(c => (
                    <button key={c.slug} onClick={() => navigate('/document/' + c.slug)}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--rule)',
                               borderRadius: 8, background: '#fff', cursor: 'pointer', textAlign: 'left',
                               marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12,
                               fontFamily: 'var(--font-sans)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                    background: c.type === 'semantic' ? 'var(--accent)' : '#059669' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden',
                                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{c.reasons}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {(c.weight || 0).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="detail-sidebar">
              {doc.keywords?.length > 0 && (
                <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: 'var(--ink-3)', marginBottom: 10 }}>Keywords</h4>
                  <div className="tag-list">{doc.keywords.map(k => <span key={k} className="tag">{k}</span>)}</div>
                </div>
              )}
              {doc.methods?.length > 0 && (
                <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: 'var(--ink-3)', marginBottom: 10 }}>Methods</h4>
                  <div className="tag-list">
                    {doc.methods.map(m => (
                      <span key={m} className="tag" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="card" style={{ padding: '16px 18px' }}>
                <h4 style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em',
                              color: 'var(--ink-3)', marginBottom: 10 }}>File info</h4>
                <table style={{ fontSize: 12.5, width: '100%' }}>
                  <tbody>
                    <tr><td style={{ color: 'var(--ink-3)', paddingBottom: 5 }}>File</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{doc.filename}</td></tr>
                    <tr><td style={{ color: 'var(--ink-3)', paddingBottom: 5 }}>Size</td>
                        <td style={{ textAlign: 'right' }}>{((doc.file_size || 0) / 1024).toFixed(1)} KB</td></tr>
                    <tr><td style={{ color: 'var(--ink-3)', paddingBottom: 5 }}>Words</td>
                        <td style={{ textAlign: 'right' }}>{(doc.word_count || 0).toLocaleString()}</td></tr>
                    <tr><td style={{ color: 'var(--ink-3)' }}>Indexed</td>
                        <td style={{ textAlign: 'right' }}>{(doc.created_at || '').slice(0, 10)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF / text viewer with annotation panel */}
      {tab === 'viewer' && (
        <div style={{ display: 'flex', height: 'calc(100vh - 200px)', position: 'relative' }}>
          {isPDF ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 24px', background: 'var(--paper-2)',
                            borderBottom: '1px solid var(--rule)', fontSize: 12.5, color: 'var(--ink-3)' }}>
                Highlight text to annotate · Annotations appear in the panel on the right
              </div>
              <iframe src={`/api/documents/${slug}/file#toolbar=1&view=FitH`}
                style={{ flex: 1, border: 'none', width: '100%' }} title={doc.title} />
            </div>
          ) : (
            <PlainTextViewer url={`/api/documents/${slug}/file`} />
          )}
          
          <div className={`annotation-panel ${showAnnotationPanel ? 'open' : ''}`}>
            <div className="annotation-panel-header">
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14 }}>Notes</div>
              <button onClick={() => setShowAnnotationPanel(false)} style={{ 
                border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-3)' 
              }}>×</button>
            </div>
            <div className="annotation-panel-content">
              {annotations.length === 0 ? (
                <div style={{ color: 'var(--ink-3)', fontSize: 12, textAlign: 'center', paddingTop: 24 }}>
                  Highlight text in the document to create annotations
                </div>
              ) : (
                annotations.map((ann, i) => (
                  <div key={i} className="annotation-item">
                    <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginBottom: 6 }}>
                      p. {ann.page || '?'}
                    </div>
                    <div style={{ fontStyle: 'italic', marginBottom: 6, color: 'var(--ink)' }}>
                      "{ann.text || ann.highlight}"
                    </div>
                    {ann.note && <div>{ann.note}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Annotations */}
      {tab === 'annotations' && <AnnotationsPanel documentSlug={slug} />}

      {/* Chunks */}
      {tab === 'chunks' && (
        <div className="page-body">
          <div className="chunk-list">
            {(chunks?.chunks || []).map(c => (
              <div key={c.id} className="chunk-item">
                <div className="chunk-meta">§{c.position + 1} · {c.section} · {c.word_count} words</div>
                <div className="chunk-text">{c.text}</div>
              </div>
            ))}
          </div>
          {shownChunks < totalChunks && (
            <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={loadMoreChunks}>
              Load more ({shownChunks}/{totalChunks})
            </button>
          )}
        </div>
      )}

      {/* Connections */}
      {tab === 'connections' && (
        <div className="page-body">
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
            Edges built automatically from shared keywords, authors, methods, and semantic similarity.
          </p>
          {connList.length === 0 ? (
            <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>No connections yet. Upload more documents to build the graph.</p>
          ) : (
            <div className="result-list">
              {connList.map(c => (
                <button key={c.slug} className="result-card" onClick={() => navigate('/document/' + c.slug)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                                  background: c.type === 'semantic' ? 'var(--accent)' : '#059669' }} />
                    <div style={{ flex: 1 }}>
                      <div className="result-title" style={{ fontSize: 16 }}>{c.title}</div>
                      <div className="result-meta">
                        {c.authors?.length > 0 && <span>{c.authors.slice(0, 2).join(', ')}</span>}
                        {c.year && <span>{c.year}</span>}
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          strength {(c.weight || 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>{c.reasons}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlainTextViewer({ url }) {
  const [text, setText] = useState(null)
  useEffect(() => {
    fetch(url).then(r => r.text()).then(setText).catch(() => setText('Could not load file.'))
  }, [url])
  if (!text) return (
    <div style={{ padding: 32, display: 'flex', gap: 10, color: 'var(--ink-3)' }}>
      <div className="spinner" /> Loading…
    </div>
  )
  return (
    <div style={{ padding: '24px 48px' }}>
      <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8,
                    color: 'var(--ink-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: '#fff', border: '1px solid var(--rule)', borderRadius: 10,
                    padding: '24px 28px', maxWidth: 860 }}>
        {text}
      </pre>
    </div>
  )
}
