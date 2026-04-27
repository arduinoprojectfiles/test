import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRISMADiagram } from '../components/PRISMADiagram.jsx'

const DECISIONS = {
  include: { label: 'Include',  bg: '#dcfce7', color: '#166534', border: '#86efac' },
  exclude: { label: 'Exclude',  bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
  maybe:   { label: 'Maybe',    bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  pending: { label: 'Pending',  bg: 'var(--paper-3)', color: 'var(--ink-3)', border: 'var(--rule)' },
}

export default function ReviewPage() {
  const [projects, setProjects]         = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [screenings, setScreenings]     = useState([])
  const [prisma, setPrisma]             = useState(null)
  const [conflicts, setConflicts]       = useState([])
  const [filter, setFilter]             = useState('pending')
  const [view, setView]                 = useState('screen') // screen | prisma | conflicts
  const [showNewProject, setShowNewProject] = useState(false)
  const [loadingScreen, setLoadingScreen]   = useState(false)
  const [form, setForm] = useState({ name: '', question: '', inclusion_criteria: '', exclusion_criteria: '' })
  const navigate = useNavigate()

  useEffect(() => { fetchProjects() }, [])

  useEffect(() => {
    if (activeProject) {
      fetchScreenings()
      fetchPrisma()
      fetchConflicts()
    }
  }, [activeProject, filter])

  async function fetchProjects() {
    const res  = await fetch('/api/review')
    const data = await res.json()
    setProjects(data.projects || [])
    if (!activeProject && data.projects?.length > 0) {
      setActiveProject(data.projects[0])
    }
  }

  async function fetchScreenings() {
    setLoadingScreen(true)
    const qs  = filter !== 'all' ? `?decision_filter=${filter}` : ''
    const res = await fetch(`/api/review/${activeProject.id}/screenings${qs}`)
    const d   = await res.json()
    setScreenings(d.screenings || [])
    setLoadingScreen(false)
  }

  async function fetchPrisma() {
    const res = await fetch(`/api/review/${activeProject.id}/prisma`)
    const d   = await res.json()
    setPrisma(d)
  }

  async function fetchConflicts() {
    const res = await fetch(`/api/review/${activeProject.id}/conflicts`)
    const d   = await res.json()
    setConflicts(d.conflicts || [])
  }

  async function createProject() {
    if (!form.name.trim()) return
    const res  = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, auto_populate: true }),
    })
    const proj = await res.json()
    setShowNewProject(false)
    setForm({ name: '', question: '', inclusion_criteria: '', exclusion_criteria: '' })
    setActiveProject(proj)
    fetchProjects()
  }

  async function decide(slug, decision) {
    await fetch(`/api/review/${activeProject.id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_slug: slug, decision }),
    })
    fetchScreenings()
    fetchPrisma()
  }

  async function deleteProject(id) {
    if (!confirm('Delete this review project and all screening decisions?')) return
    await fetch(`/api/review/${id}`, { method: 'DELETE' })
    setActiveProject(null)
    fetchProjects()
  }

  const p = activeProject

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h2>Systematic Review</h2>
        <p>Screen papers for inclusion and generate PRISMA flow diagrams</p>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Project sidebar */}
        <div style={{ width: 240, borderRight: '1px solid var(--rule)', background: 'var(--paper-2)',
                      overflowY: 'auto', flexShrink: 0, padding: '16px 0' }}>
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
              onClick={() => setShowNewProject(true)}>
              + New project
            </button>
          </div>

          {projects.map(proj => (
            <div key={proj.id}
              onClick={() => setActiveProject(proj)}
              style={{ padding: '10px 16px', cursor: 'pointer', transition: 'background 0.1s',
                       background: activeProject?.id === proj.id ? 'var(--accent-2)' : 'transparent',
                       borderLeft: activeProject?.id === proj.id ? '3px solid var(--accent)' : '3px solid transparent' }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>
                {proj.name}
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#166534' }}>{proj.counts?.include ?? 0} in</span>
                <span style={{ color: '#991b1b' }}>{proj.counts?.exclude ?? 0} out</span>
                <span style={{ color: '#92400e' }}>{proj.counts?.maybe ?? 0} ?</span>
                <span style={{ color: 'var(--ink-3)' }}>{proj.counts?.pending ?? 0} left</span>
              </div>
              <div style={{ marginTop: 4 }}>
                <div style={{ height: 3, background: 'var(--rule)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: proj.completion_pct + '%',
                                background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div style={{ padding: '24px 16px', fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>
              No projects yet. Create one to start screening.
            </div>
          )}
        </div>

        {/* Main area */}
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {showNewProject ? (
            <div style={{ padding: '32px 48px', maxWidth: 640 }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, marginBottom: 24 }}>
          New project
        </h3>
              {[
                { key: 'name',               label: 'Project name *',         rows: 1 },
                { key: 'question',           label: 'Research question',       rows: 2 },
                { key: 'inclusion_criteria', label: 'Inclusion criteria',      rows: 3 },
                { key: 'exclusion_criteria', label: 'Exclusion criteria',      rows: 3 },
              ].map(({ key, label, rows }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: 'var(--ink-3)', display: 'block', marginBottom: 5 }}>{label}</label>
                  {rows === 1 ? (
                    <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--rule)',
                               fontFamily: 'var(--font-sans)', fontSize: 13.5, outline: 'none' }} />
                  ) : (
                    <textarea rows={rows} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--rule)',
                               fontFamily: 'var(--font-sans)', fontSize: 13.5, resize: 'vertical', outline: 'none' }} />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={createProject}>Create project</button>
                <button className="btn btn-ghost" onClick={() => setShowNewProject(false)}>Cancel</button>
              </div>
            </div>
          ) : !p ? (
            <div className="empty-state" style={{ paddingTop: 100 }}>
              <h3>No project selected</h3>
              <p>Create a new review project to start screening papers.</p>
            </div>
          ) : (
            <div>
              {/* Project header */}
              <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--rule)',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                  {p.question && <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 600 }}>{p.question}</div>}
                </div>
                <button className="btn btn-danger" style={{ fontSize: 12, flexShrink: 0 }}
                  onClick={() => deleteProject(p.id)}>Delete project</button>
              </div>

              {/* Tabs */}
              <div style={{ padding: '0 32px', borderBottom: '1px solid var(--rule)', display: 'flex', gap: 0 }}>
                {[['screen','Screen papers'],['prisma','PRISMA flow'],['conflicts','Conflicts' + (conflicts.length > 0 ? ` (${conflicts.length})` : '')]].map(([key, label]) => (
                  <button key={key} onClick={() => setView(key)}
                    style={{ padding: '11px 18px', border: 'none', background: 'none', cursor: 'pointer',
                             fontFamily: 'var(--font-sans)', fontSize: 13.5,
                             color: view === key ? 'var(--ink)' : 'var(--ink-3)',
                             borderBottom: view === key ? '2px solid var(--accent)' : '2px solid transparent',
                             fontWeight: view === key ? 500 : 400 }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Screen view */}
              {view === 'screen' && (
                <div style={{ padding: '20px 32px' }}>
                  {/* Decision filter tabs */}
                  <div className="mode-tabs" style={{ marginBottom: 20 }}>
                    {[['pending','Pending'],['all','All'],['include','Included'],['maybe','Maybe'],['exclude','Excluded']].map(([key, label]) => (
                      <button key={key} className={'mode-tab' + (filter === key ? ' active' : '')}
                        onClick={() => setFilter(key)}>{label}</button>
                    ))}
                  </div>

                  {p.inclusion_criteria && (
                    <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                                  borderRadius: 8, fontSize: 12.5, color: '#166534', marginBottom: 16 }}>
                      <strong>Include if:</strong> {p.inclusion_criteria}
                    </div>
                  )}
                  {p.exclusion_criteria && (
                    <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
                                  borderRadius: 8, fontSize: 12.5, color: '#991b1b', marginBottom: 16 }}>
                      <strong>Exclude if:</strong> {p.exclusion_criteria}
                    </div>
                  )}

                  {loadingScreen ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--ink-3)', padding: '32px 0' }}>
                      <div className="spinner" /> Loading…
                    </div>
                  ) : screenings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-3)' }}>
                      {filter === 'pending' ? 'All papers screened! 🎉' : 'No papers in this category.'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {screenings.map(s => {
                        const doc = s.document || {}
                        const dec = DECISIONS[s.decision] || DECISIONS.pending
                        return (
                          <div key={s.id} style={{ background: '#fff', border: '1px solid var(--rule)',
                                                    borderRadius: 10, padding: '16px 20px',
                                                    boxShadow: 'var(--shadow)' }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
                                              color: 'var(--ink)', marginBottom: 4, lineHeight: 1.35,
                                              cursor: 'pointer', textDecoration: 'underline',
                                              textDecorationColor: 'transparent',
                                              transition: 'text-decoration-color 0.1s' }}
                                  onClick={() => navigate('/document/' + doc.slug)}
                                  onMouseEnter={e => e.target.style.textDecorationColor = 'var(--ink-3)'}
                                  onMouseLeave={e => e.target.style.textDecorationColor = 'transparent'}>
                                  {doc.title || s.document_slug}
                                </div>
                                {doc.authors?.length > 0 && (
                                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                                    {doc.authors.slice(0, 3).join(', ')}{doc.year ? ` · ${doc.year}` : ''}
                                  </div>
                                )}
                                {doc.abstract && (
                                  <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55,
                                                display: '-webkit-box', WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {doc.abstract}
                                  </div>
                                )}
                              </div>

                              {/* Decision buttons */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                {['include', 'maybe', 'exclude'].map(d => {
                                  const ds = DECISIONS[d]
                                  const isActive = s.decision === d
                                  return (
                                    <button key={d} onClick={() => decide(s.document_slug, d)}
                                      style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid',
                                               borderColor: isActive ? ds.border : 'var(--rule)',
                                               background: isActive ? ds.bg : '#fff',
                                               color: isActive ? ds.color : 'var(--ink-3)',
                                               fontFamily: 'var(--font-sans)', fontSize: 12.5,
                                               fontWeight: isActive ? 600 : 400,
                                               cursor: 'pointer', transition: 'all 0.1s' }}>
                                      {ds.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PRISMA view */}
              {view === 'prisma' && prisma && (
                <div style={{ padding: '32px 48px' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600, marginBottom: 24 }}>PRISMA 2020 Flow</div>
                  <PRISMADiagram stats={{
                    records_identified: prisma.stages?.identified || 0,
                    records_screened: prisma.stages?.screened || 0,
                    records_excluded: prisma.stages?.excluded || 0,
                    fulltext_assessed: prisma.stages?.eligible || 0,
                    fulltext_excluded: (prisma.stages?.excluded || 0) - (prisma.stages?.included || 0),
                    studies_included: prisma.stages?.included || 0,
                  }} />
                  <div style={{ marginTop: 28, padding: '14px 18px', background: 'var(--paper-2)',
                                border: '1px solid var(--rule)', borderRadius: 10, fontSize: 12.5,
                                color: 'var(--ink-3)', lineHeight: 1.7 }}>
                    Counts update in real time as you screen papers. Export your final included set
                    using the <strong>Export</strong> page (filter to included documents, then download BibTeX or RIS).
                  </div>
                </div>
              )}

              {/* Conflicts view */}
              {view === 'conflicts' && (
                <div style={{ padding: '20px 32px' }}>
                  {conflicts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-3)' }}>
                      <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>✓</div>
                      No conflicts — all reviewers agree.
                    </div>
                  ) : conflicts.map((c, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #fde68a',
                                          borderRadius: 10, padding: '16px 20px', marginBottom: 12 }}>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>{c.document_title}</div>
                      {c.reviews.map((r, j) => (
                        <div key={j} style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 3 }}>
                          <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{r.reviewer}:</span>{' '}
                          <span style={{ color: DECISIONS[r.decision]?.color }}>{r.decision}</span>
                          {r.reason && <span> — {r.reason}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
