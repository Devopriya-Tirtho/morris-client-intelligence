# Prototype verification

## Automated checks
- 12 domain tests: rollups, cap denominators, unallocated time, descendant visibility, draft redaction, forecast edge cases, grouping cycles, protected manual fields, category/month reconciliation, aliases and delivery windows.
- Strict TypeScript compilation and production Vite build.

## Original prototype browser checks (historical; before architecture refinement)
- Executive overview renders KPI totals, charts, health ring and navigation.
- Role switching exposes the internal registry and editing tools.
- Created a temporary upcoming project with description and no work order; detail navigation displayed the saved values.
- Reloaded: local edits persisted, default client role hid the unpublished project; switching back to internal restored access.
- Allocated six review hours to WO1267; review count dropped from two to one and portfolio actuals increased from 1,054 to 1,060 without double counting.
- Mapped qbo-999 to Sophie Martin; the ID appeared on her card and the unresolved-identity message cleared.
- Presentation mode hid navigation and editing tools, excluded the hidden test project, and advanced from overview to portfolio. Exit restored internal mode.
- Forecast view rendered cap comparison, status counts, timeline rows and risk actions.
- Test edits were reset to the original seed before handoff.

## Limits
Desktop browser verification was performed. Responsive breakpoints and reduced-motion/print styles are implemented; a physical mobile device and a complete screen-reader audit were not run. No real integration or authentication is claimed or tested.

## Architecture refinement verification — October 23, 2026

Baseline: GitHub main `d0356366bd3e24a46647c974e603178b8cf6fa8e`. All 25 repository files were compared by Git blob hash with the remote tree before editing. No AGENTS.md was present in that tree. Read the source, seed, tests, README, QA and manual-only Pages workflow. Baseline: 12/12 tests and Vite build passed.

Final automated verification:
- `npm test`: 30/30 passed (original 12 plus 18 domain/service regressions).
- `npm run build`: strict TypeScript and production Vite build passed.
- Protected external merges, manual metadata and time allocations; stable upcoming attachment and duplicate rejection.
- Cached navigation reads, cloned responses, serialized writes, failure recovery and v1 persistence compatibility.
- Role restrictions, hidden descendants, draft narrative redaction, grouping reconciliation and disabled future adapters.
- Zero caps, date-based delays, forecast overrides/completion estimates, attention items and fixed-year reporting.

Browser checks were not rerun for this refinement: installed Playwright has no Chromium executable. Vite starts successfully when bound to 127.0.0.1. The historical browser checklist above is not claimed as current evidence. Before merging, manually check project editing/creation, content toggles, identity edits, time allocation and presentation mode.

No workflow dispatched, no deployment, no live integration, and no merge performed.


## Premium client refinement — current verification

Base: merged main `3da2997da215c51a8f6dba09a1795b33f2fcc3d3`. All repository file hashes matched the inspected architecture baseline before editing. Branch: `codex/client-experience-premium-refinement`.

### Executed checks

- `npm test`: **44/44 pass**, preserving all original 30 tests.
- `npm run build`: strict TypeScript and Vite production build pass.
- Added regression coverage for category rename/ordering/archive/reassignment/default/restore, source preservation, upcoming conversion, hierarchy labels, health thresholds, deterministic insights and client/team visibility.
- Server-render smoke checks: distinct client/admin overview compositions; primary views with hidden contacts and an empty shared portfolio; internal source/allocation controls; all ten presentation chapters. These checks validate rendering logic, not browser layout, keyboard effects or animations.
- Static build artifact check: relative entry assets and bundled font URLs resolve under a repository subpath; no root-relative `/assets/` URLs. This does not replace a browser refresh test.
- Bundle separated into application, chart and motion chunks. No large-chunk build warning remains.
- GitHub Pages uses the existing relative base and hash routes. Deployment workflow unchanged and not dispatched.

### Browser / visual limitation

Interactive browser checks and screenshots could not be completed in this environment. Local Playwright has no Chromium executable; downloading Chromium returned an invalid archive. The cloud browser cannot reach the workspace loopback server (`ERR_CONNECTION_REFUSED`). Do not treat historical browser checks above or server-render tests as current visual verification.

### Manual review checklist (not yet executed)

Use the README local-review commands. Check 1440×900 and 1366×768 laptops, plus 768 px and 390 px widths.

- Client overview: hierarchy, contrast, chart labels, card spacing, synthetic label and horizontal overflow.
- Morris role: distinct operational overview; create/edit project, save-success feedback, invalid field rejection, drawer focus and unsaved cancel confirmation.
- Portfolio: cards/table, all filters, sorting, grouping, clear filters, empty results and parent/child labels.
- Categories: rename propagation; description/icon/colour; reorder/default; archive with reassignment; restore; source time and total hours unchanged.
- Pipeline: create without WO; attach mock WO; stable ID and authored fields retained; status transition visible.
- Team: edit profile and visibility; duplicate alias rejection; unshared manager fallback.
- Time: raw source label is unchanged after reporting reallocation to parent/child/upcoming/service area.
- Narratives/content: draft redaction; hidden-parent descendants omitted from all client metrics and insights.
- Presentation: all ten chapters, Previous/Next, chapter selector, keyboard arrows, Escape, role restoration, direct hash refresh, no editing controls.
- Accessibility: keyboard traversal, focus containment/return, reduced-motion setting, readable chart descriptions and table overflow.
- Pages subpath: assets load, hash routes refresh, role switching and presentation route work without server rewrites.

No real data, live APIs, Firebase/QBO/Cloud Run connection, deployment or merge is part of this change.
