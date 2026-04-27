import { useState, useEffect } from 'react'
import { api } from '../api.js'

export default function ExportPage() {
  const [docs, setDocs]       = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    api.listDocuments({ status: 'ready', limit: 200 })
      .then(d => { setDocs(d.documents || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggleDoc(slug) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  function selectAll()   { setSelected(new Set(docs.map(d => d.slug))) }
  function selectNone()  { setSelected(new Set()) }

  async function doExport(format) {
    setExporting(format)
    const slugParam = selected.size > 0 && selected.size < docs.length
      ? '?slugs=' + [...selected].join(',')
      : ''
    const url = `/api/export/${format}${slugParam}`
    try {
      const res = await fetch(url)
      const text = await res.text()
      const ext  = format === 'bibtex' ? 'bib' : 'ris'
      const blob = new Blob([text], { type: 'text/plain' })
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `references.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(null)
    }
  }

  const exportCount = selected.size === 0 ? docs.length : selected.size

  return (
    <div>
      <div className="page-header">
        <h2>Export references</h2>
        <p>Download your corpus as BibTeX (.bib) for LaTeX or RIS (.ris) for Zotero, Mendeley &amp; EndNote</p>
      </div>

      <div className="page-body">
        {/* Export buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', border: '1px solid var(--rule)', borderRadius: 12,
                        padding: '20px 24px', flex: 1, minWidth: 220, boxShadow: 'var(--shadow)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 4 }}>BibTeX</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 16, lineHeight: 1.6 }}>
              For LaTeX documents, Overleaf, and any tool that reads <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>.bib</code> files.
            </div>
            <button className="btn btn-primary" onClick={() => doExport('bibtex')} disabled={!!exporting}>
              {exporting === 'bibtex' ? 'Exporting…' : `↓ Export ${exportCount} as .bib`}
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--rule)', borderRadius: 12,
                        padding: '20px 24px', flex: 1, minWidth: 220, boxShadow: 'var(--shadow)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 4 }}>RIS</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 16, lineHeight: 1.6 }}>
              For Zotero, Mendeley, EndNote, and RefWorks.
              Import directly via <em>File → Import</em> in any reference manager.
            </div>
            <button className="btn btn-primary" onClick={() => doExport('ris')} disabled={!!exporting}>
              {exporting === 'ris' ? 'Exporting…' : `↓ Export ${exportCount} as .ris`}
            </button>
          </div>
        </div>

        {/* Selection controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {selected.size === 0
              ? `Exporting all ${docs.length} documents`
              : `${selected.size} of ${docs.length} selected`}
          </span>
          <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '4px 12px' }} onClick={selectAll}>
            Select all
          </button>
          {selected.size > 0 && (
            <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: '4px 12px' }} onClick={selectNone}>
              Clear
            </button>
          )}
        </div>

        {/* Document list */}
        {loading ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--ink-3)', padding: '32px 0' }}>
            <div className="spinner" /> Loading…
          </div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <h3>No documents ready</h3>
            <p>Upload and process documents first, then export here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {docs.map(doc => {
              const isSel = selected.has(doc.slug)
              return (
                <div key={doc.slug}
                  onClick={() => toggleDoc(doc.slug)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14,
                           padding: '12px 16px', background: isSel ? 'var(--accent-2)' : '#fff',
                           border: '1px solid ' + (isSel ? 'var(--accent)' : 'var(--rule)'),
                           borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s',
                           boxShadow: isSel ? '0 0 0 1px var(--accent)' : 'none' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--paper-2)' }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = '#fff' }}>

                  {/* Checkbox */}
                  <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                background: isSel ? 'var(--accent)' : '#fff',
                                border: '2px solid ' + (isSel ? 'var(--accent)' : 'var(--rule)'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSel && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14.5, color: 'var(--ink)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                      {doc.authors?.length > 0 && doc.authors.slice(0, 2).join(', ')}
                      {doc.year ? ` · ${doc.year}` : ''}
                      {doc.file_type ? ` · ${doc.file_type.toUpperCase()}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {(doc.keywords || []).slice(0, 2).map(k => (
                      <span key={k} className="tag" style={{ fontSize: 10.5 }}>{k}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
