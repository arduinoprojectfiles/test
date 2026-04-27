import { useState, useEffect } from 'react'

export function PRISMADiagram({ stats = {} }) {
  const {
    records_identified = 0,
    records_removed = 0,
    records_screened = 0,
    records_excluded = 0,
    fulltext_assessed = 0,
    fulltext_excluded = 0,
    studies_included = 0,
  } = stats

  return (
    <svg viewBox="0 0 800 1200" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <defs>
        <style>{`
          .prisma-box { fill: var(--paper-2); stroke: var(--ink-3); stroke-width: 2; }
          .prisma-title { font-family: var(--font-sans); font-size: 14px; font-weight: 600; fill: var(--ink); }
          .prisma-count { font-family: var(--font-mono); font-size: 24px; font-weight: 700; fill: var(--accent); }
          .prisma-label { font-family: var(--font-sans); font-size: 12px; fill: var(--ink-2); }
          .prisma-arrow { stroke: var(--ink-3); stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
        `}</style>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="var(--ink-3)" />
        </marker>
      </defs>

      <text x="400" y="30" style={{ fontSize: '18px', fontWeight: '700', textAnchor: 'middle', fill: 'var(--ink)' }}>
        PRISMA 2020 Flow Diagram
      </text>

      {/* Phase 1: Identification */}
      <rect x="150" y="60" width="500" height="120" class="prisma-box" rx="8" />
      <text x="400" y="90" textAnchor="middle" class="prisma-title">Identification</text>
      <text x="400" y="120" textAnchor="middle" class="prisma-count">{records_identified}</text>
      <text x="400" y="145" textAnchor="middle" class="prisma-label">records identified</text>
      <line x1="400" y1="180" x2="400" y2="210" class="prisma-arrow" />

      {/* Phase 2: Screening */}
      <rect x="150" y="210" width="500" height="140" class="prisma-box" rx="8" />
      <text x="400" y="245" textAnchor="middle" class="prisma-title">Screening</text>
      
      <rect x="170" y="260" width="200" height="80" class="prisma-box" rx="6" />
      <text x="270" y="285" textAnchor="middle" class="prisma-count">{records_screened}</text>
      <text x="270" y="310" textAnchor="middle" class="prisma-label">screened</text>
      
      <rect x="430" y="260" width="200" height="80" class="prisma-box" rx="6" fill="var(--paper-3)" />
      <text x="530" y="285" textAnchor="middle" class="prisma-count" fill="var(--red)">{records_excluded}</text>
      <text x="530" y="310" textAnchor="middle" class="prisma-label">excluded</text>

      <line x1="370" y1="340" x2="330" y2="370" class="prisma-arrow" />
      <line x1="430" y1="340" x2="470" y2="370" class="prisma-arrow" />

      {/* Phase 3: Eligibility */}
      <rect x="150" y="370" width="500" height="140" class="prisma-box" rx="8" />
      <text x="400" y="405" textAnchor="middle" class="prisma-title">Eligibility</text>

      <rect x="170" y="420" width="200" height="80" class="prisma-box" rx="6" />
      <text x="270" y="445" textAnchor="middle" class="prisma-count">{fulltext_assessed}</text>
      <text x="270" y="470" textAnchor="middle" class="prisma-label">full-text assessed</text>

      <rect x="430" y="420" width="200" height="80" class="prisma-box" rx="6" fill="var(--paper-3)" />
      <text x="530" y="445" textAnchor="middle" class="prisma-count" fill="var(--red)">{fulltext_excluded}</text>
      <text x="530" y="470" textAnchor="middle" class="prisma-label">excluded</text>

      <line x1="370" y1="500" x2="330" y2="530" class="prisma-arrow" />
      <line x1="430" y1="500" x2="470" y2="530" class="prisma-arrow" />

      {/* Phase 4: Inclusion */}
      <rect x="200" y="530" width="400" height="120" class="prisma-box" fill="var(--green-bg)" stroke="var(--green)" rx="8" />
      <text x="400" y="560" textAnchor="middle" class="prisma-title" fill="var(--green)">Inclusion</text>
      <text x="400" y="595" textAnchor="middle" class="prisma-count" fill="var(--green)">{studies_included}</text>
      <text x="400" y="620" textAnchor="middle" class="prisma-label" fill="var(--green)">studies included in review</text>
    </svg>
  )
}
