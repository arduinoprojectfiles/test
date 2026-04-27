import { useState, useRef, useCallback } from 'react'
import { api } from '../api.js'

const ACCEPTED = '.pdf,.docx,.doc,.txt,.md,.html,.htm'

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [queue, setQueue] = useState([])      // { file, status, slug, error }
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const updateItem = useCallback((index, patch) => {
    setQueue(q => q.map((item, i) => i === index ? { ...item, ...patch } : item))
  }, [])

  function addFiles(files) {
    const items = Array.from(files).map(f => ({ file: f, status: 'queued', slug: null, error: null }))
    setQueue(q => [...q, ...items])
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  async function startUpload() {
    const queued = queue.filter(i => i.status === 'queued')
    if (!queued.length) return
    setUploading(true)

    // Upload in batches of 5
    for (let i = 0; i < queue.length; i += 5) {
      const batch = queue.slice(i, i + 5).filter(item => item.status === 'queued')
      if (!batch.length) continue

      const batchIndices = batch.map(b => queue.indexOf(b))
      batchIndices.forEach(idx => updateItem(idx, { status: 'uploading' }))

      try {
        const result = await api.uploadFiles(batch.map(b => b.file))
        result.results.forEach((r, j) => {
          const idx = batchIndices[j]
          if (r.status === 'queued') {
            updateItem(idx, { status: 'processing', slug: r.slug })
            // Poll for completion
            pollStatus(idx, r.slug)
          } else {
            updateItem(idx, { status: 'error', error: r.reason })
          }
        })
      } catch (err) {
        batchIndices.forEach(idx => updateItem(idx, { status: 'error', error: err.message }))
      }
    }

    setUploading(false)
  }

  async function pollStatus(itemIndex, slug) {
    const maxTries = 60  // up to 5 minutes
    for (let i = 0; i < maxTries; i++) {
      await sleep(5000)
      try {
        const { status, error_msg } = await api.getDocumentStatus(slug)
        if (status === 'ready') {
          updateItem(itemIndex, { status: 'done' })
          return
        }
        if (status === 'error') {
          updateItem(itemIndex, { status: 'error', error: error_msg })
          return
        }
        updateItem(itemIndex, { status: 'processing' })
      } catch (_) {}
    }
    updateItem(itemIndex, { status: 'error', error: 'Timed out waiting for processing.' })
  }

  function clearDone() {
    setQueue(q => q.filter(i => i.status !== 'done'))
  }

  const hasQueued = queue.some(i => i.status === 'queued')
  const hasAny = queue.length > 0

  return (
    <div>
      <div className="page-header">
        <h2>Upload documents</h2>
        <p>PDF, DOCX, TXT, Markdown, HTML — all processed locally</p>
      </div>

      <div className="page-body" style={{ maxWidth: 760 }}>
        <div
          className={'drop-zone' + (dragging ? ' drag-over' : '')}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="drop-zone-icon">📄</div>
          <h3>Drop files here to upload</h3>
          <p>or click to browse · PDF, DOCX, TXT, MD, HTML · up to 100 MB each</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
          />
        </div>

        {hasAny && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{queue.length} file{queue.length !== 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {queue.some(i => i.status === 'done') && (
                  <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={clearDone}>
                    Clear done
                  </button>
                )}
                {hasQueued && (
                  <button className="btn btn-primary" disabled={uploading} onClick={startUpload}>
                    {uploading ? 'Uploading…' : `Upload ${queue.filter(i => i.status === 'queued').length} file(s)`}
                  </button>
                )}
              </div>
            </div>

            <div className="upload-list">
              {queue.map((item, i) => (
                <UploadItem key={i} item={item} />
              ))}
            </div>
          </div>
        )}

        <div className="divider" />

        <div style={{ background: 'var(--paper-2)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', border: '1px solid var(--rule)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: 'var(--ink-2)' }}>What happens when you upload</h4>
          <ol style={{ paddingLeft: 18, fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 2.1, listStyleType: 'decimal' }}>
            <li><strong style={{ color: 'var(--ink-2)' }}>Parse</strong> — text and metadata are extracted from your file</li>
            <li><strong style={{ color: 'var(--ink-2)' }}>Chunk</strong> — split at section boundaries (not fixed character windows)</li>
            <li><strong style={{ color: 'var(--ink-2)' }}>Embed</strong> — each chunk is encoded as a local vector using sentence-transformers</li>
            <li><strong style={{ color: 'var(--ink-2)' }}>Index</strong> — vectors stored in ChromaDB, text in BM25 index, metadata in SQLite</li>
            <li><strong style={{ color: 'var(--ink-2)' }}>Search</strong> — immediately available via hybrid search</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

function UploadItem({ item }) {
  const status = item.status
  const icon = {
    queued: '⏳',
    uploading: '⬆',
    processing: '⚙',
    done: '✓',
    error: '✕',
  }[status] || '?'

  const color = {
    queued: 'var(--ink-3)',
    uploading: 'var(--accent)',
    processing: 'var(--accent)',
    done: 'var(--green)',
    error: 'var(--red)',
  }[status]

  return (
    <div className="upload-item">
      <span style={{ color, fontSize: 15, fontWeight: 600, width: 20, textAlign: 'center', flexShrink: 0 }}>
        {status === 'processing' || status === 'uploading'
          ? <span className="spinner" />
          : icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="upload-item-name">{item.file.name}</div>
        {status === 'error' && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 2 }}>{item.error}</div>
        )}
        {status === 'processing' && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Extracting text, embedding chunks…</div>
        )}
        {status === 'done' && (
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 2 }}>Indexed and ready to search</div>
        )}
      </div>
      <span style={{ fontSize: 11.5, color: 'var(--ink-3)', flexShrink: 0 }}>
        {(item.file.size / 1024).toFixed(0)} KB
      </span>
    </div>
  )
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
