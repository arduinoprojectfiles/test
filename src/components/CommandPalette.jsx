import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CommandPalette({ open, onClose, documents = [], pages = [] }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const commands = [
    { type: 'page', label: 'Search', desc: 'Find documents and passages', action: () => navigate('/search'), icon: '🔍' },
    { type: 'page', label: 'Library', desc: 'View all documents', action: () => navigate('/library'), icon: '📚' },
    { type: 'page', label: 'Graph', desc: 'Knowledge graph visualization', action: () => navigate('/graph'), icon: '🕸️' },
    { type: 'page', label: 'Timeline', desc: 'Publication timeline', action: () => navigate('/timeline'), icon: '📈' },
    { type: 'page', label: 'Glossary', desc: 'Concept glossary', action: () => navigate('/glossary'), icon: '📖' },
    { type: 'page', label: 'PRISMA Review', desc: 'Systematic review', action: () => navigate('/review'), icon: '✓' },
    { type: 'page', label: 'Export', desc: 'Export references', action: () => navigate('/export'), icon: '↓' },
  ]

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    setQuery('')
    setSelected(0)
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults(commands)
      return
    }

    const q = query.toLowerCase()
    const filtered = [
      ...commands.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)),
      ...documents.filter(d => d.title.toLowerCase().includes(q)).slice(0, 5).map(d => ({
        type: 'document',
        label: d.title,
        desc: `${d.year || ''} · ${d.authors?.[0] || 'Unknown'}`,
        action: () => navigate(`/document/${d.slug}`),
      })),
    ]
    setResults(filtered)
    setSelected(0)
  }, [query, documents, navigate])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => (s + 1) % results.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => (s - 1 + results.length) % results.length)
      }
      if (e.key === 'Enter' && results[selected]) {
        results[selected].action?.()
        onClose()
      }
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, results, selected, onClose])

  if (!open) return null

  return (
    <div className="command-palette-modal" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          className="command-input"
          placeholder="Search documents, pages, actions..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="command-results">
          {results.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--ink-3)' }}>
              No results found
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={idx}
                className={`command-item ${idx === selected ? 'active' : ''}`}
                onClick={() => {
                  item.action?.()
                  onClose()
                }}
                onMouseEnter={() => setSelected(idx)}>
                <div className="command-item-title">{item.label}</div>
                <div className="command-item-desc">{item.desc}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
