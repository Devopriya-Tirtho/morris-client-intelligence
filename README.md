# Morris Interactive Client Intelligence Portal

A high-fidelity, client-facing React prototype tailored to Zagimē Anishinabēk. All projects, hours, narratives, people and contact details are synthetic. Existing work order formats are used only as demonstration identifiers. The type-based co-branding is illustrative, not an official logo reproduction.

## Run locally

Requires Node.js 22+ and npm.

```bash
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The overview opens at `/#/`. The mock landing and role selection screen is at `/#/welcome`. Use the header role selector to switch between Client View and Morris Internal. No login credentials are needed. Presentation Mode switches to client data, hides navigation and editing tools, and guides a four-step walkthrough; exiting restores the original role. Escape exits presentation mode.

## Included experiences

- Executive overview: hours, active umbrella/sub-project counts, upcoming projects, forecast hours remaining, health, effort trends, service mix, priorities, value highlights and manager updates.
- Portfolio: umbrella contracts with nested work orders. Project cards and a searchable/filterable table.
- Project detail: aggregate/direct hours, cap and monthly cap, forecast, completion, dates, milestones, narrative, issues, decisions and project contacts.
- Internal project editor: create or update projects, attach a future WO, group scoped work, assign categories/teams/PM, maintain dates/caps/progress, visibility, milestones and protected notes.
- Time allocation review: assign project/category independently of original imported time. Approved and unapproved current hours are labelled.
- Team: contact editing, identity aliases, ownership and allocated effort. Duplicate external IDs are rejected.
- Categories: ten initial service lines plus category creation and project filtering.
- Upcoming pipeline: two initial planned projects with no work order. Their stable IDs and manual metadata survive attachment of a work order.
- Content controls: project visibility, draft/public narratives, conceptual manual-field protection.
- Insights studio: narrative editing, outcomes, decisions, next steps and publication state.
- Forecast and timeline: cap comparison, health distribution, target windows, timeline watch and delivery actions.
- Responsive desktop-first layout, keyboard-labelled controls, reduced-motion support, animated routing and presentation walkthrough.

## Architecture

```
src/
  domain/types.ts          Strongly typed domain and repository interfaces
  domain/analytics.ts      Pure rollups, forecast, visibility and external merge policy
  domain/analytics.test.ts Business-invariant tests
  data/seed.ts             Deterministic synthetic portfolio (as of 2026-10-23)
  services/repository.ts   LocalStorage repository and disabled external adapter
  services/PortalContext.tsx Role-aware projection and local mutations
  components/             Reusable cards, KPIs, avatars and chart components
  pages/                  Modular route-level screens
  App.tsx                 HashRouter, shell, roles and presentation flow
  styles.css              Responsive visual system
```

`PortalRepository` is the persistence boundary. `LocalPortalRepository` saves the full versioned demo state in this browser under `morris-zagime-prototype-v1`. No application API requests, Firebase SDK, OAuth credentials, cloud database or server dependency are present. Font files are bundled locally. Navigation uses in-memory state; it does not reread a database. Reset Demo restores the seed after explicit confirmation.

### Ownership of fields

| Domain | Owner | Policy |
| --- | --- | --- |
| `Project.external` | Future QBO adapter | External work order/project ID and last sync marker only |
| `Project.managed` | Morris | Stable project ID, grouping, categories, scope, caps, dates, progress, assignment, visibility, milestones and internal notes |
| `Project.narrative` | Morris / client presentation | Summary, value, risks, decisions, next step, update date and publication |
| `TimeEntry.external` | Future QBO Time adapter | Immutable source person, date, hours, approval and description |
| `TimeEntry.managed` | Morris | Project/category allocation override |
| Derived analytics | Pure calculation | Recomputed, never persisted as source truth |

`applyExternalPatch` merges only the `external` namespace. It cannot overwrite Morris metadata or narratives. Connecting an upcoming project uses its stable internal ID rather than replacing the object with a new imported project.

