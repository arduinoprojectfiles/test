import { useState, useEffect } from 'react'

const TAB_LABELS = {
  temporal:  'Temporal gaps',
  thin:      'Thin clusters',
  combos:    'Missing combinations',
}

export default function GapsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('temporal')

  useEffect(() => {
    fetch('/api/gaps')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const s = data?.summary || {}

  return (
    <div>
      <div className="page-header">
        <h2>Research Gap Detector</h2>
        <p>Identifies temporal gaps, under-researched topics, and unexplored method combinations</p>
      </div>
      <div className="page-body">

        {loading ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--ink-3)', padding: '40px 0' }}>
            <div className="spinner" /> Analysing corpus…
          </div>
        ) : !data || s.total_docs === 0 ? (
          <div className="empty-state">
            <h3>Not enough data yet</h3>
            <p>Upload at least a few documents with keywords and methods to detect gaps.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="stat-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 28 }}>
              <div className="stat-card">
                <div className="stat-label">Temporal gaps</div>
                <div className="stat-value">{s.temporal_gap_count ?? 0}</div>
                <div className="stat-sub">topics that went silent</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Thin keywords</div>
                <div className="stat-value">{s.thin_keyword_count ?? 0}</div>
                <div className="stat-sub">appear in only 1 paper</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Thin methods</div>
                <div className="stat-value">{s.thin_method_count ?? 0}</div>
                <div className="stat-sub">used in only 1 paper</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Missing combos</div>
                <div className="stat-value">{s.missing_combo_count ?? 0}</div>
                <div className="stat-sub">method pairs never combined</div>
              </div>
            </div>

            {/* Empty-year callout */}
            {s.empty_years && s.empty_years.length > 0 && (
              <div style={{ padding: '14px 18px', background: '#fef3c7', border: '1px solid #fde68a',
                            borderRadius: 10, marginBottom: 24, fontSize: 13.5 }}>
                <strong style={{ color: '#92400e' }}>Year gap:</strong>{' '}
                <span style={{ color: '#78350f' }}>
                  No documents from {s.empty_years.join(', ')} — coverage missing between {s.year_min} and {s.year_max}.
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="mode-tabs" style={{ marginBottom: 24 }}>
              {Object.entries(TAB_LABELS).map(([key, label]) => (
                <button key={key} className={'mode-tab' + (tab === key ? ' active' : '')} onClick={() => setTab(key)}>
                  {label}
                </button>
              ))}
            </div>

            {/* Temporal gaps */}
            {tab === 'temporal' && (
              <div>
                {(data.temporal_gaps || []).length === 0 ? (
                  <p style={{ color: 'var(--ink-3)' }}>No significant temporal gaps found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.temporal_gaps.map((g, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid var(--rule)',
                                            borderRadius: 10, padding: '16px 20px', boxShadow: 'var(--shadow)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{
                                background: g.type === 'method' ? '#eff6ff' : '#f0fdf4',
                                color:      g.type === 'method' ? '#1d4ed8' : '#166534',
                                padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                              }}>{g.type}</span>
                              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>"{g.term}"</span>
                            </div>
                            <div style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{g.message}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--red)' }}>
              {g.name}
            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>silence</div>
                          </div>
                        </div>
                        {/* Mini timeline bar */}
                        <div style={{ marginTop: 12, position: 'relative', height: 6, background: 'var(--paper-3)', borderRadius: 3 }}>
                          {(() => {
                            const total  = (g.last_seen - g.first_seen) || 1
                            const gStart = ((g.gap_start - g.first_seen) / total) * 100
                            const gWidth = ((g.gap_years) / total) * 100
                            return (
                              <div style={{
                                position: 'absolute', top: 0, height: '100%',
                                left: gStart + '%', width: gWidth + '%',
                                background: '#fca5a5', borderRadius: 3,
                              }} title={`Gap: ${g.gap_start}–${g.gap_end}`} />
                            )
                          })()}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-3)', marginTop: 3 }}>
                          <span>{g.first_seen}</span><span>{g.last_seen}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Thin clusters */}
            {tab === 'thin' && (
              <div>
                {(data.thin_clusters || []).length === 0 ? (
                  <p style={{ color: 'var(--ink-3)' }}>No thin clusters found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.thin_clusters.map((c, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid var(--rule)',
                                            borderRadius: 10, padding: '14px 18px',
                                            display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{
                          background: c.type === 'method' ? '#eff6ff' : '#f0fdf4',
                          color:      c.type === 'method' ? '#1d4ed8' : '#166534',
                          padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500, flexShrink: 0,
                        }}>{c.type}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                            "{c.term}"
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                            Only in: <em>{c.only_in}</em>{c.year ? ` (${c.year})` : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                          1 paper
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Missing combos */}
            {tab === 'combos' && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
                  Methods that each appear in multiple papers but have never been used together —
                  potential unexplored research directions.
                </p>
                {(data.missing_combos || []).length === 0 ? (
                  <p style={{ color: 'var(--ink-3)' }}>No missing combinations found. Need more papers with diverse methods.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.missing_combos.map((c, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid var(--rule)',
                                            borderRadius: 10, padding: '14px 20px',
                                            display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8',
                                           padding: '3px 10px', borderRadius: 99, fontSize: 12.5, fontWeight: 500 }}>
                              {c.method_a}
                            </span>
                            <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>×</span>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8',
                                           padding: '3px 10px', borderRadius: 99, fontSize: 12.5, fontWeight: 500 }}>
                              {c.method_b}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
                            {c.count_a} papers use "{c.method_a}" · {c.count_b} use "{c.method_b}" · never combined
                          </div>
                        </div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--accent)',
                          marginBottom: 10 }}>
              {item}
            </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
