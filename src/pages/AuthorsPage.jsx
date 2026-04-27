import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const NODE_R = 14

export default function AuthorsPage() {
  const canvasRef   = useRef(null)
  const nodesRef    = useRef([])
  const animRef     = useRef(null)
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [tooltip, setTooltip]   = useState(null)
  const [filter, setFilter]     = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/authors')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data || !canvasRef.current) return
    const canvas = canvasRef.current
    const W = canvas.offsetWidth || 860
    const H = canvas.offsetHeight || 560
    canvas.width  = W
    canvas.height = H

    const filteredIds = filter
      ? new Set(data.nodes.filter(n => n.id.toLowerCase().includes(filter.toLowerCase())).map(n => n.id))
      : null

    const nodes = data.nodes.map(n => ({
      ...n,
      x:  W / 2 + (Math.random() - 0.5) * W * 0.5,
      y:  H / 2 + (Math.random() - 0.5) * H * 0.5,
      vx: 0, vy: 0,
      r:  Math.max(NODE_R, Math.min(NODE_R + n.papers * 2, 28)),
      visible: !filteredIds || filteredIds.has(n.id),
    }))
    nodesRef.current = nodes

    const edges = data.edges.filter(e => {
      if (!filteredIds) return true
      return filteredIds.has(e.source) || filteredIds.has(e.target)
    })

    let frame = 0

    function tick() {
      const alpha = 0.06
      const k     = Math.sqrt((W * H) / Math.max(nodes.length, 1)) * 0.9

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[j].x - nodes[i].x || 0.1
          const dy   = nodes[j].y - nodes[i].y || 0.1
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (k * k) / dist * alpha
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          nodes[i].vx -= fx; nodes[i].vy -= fy
          nodes[j].vx += fx; nodes[j].vy += fy
        }
      }

      for (const edge of edges) {
        const a = nodes.find(n => n.id === edge.source)
        const b = nodes.find(n => n.id === edge.target)
        if (!a || !b) continue
        const dx   = b.x - a.x
        const dy   = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const ideal = 100 + (1 / edge.weight) * 40
        const force = (dist - ideal) / dist * alpha * 0.8
        a.vx += dx * force; a.vy += dy * force
        b.vx -= dx * force; b.vy -= dy * force
      }

      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.002
        n.vy += (H / 2 - n.y) * 0.002
        n.vx *= 0.85; n.vy *= 0.85
        n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x + n.vx))
        n.y = Math.max(n.r + 4, Math.min(H - n.r - 4, n.y + n.vy))
      }
    }

    function draw() {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      for (const edge of edges) {
        const a = nodes.find(n => n.id === edge.source)
        const b = nodes.find(n => n.id === edge.target)
        if (!a || !b) continue
        const isSel = selected && (edge.source === selected || edge.target === selected)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = isSel ? '#2d5be3' : '#d1d5db'
        ctx.lineWidth   = isSel ? Math.min(edge.weight * 2, 5) : Math.min(edge.weight, 2)
        ctx.globalAlpha = isSel ? 0.9 : 0.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      for (const node of nodes) {
        if (!node.visible) continue
        const isSel    = selected === node.id
        const isBridge = node.is_bridge

        if (isSel) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.r + 7, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(45,91,227,0.12)'
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = isSel ? '#2d5be3'
                      : isBridge ? '#d97706'
                      : node.degree === 0 ? '#94a3b8'
                      : '#6366f1'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth   = isSel ? 2.5 : 1.5
        ctx.stroke()

        if (isBridge) {
          // Bridge indicator ring
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.r + 3, 0, Math.PI * 2)
          ctx.strokeStyle = '#f59e0b'
          ctx.lineWidth   = 1.5
          ctx.setLineDash([3, 3])
          ctx.stroke()
          ctx.setLineDash([])
        }

        const label = node.id.length > 18 ? node.id.slice(0, 16) + '…' : node.id
        ctx.fillStyle   = 'var(--ink, #1a1916)'
        ctx.font        = isSel ? '500 10px DM Sans,sans-serif' : '400 9px DM Sans,sans-serif'
        ctx.textAlign   = 'center'
        ctx.fillText(label, node.x, node.y + node.r + 12)
      }
    }

    function loop() {
      if (frame < 250) tick()
      frame++
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [data, selected, filter])

  function handleClick(e) {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (const node of nodesRef.current) {
      const dx = node.x - mx
      const dy = node.y - my
      if (Math.sqrt(dx * dx + dy * dy) < node.r + 4) {
        setSelected(s => s === node.id ? null : node.id)
        return
      }
    }
    setSelected(null)
  }

  function handleMove(e) {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (const node of nodesRef.current) {
      const dx = node.x - mx
      const dy = node.y - my
      if (Math.sqrt(dx * dx + dy * dy) < node.r + 4) {
        canvas.style.cursor = 'pointer'
        setTooltip({ x: e.clientX, y: e.clientY, node })
        return
      }
    }
    canvas.style.cursor = 'default'
    setTooltip(null)
  }

  const selNode    = data?.nodes.find(n => n.id === selected)
  const selEdges   = selected ? (data?.edges || []).filter(e => e.source === selected || e.target === selected) : []
  const stats      = data?.stats || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h2>Author collaboration network</h2>
        <p>Co-authorship graph built from your corpus — amber rings mark bridge authors who connect separate clusters</p>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Canvas area */}
        <div style={{ flex: 1, position: 'relative', background: 'var(--paper)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: '100%', gap: 12, color: 'var(--ink-3)' }}>
              <div className="spinner" style={{ width: 24, height: 24 }} /> Building network…
            </div>
          ) : !data || data.nodes.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 100 }}>
              <h3>No author data yet</h3>
              <p>Upload documents with author metadata to build the network.</p>
            </div>
          ) : (
            <canvas ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
              onClick={handleClick}
              onMouseMove={handleMove}
              onMouseLeave={() => setTooltip(null)} />
          )}

          {/* Legend + stats */}
          {data?.nodes.length > 0 && (
            <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#fff',
                          border: '1px solid var(--rule)', borderRadius: 8, padding: '10px 14px',
                          fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                Collaborator
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                Bridge author
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
                Solo author
              </span>
              <span style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 14 }}>
                {stats.total_authors} authors · {stats.total_edges} connections
              </span>
            </div>
          )}

          {/* Search filter */}
          {data?.nodes.length > 0 && (
            <div style={{ position: 'absolute', top: 14, left: 14 }}>
              <input type="text" placeholder="Filter authors…" value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--rule)',
                         fontFamily: 'var(--font-sans)', fontSize: 13, background: '#fff',
                         color: 'var(--ink)', outline: 'none', width: 200,
                         boxShadow: 'var(--shadow)' }} />
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: 280, borderLeft: '1px solid var(--rule)', background: '#fff',
                      overflowY: 'auto', flexShrink: 0, padding: '20px' }}>
          {!selNode ? (
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                            color: 'var(--ink-3)', marginBottom: 14 }}>Corpus stats</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Total authors',    stats.total_authors],
                  ['With co-authors',  stats.connected_authors],
                  ['Solo authors',     stats.solo_authors],
                  ['Bridge authors',   stats.bridge_authors],
                  ['Connections',      stats.total_edges],
                  ['Max collaborators',stats.max_collaborators],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                                            fontSize: 13, borderBottom: '1px solid var(--rule-2)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--ink-3)' }}>{label}</span>
                    <strong style={{ color: 'var(--ink)' }}>{val ?? '—'}</strong>
                  </div>
                ))}
              </div>

              {stats.top_bridges?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                                color: 'var(--ink-3)', marginBottom: 10 }}>Top bridge authors</div>
                  {stats.top_bridges.map(b => (
                    <div key={b.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--rule-2)',
                                             fontSize: 13, cursor: 'pointer' }}
                      onClick={() => setSelected(b.id)}>
                      <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{b.id}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        {b.papers} papers · {b.degree} collaborators
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                Click any node to see their papers and collaborators.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 6,
                            lineHeight: 1.3, color: 'var(--ink)' }}>{selNode.id}</div>
              {selNode.is_bridge && (
                <span style={{ background: '#fef3c7', color: '#92400e',
                               padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                               display: 'inline-block', marginBottom: 12 }}>
                  Bridge author
                </span>
              )}
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
                <span><strong style={{ color: 'var(--ink)' }}>{selNode.papers}</strong> papers</span>
                <span><strong style={{ color: 'var(--ink)' }}>{selNode.degree}</strong> collaborators</span>
                {selNode.year_min && <span>{selNode.year_min}{selNode.year_max !== selNode.year_min ? `–${selNode.year_max}` : ''}</span>}
              </div>

              {selNode.doc_refs?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                                color: 'var(--ink-3)', marginBottom: 8 }}>Papers in corpus</div>
                  {selNode.doc_refs.map(d => (
                    <button key={d.slug} onClick={() => navigate('/document/' + d.slug)}
                      style={{ width: '100%', padding: '8px 10px', marginBottom: 6, border: '1px solid var(--rule)',
                               borderRadius: 7, background: '#fff', cursor: 'pointer', textAlign: 'left',
                               fontFamily: 'var(--font-sans)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3, color: 'var(--ink)' }}>{d.title}</div>
                      {d.year && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{d.year}</div>}
                    </button>
                  ))}
                </div>
              )}

              {selEdges.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                                color: 'var(--ink-3)', marginBottom: 8 }}>
                    {selEdges.length} collaborator{selEdges.length !== 1 ? 's' : ''}
                  </div>
                  {selEdges.map((e, i) => {
                    const other = e.source === selNode.id ? e.target : e.source
                    return (
                      <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid var(--rule-2)',
                                            fontSize: 12.5, display: 'flex', justifyContent: 'space-between',
                                            cursor: 'pointer', color: 'var(--ink)' }}
                        onClick={() => setSelected(other)}>
                        <span>{other}</span>
                        <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          {e.weight}×
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 8,
                      background: '#1a1916', color: '#fff', fontSize: 12,
                      padding: '5px 10px', borderRadius: 6, pointerEvents: 'none',
                      zIndex: 1000, maxWidth: 220 }}>
          <div style={{ fontWeight: 500 }}>{tooltip.node.id}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
            {tooltip.node.papers} paper{tooltip.node.papers !== 1 ? 's' : ''} · {tooltip.node.degree} collaborator{tooltip.node.degree !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