### Analytics semantics

- Every time entry is assigned to one project. Umbrella totals include direct work plus all descendant work. Portfolio totals sum entries once, never sum parent and child totals together.
- Umbrella caps are whole-contract agreements; child caps are scoped allocations within them. Portfolio utilization divides allocated actual hours by initialized umbrella caps; upcoming caps are shown separately.
- Total effort includes approved and current unapproved hours. It does not imply billing, invoicing or approval.
- Unallocated entries are excluded from client metrics until assigned. Person attribution uses the identity map; an unknown person does not remove otherwise allocated hours from the project total.
- Service mix is calculated from time-entry category allocations, which may differ from a project's service line after a manual override.
- Active forecast = actual hours / manually reported completion. Zero-progress/planned work uses the cap; completed work uses actuals. Remaining hours = max(forecast - actual, 0). This planning model is explicit and can later be replaced behind an analytics service.
- Health = mean active item score: on track 100, attention 65, delayed 30. Counts include umbrella and scoped project items; completed/upcoming are excluded from health.
- A hidden parent hides its entire subtree and related hours. Draft narratives are redacted from the client projection. Internal notes are stripped.
- Monthly effort is the fixed May–October 2026 demo reporting window. Timeline extends through April 2027. The dates are synthetic and frozen for a repeatable presentation.

## GitHub Pages

The application is Vite with relative asset paths (`base: './'`) and hash-based routes. It works under a repository subpath without server rewrites. The included `.github/workflows/pages.yml` can deploy `dist` using GitHub Actions after the source is pushed to your chosen repository and Settings → Pages → Source is set to GitHub Actions. It supports manual dispatch; it does not deploy automatically on every code change.

No existing Morris production repository was modified. The source is also maintained in the preview hosting source repository. To use GitHub, upload the source to a new repository or an explicitly chosen prototype branch; do not put it into an existing production app without review.

## Future integration plan

1. Add real authentication and server-side tenant/role checks. The prototype role selector is demonstration UI, not authorization. All seed data exists in the downloaded browser bundle; client projection is not a security mechanism.
2. Introduce `clientId` tenancy and a reusable client branding configuration. Replace the fixed Zagimē seed with a repository selected by authorized tenant context.
3. Implement the repository against a server/API backed by Firebase. Store external records, manual overrides and client narratives separately; enforce per-client security rules and server validation.
4. Implement QBO OAuth and QBO Time ingestion server-side, with secrets outside the frontend. Use explicit source IDs, cursor/pagination handling, approval flags, idempotency and an audit trail.
5. Reconcile imported IDs to stable internal projects and people. Never derive manual caps from accounting data. Preserve `managed` and `narrative` fields; resolve conflicting allocations through the review queue.
6. Publish an approved client read model. Cache one versioned portfolio snapshot, reuse it across navigation and invalidate only on authorized updates. Do not attach per-tab live listeners.
7. Add audit history, approvals, full validation/migrations, observability, loading/retry/error recovery, accessibility review and multi-user conflict handling before production.
8. Validate brand assets and all project data with Morris and the client before using this outside a synthetic demonstration.

The attached Gemini webhook announcement is not required for this frontend prototype. If AI background jobs are introduced later, handle their signed webhook events on a server, never in GitHub Pages/browser code.

## Verification

`npm test` covers roll-up reconciliation, cap semantics, excluded unallocated entries, hidden descendants, narrative redaction, forecast edge cases, invalid parent mappings, protected sync fields, category/month reconciliation and person aliases. `npm run build` performs strict TypeScript checking and the production Vite bundle. Browser verification is recorded in `QA.md`.

## Prototype limits

Local edits are per browser, not shared between viewers. No billing, live sync, real authentication, email sending, server persistence or real customer data is implemented. Contact information intentionally uses `example.com` and fictional 555 numbers. Brand typography/wordmarks are illustrative. The app is designed for desktop with narrow-screen layouts, not a native mobile application.
