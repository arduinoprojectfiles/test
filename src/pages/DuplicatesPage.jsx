import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DuplicatesPage() {
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/duplicates')
      .then(r => r.json())
      .then(d => { setGroups(d.groups || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const kindStyle = (kind) => {
    if (kind === 'duplicate')          return { background: '#fef2f2', color: '#991b1b', label: 'Duplicate' }
    if (kind === 'possible_duplicate') return { background: '#fef3c7', color: '#92400e', label: 'Possible duplicate' }
    if (kind === 'version')            return { background: '#eff6ff', color: '#1d4ed8', label: 'Newer version' }
    return { background: 'var(--paper-3)', color: 'var(--ink-3)', label: kind }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Duplicate &amp; version detector</h2>
        <p>Documents flagged as near-duplicates or updated versions of existing papers in your corpus</p>
      </div>
      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--ink-3)', padding: '40px 0' }}>
            <div className="spinner" /> Scanning…
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <svg className="icon-empty-state" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="12" height="14" rx="2" />
              <rect x="10" y="2" width="12" height="14" rx="2" strokeDasharray="3 2" />
            </svg>
            <h3>No duplicates detected</h3>
            <p>All documents are unique or have been automatically detected.</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 24 }}>
              <strong style={{ color: 'var(--ink)' }}>{groups.length}</strong> group{groups.length !== 1 ? 's' : ''} of near-duplicate or versioned documents
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {groups.map((group, gi) => (
                <div key={gi} style={{ background: '#fff', border: '1px solid var(--rule)',
                                       borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                  <div style={{ padding: '16px 20px', background: 'var(--paper-2)', borderBottom: '1px solid var(--rule)' }}>
                    <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em',
                                  color: 'var(--ink-3)', marginBottom: 6 }}>Original</div>
                  <button onClick={() => navigate('/document/' + group.original.slug)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'var(--font-sans)' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35, marginBottom: 3 }}>
                      {group.original.title}
                    </div>
                      {group.original.authors && group.original.authors.length > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                          {group.original.authors.slice(0, 3).join(', ')}
                          {group.original.year ? ' · ' + group.original.year : ''}
                        </div>
                      )}
                    </button>
                  </div>

                  {group.matches.map((match, mi) => {
                    const ks = kindStyle(match.dup_kind)
                    return (
                      <div key={mi} style={{ padding: '14px 20px 14px 36px', display: 'flex', alignItems: 'flex-start', gap: 14,
                                             borderBottom: mi < group.matches.length - 1 ? '1px solid var(--rule-2)' : 'none' }}>
                        <div style={{ width: 2, alignSelf: 'stretch', background: 'var(--rule)', borderRadius: 1, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ background: ks.background, color: ks.color,
                                           padding: '2px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 500 }}>
                              {ks.label}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                              {Math.round((match.dup_score || 0) * 100)}% match
                            </span>
                          </div>
                          <button onClick={() => navigate('/document/' + match.slug)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'var(--font-sans)' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.35, marginBottom: 3 }}>
                      {dup.title}
                    </div>
                            {match.authors && match.authors.length > 0 && (
                              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                                {match.authors.slice(0, 3).join(', ')}
                                {match.year ? ' · ' + match.year : ''}
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, padding: '16px 20px', background: 'var(--paper-2)',
                          borderRadius: 10, border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--ink-2)' }}>How it works:</strong> title edit-distance, abstract vector similarity, and shared authorship.
              ≥ 95% title → Duplicate · ≥ 88% semantic → Possible duplicate · same authors + 70%+ title → Newer version.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
