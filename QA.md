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
