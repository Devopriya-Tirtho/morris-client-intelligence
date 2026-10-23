# Final prototype acceptance

Base: main `7f20ef9b346de9a6d464adbabb8e114cdf62a2c3`.
Logo uploads from main `9c95635949df199bffa0562baac5dc4c2db92fee` were incorporated after the initial review. Supplied images were inspected; the Zagimē wordmark and Morris MI mark are configured without recolouring or distortion.

Review branch: `codex/final-presentation-qa-polish`. No merge, deployment or live integration performed.

## Executed verification

- [x] All tracked baseline file hashes matched current main before editing.
- [x] Source review: Client View, Morris Internal, overview, project cards/table/detail/editor, service areas, team/contacts, time allocation, upcoming projects, narrative/content controls, forecast and all ten presentation chapters.
- [x] `npm test`: 45/45 pass. Includes calculations, ownership protection, visibility/draft filtering, category archive/reassignment/restore, upcoming attachment, persistence failure recovery and local repository reload.
- [x] Seed consistency regression: monthly totals = service-area totals = root rollups; completed projects have 100% progress, complete milestones and no remaining effort; upcoming starts are after the reporting date; time entries fall within project windows and the reporting date.
- [x] Server-render coverage: distinct client/internal compositions, empty/hidden-contact states and all presentation chapters. Ending offers Finish review; health score uses /100; presentation excludes editing controls.
- [x] `npm run build`: strict TypeScript and Vite production build.
- [x] Pages configuration retains relative assets and hash routing. Workflow runs npm ci → npm test → npm run build; deploy depends on successful build. Push trigger is main-only; manual dispatch remains, with a main-branch job guard.

These automated checks do not verify browser layout or interaction.

## Final browser acceptance — outstanding

Use a fresh browser profile and the README local-review commands. Keep existing saved edits in the original profile.

| Area | Acceptance checks |
| --- | --- |
| Client mode | Zagimē primary identity, Morris delivery-partner identity, hero/KPIs, focus, accomplishments, actionable attention items, readable charts and synthetic label |
| Morris Internal | Role switching, distinct overview, project creation/edit/save, validation and success feedback; reload retains edits |
| Projects/detail | Search, filters, sorting, grouping, card/table switch, parent/child totals, forecast/timeline, narrative, contacts and missing-contact state |
| Category management | Add/edit/default/reorder; archive with destination, reassignment totals and restore |
| Team/time | Profile edit, visibility, alias validation and time allocation; raw source values unchanged |
| Upcoming/content | Planning record, work-order attachment with stable ID; visibility and draft filters reflected throughout client views |
| Narrative | Save; saved state clears dirty indicator; changing project prompts only for unsaved edits |
| Presentation | All ten chapters; Previous/Next/selector, arrows, Home/End, Escape; Start over; Finish review/Exit restore entry role; scroll starts at chapter heading; controls remain reachable; no admin tools |
| Responsive | **1366×768, 1440×900, 1536×864, 1920×1080**: no horizontal page overflow, clipping, overlapping cards or unreadable charts; long chapters scroll above fixed navigation. Also spot-check 390px and 768px widths |
| Accessibility | Tab order, dialog focus containment/return, reduced motion, readable status/contrast and keyboard chapter navigation |
| GitHub Pages | After merge/deploy: assets load under repository subpath; refresh project/presentation hash routes; confirm browser persistence |

## Environment and prototype limitations

Current visual/interactive checks are **not certified**. The cloud browser could not reach the local server. Standard Chromium download failed; an alternate packaged Chromium failed during graphics initialization. No viewport screenshots or browser interaction results are claimed. Earlier historical browser checks are not evidence for this branch.

All data remains synthetic. Reporting is intentionally anchored to October 23, 2026 (May–October delivery; upcoming planning in 2027). Local edits can change the initial story; use a clean profile for the presentation baseline. Changes are browser-local, with no authentication, shared server storage or live integrations. Forecasts are indicative, not financial commitments. Supplied logo assets are configured with a load-error text fallback; in-browser visual verification remains outstanding. A full accessibility audit remains outstanding.

## After merge

A push to main automatically runs the Pages workflow. Wait for successful build and deploy jobs, then perform the Pages checks above. Manual fallback: Actions → Deploy prototype to GitHub Pages → Run workflow → **main**. Do not run deployment from this feature branch.
