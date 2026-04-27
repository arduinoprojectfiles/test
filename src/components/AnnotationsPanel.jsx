import { useState, useEffect, useRef } from 'react'

const COLORS = {
  yellow: { bg: '#fef9c3', border: '#fde047', label: 'Yellow' },
  green:  { bg: '#dcfce7', border: '#86efac', label: 'Green'  },
  blue:   { bg: '#dbeafe', border: '#93c5fd', label: 'Blue'   },
  pink:   { bg: '#fce7f3', border: '#f9a8d4', label: 'Pink'   },
  orange: { bg: '#ffedd5', border: '#fdba74', label: 'Orange' },
}

const TAG_SUGGESTIONS = [
  'important', 'method', 'finding', 'limitation', 'future work',
  'evidence', 'contradiction', 'definition', 'citation needed',
]

export default function AnnotationsPanel({ documentSlug }) {
  const [annotations, setAnnotations]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [form, setForm]                 = useState(defaultForm())
  const [filterTag, setFilterTag]       = useState('')
  const [allTags, setAllTags]           = useState([])

  useEffect(() => {
    fetchAnnotations()
  }, [documentSlug])

  async function fetchAnnotations() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/annotations/${documentSlug}`)
      const data = await res.json()
      const anns = data.annotations || []
      setAnnotations(anns)
      // Collect all unique tags
      const tags = [...new Set(anns.flatMap(a => a.tags || []))]
      setAllTags(tags)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function saveAnnotation() {
    if (!form.highlighted_text.trim()) return
    try {
      if (editingId) {
        await fetch(`/api/annotations/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: form.note, tags: form.tags, color: form.color }),
        })
      } else {
        await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, document_slug: documentSlug }),
        })
      }
      setShowForm(false)
      setEditingId(null)
      setForm(defaultForm())
      fetchAnnotations()
    } catch (e) { console.error(e) }
  }

  async function deleteAnnotation(id) {
    if (!confirm('Delete this annotation?')) return
    await fetch(`/api/annotations/${id}`, { method: 'DELETE' })
    fetchAnnotations()
  }

  function startEdit(ann) {
    setForm({
      highlighted_text: ann.highlighted_text,
      note:  ann.note  || '',
      tags:  ann.tags  || [],
      color: ann.color || 'yellow',
      page:  ann.page  || '',
    })
    setEditingId(ann.id)
    setShowForm(true)
  }

  function toggleTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
  }

  const filtered = filterTag
    ? annotations.filter(a => (a.tags || []).includes(filterTag))
    : annotations

  return (
    <div style={{ padding: '24px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} on this document
          </div>
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilterTag('')}
                style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, border: 'none',
                         cursor: 'pointer', fontFamily: 'var(--font-sans)',
                         background: !filterTag ? 'var(--accent)' : 'var(--paper-3)',
                         color:      !filterTag ? '#fff' : 'var(--ink-3)' }}>
                All
              </button>
              {allTags.map(t => (
                <button key={t}
                  onClick={() => setFilterTag(t === filterTag ? '' : t)}
                  style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, border: 'none',
                           cursor: 'pointer', fontFamily: 'var(--font-sans)',
                           background: filterTag === t ? 'var(--accent)' : 'var(--paper-3)',
                           color:      filterTag === t ? '#fff' : 'var(--ink-3)' }}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultForm()) }}>
          + Add annotation
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid var(--rule)', borderRadius: 12,
                      padding: '20px 24px', marginBottom: 24, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 16, color: 'var(--ink)' }}>
            {editingId ? 'Edit annotation' : 'New annotation'}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
              Highlighted passage *
            </label>
            <textarea
              value={form.highlighted_text}
              onChange={e => setForm(f => ({ ...f, highlighted_text: e.target.value }))}
              placeholder="Paste or type the passage you want to highlight…"
              rows={3}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                       border: '1px solid var(--rule)', fontFamily: 'var(--font-sans)',
                       fontSize: 13.5, resize: 'vertical', outline: 'none',
                       background: form.color ? COLORS[form.color]?.bg : '#fffbeb' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
              Your note
            </label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Add a note, comment, or cross-reference…"
              rows={2}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                       border: '1px solid var(--rule)', fontFamily: 'var(--font-sans)',
                       fontSize: 13.5, resize: 'vertical', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(COLORS).map(([key, val]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, color: key }))}
                    title={val.label}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid',
                             borderColor: form.color === key ? '#374151' : val.border,
                             background: val.bg, cursor: 'pointer',
                             outline: form.color === key ? '2px solid var(--accent)' : 'none',
                             outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>Page (optional)</label>
              <input type="number" value={form.page} min={1}
                onChange={e => setForm(f => ({ ...f, page: e.target.value }))}
                style={{ width: 70, padding: '5px 8px', borderRadius: 6,
                         border: '1px solid var(--rule)', fontFamily: 'var(--font-sans)', fontSize: 13 }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>Tags</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TAG_SUGGESTIONS.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11.5, border: 'none',
                           cursor: 'pointer', fontFamily: 'var(--font-sans)',
                           background: form.tags.includes(t) ? 'var(--accent)' : 'var(--paper-3)',
                           color: form.tags.includes(t) ? '#fff' : 'var(--ink-3)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={saveAnnotation}>
              {editingId ? 'Save changes' : 'Save annotation'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Annotation list */}
      {loading ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--ink-3)', padding: '32px 0' }}>
          <div className="spinner" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📝</div>
          <div style={{ fontSize: 14 }}>
            {annotations.length === 0
              ? 'No annotations yet. Click "Add annotation" to highlight a passage.'
              : 'No annotations match the selected tag.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(ann => {
            const col = COLORS[ann.color] || COLORS.yellow
            return (
              <div key={ann.id} style={{ background: col.bg, border: `1px solid ${col.border}`,
                                         borderRadius: 10, padding: '14px 18px' }}>
                {ann.page && (
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginBottom: 4,
                                fontFamily: 'var(--font-mono)' }}>
                    Page {ann.page}
                  </div>
                )}
                <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)',
                              lineHeight: 1.6, marginBottom: ann.note ? 10 : 0,
                              borderLeft: `3px solid ${col.border}`, paddingLeft: 10 }}>
                  "{ann.highlighted_text}"
                </div>
                {ann.note && (
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.6,
                                marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.6)',
                                borderRadius: 6 }}>
                    {ann.note}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {(ann.tags || []).map(t => (
                      <span key={t} style={{ background: 'rgba(0,0,0,0.08)', color: 'var(--ink-2)',
                                             padding: '1px 7px', borderRadius: 99, fontSize: 11 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {ann.author} · {ann.created_at?.slice(0, 10)}
                    </span>
                    <button onClick={() => startEdit(ann)}
                      style={{ fontSize: 11.5, padding: '2px 9px', border: '1px solid rgba(0,0,0,0.1)',
                               borderRadius: 6, background: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                               fontFamily: 'var(--font-sans)' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteAnnotation(ann.id)}
                      style={{ fontSize: 11.5, padding: '2px 9px', border: '1px solid #fca5a5',
                               borderRadius: 6, background: '#fef2f2', color: '#991b1b',
                               cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function defaultForm() {
  return { highlighted_text: '', note: '', tags: [], color: 'yellow', page: '' }
}
