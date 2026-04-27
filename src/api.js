const BASE = '/api'

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Documents
  listDocuments: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/documents' + (qs ? '?' + qs : ''))
  },
  getDocument:       (slug)         => request('/documents/' + slug),
  getDocumentChunks: (slug, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/documents/' + slug + '/chunks' + (qs ? '?' + qs : ''))
  },
  getDocumentStatus: (slug) => request('/documents/' + slug + '/status'),
  deleteDocument:    (slug) => request('/documents/' + slug, { method: 'DELETE' }),
  getStats:          ()     => request('/documents/stats'),
  getDocumentFile:   (slug) => '/api/documents/' + slug + '/file',

  // Search
  search: (q, mode = 'hybrid', topK = 20) => {
    const qs = new URLSearchParams({ q, mode, top_k: topK }).toString()
    return request('/search?' + qs)
  },

  // Graph
  getGraph:               ()     => request('/graph'),
  getDocumentConnections: (slug) => request('/graph/' + slug),

  // Upload
  uploadFiles: (files) => {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    return request('/upload', { method: 'POST', body: fd })
  },

  // Timeline
  getTimeline: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/timeline' + (qs ? '?' + qs : ''))
  },

  // Glossary
  getGlossary: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/glossary' + (qs ? '?' + qs : ''))
  },
  searchGlossary: (q) => request('/glossary/search?q=' + encodeURIComponent(q)),

  // Duplicates
  getDuplicates: () => request('/duplicates'),

  // Research gaps
  getGaps: () => request('/gaps'),

  // Author network
  getAuthorNetwork: () => request('/authors'),

  // Export
  exportBibtex: (slugs) => '/api/export/bibtex' + (slugs?.length ? '?slugs=' + slugs.join(',') : ''),
  exportRis:    (slugs) => '/api/export/ris'    + (slugs?.length ? '?slugs=' + slugs.join(',') : ''),

  // Annotations
  getAnnotations:    (slug)   => request('/annotations/' + slug),
  createAnnotation:  (body)   => request('/annotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  updateAnnotation:  (id, b)  => request('/annotations/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }),
  deleteAnnotation:  (id)     => request('/annotations/' + id, { method: 'DELETE' }),
  listAnnotations:   (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/annotations' + (qs ? '?' + qs : ''))
  },

  // Systematic review
  listReviewProjects:  ()        => request('/review'),
  createReviewProject: (body)    => request('/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  getReviewProject:    (id)      => request('/review/' + id),
  updateReviewProject: (id, b)   => request('/review/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }),
  deleteReviewProject: (id)      => request('/review/' + id, { method: 'DELETE' }),
  getScreenings:       (id, f)   => request('/review/' + id + '/screenings' + (f && f !== 'all' ? '?decision_filter=' + f : '')),
  setDecision:         (id, b)   => request('/review/' + id + '/decision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }),
  getPrisma:           (id)      => request('/review/' + id + '/prisma'),
  getConflicts:        (id)      => request('/review/' + id + '/conflicts'),
}
