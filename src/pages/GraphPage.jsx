import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

const NODE_RADIUS = 18
const COLORS = {
  semantic: '#2d5be3',
  metadata: '#059669',
  default: '#6366f1',
}
const EDGE_COLOR = { semantic: '#93c5fd', metadata: '#6ee7b7' }

export default function GraphPage() {
  const canvasRef = useRef(null)
  const [graph, setGraph] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const simRef = useRef(null)
  const animRef = useRef(null)
  const nodesRef = useRef([])
  const navigate = useNavigate()

  useEffect(() => {
    api.getGraph().then(data => {
      setGraph(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!graph || !canvasRef.current) return
    const canvas = canvasRef.current
    const W = canvas.offsetWidth || 900
    const H = canvas.offsetHeight || 600
    canvas.width = W
    canvas.height = H

    // Init node positions (random, then settle via force sim)
    const nodes = graph.nodes.map((n, i) => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * W * 0.6,
      y: H / 2 + (Math.random() - 0.5) * H * 0.6,
      vx: 0, vy: 0,
    }))
    nodesRef.current = nodes

    const edges = graph.edges

    function tick() {
      const k = Math.sqrt((W * H) / Math.max(nodes.length, 1)) * 0.8
      const alpha = 0.08

      // Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
          const force = (k * k) / dist
          const fx = (dx / dist) * force * alpha
          const fy = (dy / dist) * force * alpha
          nodes[i].vx -= fx; nodes[i].vy -= fy
          nodes[j].vx += fx; nodes[j].vy += fy
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        const a = nodes.find(n => n.id === edge.source)
        const b = nodes.find(n => n.id === edge.target)
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const ideal = 120 + (1 - edge.weight) * 80
        const force = (dist - ideal) / dist * alpha * edge.weight
        a.vx += dx * force; a.vy += dy * force
        b.vx -= dx * force; b.vy -= dy * force
      }

      // Gravity toward center
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.002
        n.vy += (H / 2 - n.y) * 0.002
      }

      // Apply velocity with damping, clamp to canvas
      for (const n of nodes) {
        n.vx *= 0.85; n.vy *= 0.85
        n.x = Math.max(NODE_RADIUS + 4, Math.min(W - NODE_RADIUS - 4, n.x + n.vx))
        n.y = Math.max(NODE_RADIUS + 4, Math.min(H - NODE_RADIUS - 4, n.y + n.vy))
      }
    }

    function draw() {
      const ctx = canvas.getContext('2d')
      
      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, W, H)
      gradient.addColorStop(0, '#faf9f6')
      gradient.addColorStop(0.5, '#f4f1ea')
      gradient.addColorStop(1, '#ede9e0')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, W, H)

      // Draw subtle grid or constellation backdrop
      ctx.strokeStyle = 'rgba(212, 212, 216, 0.05)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < W; i += 100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke()
      }
      for (let i = 0; i < H; i += 100) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke()
      }

      // Draw cluster blobs based on community detection
      const clusters = {}
      for (const node of nodes) {
        const cluster = node.cluster || 'default'
        if (!clusters[cluster]) clusters[cluster] = []
        clusters[cluster].push(node)
      }

      for (const [clusterId, clusterNodes] of Object.entries(clusters)) {
        if (clusterNodes.length < 3) continue
        const avgX = clusterNodes.reduce((sum, n) => sum + n.x, 0) / clusterNodes.length
        const avgY = clusterNodes.reduce((sum, n) => sum + n.y, 0) / clusterNodes.length
        const radius = Math.max(70, Math.sqrt(clusterNodes.length) * 30)

        ctx.beginPath()
        ctx.ellipse(avgX, avgY, radius, radius, 0, 0, Math.PI * 2)
        const clusterColors = ['rgba(45,91,227,0.06)', 'rgba(5,150,105,0.06)', 'rgba(79,70,229,0.06)']
        ctx.fillStyle = clusterColors[Object.keys(clusters).indexOf(clusterId) % 3]
        ctx.fill()
        
        ctx.strokeStyle = clusterColors[Object.keys(clusters).indexOf(clusterId) % 3].replace('0.06', '0.12')
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Draw edges
      for (const edge of edges) {
        const a = nodes.find(n => n.id === edge.source)
        const b = nodes.find(n => n.id === edge.target)
        if (!a || !b) continue
        const isSelected = selected && (edge.source === selected || edge.target === selected)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = isSelected
          ? (edge.type === 'semantic' ? '#2d5be3' : '#059669')
          : (edge.type === 'semantic' ? '#dbeafe' : '#d1fae5')
        ctx.lineWidth = isSelected ? 2 : Math.max(0.5, edge.weight * 2)
        ctx.globalAlpha = isSelected ? 0.9 : 0.35
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Draw nodes with glow effect for selected
      for (const node of nodes) {
        const isSelected = selected === node.id
        const isHovered = hoveredNode === node.id
        const hasEdge = edges.some(e => e.source === node.id || e.target === node.id)

        // Glow for selected node
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, NODE_RADIUS + 8, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(45,91,227,0.08)'
          ctx.fill()
          ctx.strokeStyle = 'rgba(45,91,227,0.2)'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // Node circle with constellation effect
        ctx.beginPath()
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = isSelected ? '#2d5be3' : (hasEdge ? '#4f46e5' : '#9ca3af')
        ctx.fill()
        ctx.strokeStyle = isSelected ? '#1a3fa0' : '#fff'
        ctx.lineWidth = isSelected ? 2.5 : 1.5
        ctx.stroke()

        // Inner detail for visual interest
        if (!isSelected && hasEdge) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, NODE_RADIUS * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = '#fff'
          ctx.globalAlpha = 0.6
          ctx.fill()
          ctx.globalAlpha = 1
        }

        // Label (only on hover or selected)
        if (isSelected || isHovered) {
          const label = node.title.length > 22 ? node.title.slice(0, 20) + '…' : node.title
          ctx.fillStyle = 'var(--ink)'
          ctx.font = isSelected ? '600 11px Inter, sans-serif' : '500 10px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(label, node.x, node.y + NODE_RADIUS + 14)
        }
      }
    }

    let frame = 0
    function loop() {
      if (frame < 300) tick()  // run physics for 300 frames then coast
      frame++
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(animRef.current)
  }, [graph, selected, hoveredNode])

  function handleCanvasClick(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const nodes = nodesRef.current
    for (const node of nodes) {
      const dx = node.x - mx
      const dy = node.y - my
      if (Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS + 4) {
        if (selected === node.id) {
          navigate(`/document/${node.id}`)
        } else {
          setSelected(node.id)
        }
        return
      }
    }
    setSelected(null)
  }

  function handleCanvasMove(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const nodes = nodesRef.current
    for (const node of nodes) {
      const dx = node.x - mx
      const dy = node.y - my
      if (Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS + 4) {
        canvas.style.cursor = 'pointer'
        setHoveredNode(node.id)
        setTooltip({ x: e.clientX, y: e.clientY, node })
        return
      }
    }
    setHoveredNode(null)
    canvas.style.cursor = 'default'
    setTooltip(null)
  }

  const selectedNode = graph?.nodes.find(n => n.id === selected)
  const selectedEdges = selected
    ? graph?.edges.filter(e => e.source === selected || e.target === selected) || []
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h2>Knowledge Graph</h2>
        <p>Documents connected by shared keywords, authors, methods, and semantic similarity</p>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', background: 'var(--paper)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--ink-3)' }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
              Building graph…
            </div>
          ) : graph?.nodes.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 120 }}>
              <h3>No documents yet</h3>
              <p>Upload documents and the graph will form automatically.</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => setTooltip(null)}
            />
          )}

          {/* Legend */}
          {graph?.nodes.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              background: 'var(--paper)', border: '1px solid var(--rule)',
              borderRadius: 8, padding: '10px 14px', fontSize: 12,
              color: 'var(--ink-3)', display: 'flex', gap: 16,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 2, background: '#bfdbfe', display: 'inline-block' }} />
                Semantic
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 2, background: '#bbf7d0', display: 'inline-block' }} />
                Keyword / author
              </span>
              <span style={{ color: 'var(--ink-3)' }}>
                {graph.nodes.length} docs · {graph.edges.length} connections
              </span>
            </div>
          )}
        </div>

        {/* Side panel */}
        {selectedNode && (
          <div style={{
            width: 280, borderLeft: '1px solid var(--rule)',
            background: 'var(--paper)', overflowY: 'auto', padding: '20px 20px',
            flexShrink: 0,
          }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, lineHeight: 1.35, marginBottom: 8 }}>
            {selectedNode.label}
          </div>
            {selectedNode.authors?.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>
                {selectedNode.authors.slice(0, 3).join(', ')}
              </div>
            )}
            {selectedNode.year && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>{selectedNode.year}</div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
              onClick={() => navigate(`/document/${selectedNode.id}`)}
            >
              Open document
            </button>

            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 10 }}>
              {selectedEdges.length} connection{selectedEdges.length !== 1 ? 's' : ''}
            </div>

            {selectedEdges.map((edge, i) => {
              const otherSlug = edge.source === selected ? edge.target : edge.source
              const other = graph.nodes.find(n => n.id === otherSlug)
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px', marginBottom: 8,
                    border: '1px solid var(--rule)', borderRadius: 8,
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onClick={() => setSelected(otherSlug)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>
                    {other?.title || otherSlug}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>
                    {edge.reasons}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: 10.5, padding: '1px 7px', borderRadius: 99,
                      background: edge.type === 'semantic' ? '#eff6ff' : '#f0fdf4',
                      color: edge.type === 'semantic' ? '#1d4ed8' : '#166534',
                    }}>
                      {edge.type}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                      {edge.weight.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })}

            {selectedEdges.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                No connections yet. Upload more documents to build the graph.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top: tooltip.y - 10,
          background: '#1a1916',
          color: '#fff',
          fontSize: 12,
          padding: '5px 10px',
          borderRadius: 6,
          pointerEvents: 'none',
          zIndex: 1000,
          maxWidth: 220,
        }}>
          {tooltip.node.title}
        </div>
      )}
    </div>
  )
}
