# Prototype verification

## Automated checks
- 12 domain tests: rollups, cap denominators, unallocated time, descendant visibility, draft redaction, forecast edge cases, grouping cycles, protected manual fields, category/month reconciliation, aliases and delivery windows.
- Strict TypeScript compilation and production Vite build.

## Browser checks (desktop Chrome)
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
