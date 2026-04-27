import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { api } from './api.js'

import SearchPage     from './pages/SearchPage.jsx'
import LibraryPage    from './pages/LibraryPage.jsx'
import UploadPage     from './pages/UploadPage.jsx'
import DocumentPage   from './pages/DocumentPage.jsx'
import GraphPage      from './pages/GraphPage.jsx'
import TimelinePage   from './pages/TimelinePage.jsx'
import GlossaryPage   from './pages/GlossaryPage.jsx'
import DuplicatesPage from './pages/DuplicatesPage.jsx'
import GapsPage       from './pages/GapsPage.jsx'
import AuthorsPage    from './pages/AuthorsPage.jsx'
import ExportPage     from './pages/ExportPage.jsx'
import ReviewPage     from './pages/ReviewPage.jsx'

function Sidebar() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    api.getStats().then(setStats).catch(() => {})
    const t = setInterval(() => api.getStats().then(setStats).catch(() => {}), 8000)
    return () => clearInterval(t)
  }, [])

  const nav = (to, label, Icon) => (
    <NavLink to={to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
      <Icon /> {label}
    </NavLink>
  )

  const SectionLabel = ({ children }) => (
    <div style={{ padding: '12px 24px 4px', fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)' }}>
      {children}
    </div>
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Research<br />Knowledge Base</h1>
        <div className="tagline">Local · Private · Connected</div>
      </div>
      <nav className="sidebar-nav">
        <SectionLabel>Core</SectionLabel>
        {nav('/search',     'Search',           IcoSearch)}
        {nav('/library',    'Library',          IcoLibrary)}
        {nav('/upload',     'Upload',           IcoUpload)}

        <SectionLabel>Explore</SectionLabel>
        {nav('/graph',      'Knowledge graph',  IcoGraph)}
        {nav('/timeline',   'Timeline',         IcoTimeline)}
        {nav('/glossary',   'Glossary',         IcoGlossary)}
        {nav('/authors',    'Author network',   IcoAuthors)}

        <SectionLabel>Analyse</SectionLabel>
        {nav('/gaps',       'Research gaps',    IcoGaps)}
        {nav('/duplicates', 'Duplicates',       IcoDup)}
        {nav('/review',     'PRISMA review',    IcoReview)}

        <SectionLabel>Export</SectionLabel>
        {nav('/export',     'Export references',IcoExport)}
      </nav>
      {stats && (
        <div className="sidebar-stats">
          <div><strong>{stats.ready}</strong> documents indexed</div>
          {stats.processing > 0 && <div><strong>{stats.processing}</strong> processing…</div>}
          <div><strong>{stats.vector_count.toLocaleString()}</strong> vectors</div>
        </div>
      )}
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"           element={<SearchPage />} />
            <Route path="/search"     element={<SearchPage />} />
            <Route path="/library"    element={<LibraryPage />} />
            <Route path="/upload"     element={<UploadPage />} />
            <Route path="/document/:slug" element={<DocumentPage />} />
            <Route path="/graph"      element={<GraphPage />} />
            <Route path="/timeline"   element={<TimelinePage />} />
            <Route path="/glossary"   element={<GlossaryPage />} />
            <Route path="/duplicates" element={<DuplicatesPage />} />
            <Route path="/gaps"       element={<GapsPage />} />
            <Route path="/authors"    element={<AuthorsPage />} />
            <Route path="/export"     element={<ExportPage />} />
            <Route path="/review"     element={<ReviewPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

const IcoSearch   = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M13.5 13.5L18 18" strokeLinecap="round"/></svg>
const IcoLibrary  = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="5" height="14" rx="1"/><rect x="9" y="3" width="5" height="14" rx="1"/><rect x="15.5" y="5" width="3" height="12" rx="1" transform="rotate(10 15.5 5)"/></svg>
const IcoUpload   = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13V4M7 7l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15v1a2 2 0 002 2h10a2 2 0 002-2v-1" strokeLinecap="round"/></svg>
const IcoGraph    = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="4" r="2"/><circle cx="4" cy="16" r="2"/><circle cx="16" cy="16" r="2"/><line x1="10" y1="6" x2="4" y2="14"/><line x1="10" y1="6" x2="16" y2="14"/><line x1="5.5" y1="16" x2="14.5" y2="16"/></svg>
const IcoTimeline = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="10" x2="17" y2="10"/><circle cx="6" cy="10" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="14" cy="13" r="2" fill="currentColor" stroke="none"/></svg>
const IcoGlossary = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="2" width="14" height="16" rx="2"/><line x1="7" y1="7" x2="13" y2="7"/><line x1="7" y1="10" x2="13" y2="10"/><line x1="7" y1="13" x2="10" y2="13"/></svg>
const IcoAuthors  = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="8" r="3"/><circle cx="14" cy="6" r="2.5"/><path d="M1 17c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round"/><path d="M14 10c2 0 4 1.5 4 4" strokeLinecap="round"/></svg>
const IcoGaps     = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 14l4-4 3 3 3-5 4 3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="15" cy="5" r="2" fill="#fca5a5" stroke="#ef4444"/></svg>
const IcoDup      = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="12" height="14" rx="2"/><rect x="6" y="2" width="12" height="14" rx="2" strokeDasharray="3 2"/></svg>
const IcoReview   = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l2 2 4-4"/><rect x="3" y="3" width="14" height="14" rx="2"/><line x1="7" y1="7" x2="7" y2="7" strokeLinecap="round"/></svg>
const IcoExport   = () => <svg className="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3v10M7 10l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15v1a2 2 0 002 2h10a2 2 0 002-2v-1" strokeLinecap="round"/></svg>
