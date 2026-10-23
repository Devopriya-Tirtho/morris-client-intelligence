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

The overview opens at `/#/`. The mock landing and role selection screen is at `/#/welcome`. Use the header role selector to switch between Client View and Morris Internal. No login credentials are needed. Presentation Mode switches to client data, hides navigation and editing tools, and guides a ten-chapter walkthrough; exiting restores the original role. Left/Right arrows move between chapters; Escape exits and restores the previous demo role. A direct refresh starts safely in client mode.

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
  domain/types.ts               Entities, ownership namespaces and derived view schemas
  domain/analytics.ts           Existing rollups and client projection
  domain/metrics.ts             Hours, burn, delay, forecast and health helpers
  domain/intelligence.ts        Grouped work orders and attention items
  domain/ownership.ts           Allowlisted external-only merge functions
  domain/validation.ts          Shared command validation
  repositories/PortalRepository.ts  Persistence interface
  adapters/mock/                LocalStorage and isolated memory repositories
  adapters/future/              Disabled QBO, QBO Time and Firebase placeholders
  services/PortalService.ts     Cached reads and serialized, validated commands
  services/repository.ts        Mock-only composition root and compatibility exports
  services/PortalContext.tsx    React state, role projection and save feedback
  data/seed.ts                  Deterministic synthetic portfolio (2026-10-23)
  components/ and pages/        Existing reusable UI and route-level screens
```

The UI now calls `PortalService`, which depends on `PortalRepository`. The service loads one snapshot per session, clones returned data, and serializes commands against the latest state. It validates before persisting and publishes state only after a successful save. A failed save leaves the previous snapshot intact and does not block later commands. This queue is local to the service instance; it is not multi-user or cross-tab concurrency control.

`LocalPortalRepository` retains the existing `morris-zagime-prototype-v1` key and version. Existing saved projects, narratives, people and allocations remain intact; the new optional client context receives an additive default. The memory adapter supports isolated tests without browser globals. Invalid JSON falls back to seed data, while structurally invalid domain records produce a load error rather than being silently published.

No application API requests, Firebase SDK, OAuth credentials, cloud database or server dependency are present. Fonts are bundled locally. Reset Demo restores seed data after the existing confirmation dialog.

### Service operations

| Operation | Behavior |
| --- | --- |
| `fetchPortfolioData(role)` / `fetchPortfolio(role)` | Cached mock data, rollups and generated attention items; default client projection |
| `fetchGroupedWorkOrders(role)` | Umbrella, descendants, linked work orders and reconciled analytics |
| `fetchProjectDetail(id, role)` | Project, analytics, forecast, milestones, risks and decisions |
| `fetchTeamMappings(role)` | Internal-only identity mapping view |
| `fetchClientViewSettings(role)` | Internal visibility/publication settings |
| `saveInternalEdits(role, id, patch)` | Changes only Morris-managed project metadata |
| `saveNarrativeUpdate(role, update)` | Changes only narrative content |
| `toggleClientVisibility(role, id, visible)` | Applies parent/subtree visibility before client calculations |
| `createUpcomingProject(role, project)` | Creates a stable, uninitialized project |
| `attachWorkOrder(role, id, workOrder)` | Attaches a synthetic future external reference without replacing manual data or status |
| `editWorkspace(role, edit)` | Compatibility command used by existing editors; protects imported time and source project IDs |
| `reset(role)` | Restores the original mock state |

All writes require the demo admin role and validate grouping, references, dates, caps, progress, identity uniqueness and work-order uniqueness. These checks are application invariants, **not authentication**. Legacy editors can still maintain manual work-order labels; imported QBO IDs and sync timestamps are read-only there. Project creation waits for persistence before closing/navigating.

`Client`, `WorkOrder`, `ProjectGroup`, `Project`, `ProjectCategory`, `TeamMember`, `TeamMemberIdentityMap`, `TimeEntry`, `PortfolioInsight`, `ProjectNarrativeUpdate`, `ForecastRecord`, `Milestone`, `RiskIssue`, `DecisionItem`, `UpcomingProject` and `ClientViewSetting` have named TypeScript contracts. Groups, identities, risks, decisions and visibility settings are views of the existing canonical fields, avoiding duplicate mutable copies. Narrative updates represent the current content, not an audit history. Existing `Person` and `Category` names remain compatibility aliases.

### Ownership of fields

| Domain | Owner | Policy |
| --- | --- | --- |
| `Project.external` | Future QBO adapter | External work order/project ID and last sync marker only |
| `Project.managed` | Morris | Stable project ID, grouping, categories, scope, caps, dates, progress, assignment, visibility, milestones and internal notes |
| `Project.narrative` | Morris / client presentation | Summary, value, risks, decisions, next step, update date and publication |
| `TimeEntry.external` | Future QBO Time adapter | Immutable source person, date, hours, approval and description |
| `TimeEntry.managed` | Morris | Project/category allocation override |
| Derived analytics | Pure calculation | Recomputed, never persisted as source truth |

`applyExternalPatch` and `applyExternalTimePatch` copy only explicitly allowed external fields, including when incoming objects contain unexpected runtime properties. It cannot overwrite Morris metadata or narratives. Connecting an upcoming project uses its stable internal ID rather than replacing the object with a new imported project.

### Analytics semantics

- Every time entry is assigned to one project. Umbrella totals include direct work plus all descendant work. Portfolio totals sum entries once, never sum parent and child totals together.
- Umbrella caps are whole-contract agreements; child caps are scoped allocations within them. Portfolio utilization divides allocated actual hours by initialized umbrella caps; upcoming caps are shown separately.
- Total effort includes approved and current unapproved hours. It does not imply billing, invoicing or approval.
- Unallocated entries are excluded from client metrics until assigned. Person attribution uses the identity map; an unknown person does not remove otherwise allocated hours from the project total.
- Service mix is calculated from time-entry category allocations, which may differ from a project's service line after a manual override.
- Active forecast = actual hours / manually reported completion. Optional Morris-owned `managed.forecastOverride` supplies hours plus a required reason; it cannot forecast below actual hours. Completed actuals take precedence over overrides. Zero-progress/planned work uses the cap; completed work uses actuals. Remaining hours = max(forecast - actual, 0). This planning model is explicit and can later be replaced behind an analytics service.
- Health = mean active item score: on track 100, attention 65, delayed 30. Counts include umbrella and scoped project items; completed/upcoming are excluded from health.
- A hidden parent hides its entire subtree and related hours. Draft narratives are redacted from the client projection. Internal notes are stripped.
- `forecastRecord` additionally estimates completion from observed hours per elapsed calendar day. It returns no date for completed/upcoming work or absent pace. This is a planning estimate, not a committed date.
- `isDelayed` detects explicit delays and overdue unfinished active projects as of an injected date. Attention items cover delays, forecast-over-cap, published risks and decisions. The existing UI status badges and health scoring remain based on manually maintained status.
- Monthly effort is the fixed May–October 2026 demo reporting window. Timeline extends through April 2027. The dates are synthetic and frozen for a repeatable presentation.

## GitHub Pages

The application is Vite with relative asset paths (`base: './'`) and hash-based routes. It works under a repository subpath without server rewrites. The included `.github/workflows/pages.yml` can deploy `dist` using GitHub Actions after the source is pushed to your chosen repository and Settings → Pages → Source is set to GitHub Actions. It deploys successful pushes to main and supports manual dispatch on main. Feature branches do not deploy.

This refinement targets the existing `Devopriya-Tirtho/morris-client-intelligence` repository on `codex/final-presentation-qa-polish`. The Pages workflow now supports automatic main-branch deployment and manual dispatch. No deployment is part of this change.

## Future integration plan

1. Add real authentication and server-side tenant/role checks. The prototype role selector is demonstration UI, not authorization. All seed data exists in the downloaded browser bundle; client projection is not a security mechanism.
2. Extend the single mock `Client` context into enforced `clientId` tenancy and reusable branding. Replace the fixed Zagimē seed with a repository selected by authorized tenant context.
3. Implement the repository against a server/API backed by Firebase. Store external records, manual overrides and client narratives separately; enforce per-client security rules and server validation.
4. Implement QBO OAuth and QBO Time ingestion server-side, with secrets outside the frontend. Use explicit source IDs, cursor/pagination handling, approval flags, idempotency and an audit trail.
5. Reconcile imported IDs to stable internal projects and people. Never derive manual caps from accounting data. Preserve `managed` and `narrative` fields; resolve conflicting allocations through the review queue.
6. Publish an approved client read model. Cache one versioned portfolio snapshot, reuse it across navigation and invalidate only on authorized updates. Do not attach per-tab live listeners.
7. Add audit history, approvals, full validation/migrations, observability, loading/retry/error recovery, accessibility review and multi-user conflict handling before production.
8. Validate brand assets and all project data with Morris and the client before using this outside a synthetic demonstration.

The attached Gemini webhook announcement is not required for this frontend prototype. If AI background jobs are introduced later, handle their signed webhook events on a server, never in GitHub Pages/browser code.

## Verification

`npm test` runs all 44 domain, service and server-render smoke tests, preserving all 30 architecture-baseline tests. Coverage includes cached reads, queued writes, storage failure recovery, legacy saves, guarded attachment, disabled adapters, ownership allowlists, and roll-up reconciliation, cap semantics, excluded unallocated entries, hidden descendants, narrative redaction, forecast edge cases, invalid parent mappings, protected sync fields, category/month reconciliation and person aliases. `npm run build` performs strict TypeScript checking and the production Vite bundle. Browser verification is recorded in `QA.md`.

## Prototype limits

Local edits are per browser, not shared between viewers. No billing, live sync, real authentication, email sending, server persistence or real customer data is implemented. Contact information intentionally uses `example.com` and fictional 555 numbers. Brand typography/wordmarks are illustrative. The app is designed for desktop with narrow-screen layouts, not a native mobile application.

### Remaining architecture limits

The new integration classes deliberately throw before doing any work. Their contracts are design seams, not working connectors or a complete import/reconciliation engine. Before implementing them, add server authorization, runtime API schemas, source-ID reconciliation, migrations, conflict handling, and audit history. No external data is automatically created, attached or synchronized. Forecast overrides now have internal editor controls. Forecast basis, projected completion and deterministic insight cards are surfaced in the client experience. The client name and chart reporting window remain tailored to this demo.


## Premium client experience

The client overview leads with the Zagimē identity, then the partnership health, delivery effort and current focus. It includes accomplishments, next work, service mix, project-lead updates and attention cards. Morris Internal opens a different operational composition: unallocated time, draft/hidden records, action queues and configuration shortcuts. The persistent demonstration label is visible in both modes and in presentations.

The project registry supports card/table layouts; name, work-order, hours, utilization and target-date sorting; category/status/health/manager/parent/lifecycle filters; internal visibility filtering; and parent/category grouping. Cards identify umbrella, child, standalone and uninitialized work explicitly. Parent totals include child hours; **do not sum every card**. Project details combine purpose, pace, forecast basis, milestones, narrative, decisions, team and parent/child contribution.

### Presentation chapters

Open `/#/presentation/1` or choose **Present partnership**. The ten chapters are:
1. Partnership at a Glance
2. Our Journey Together
3. Portfolio Overview
4. Where Effort Is Being Invested
5. Delivery Progress
6. Achievements
7. Attention & Decisions
8. Upcoming Work
9. Team & Contacts
10. Next Steps

All chapters read the same client-projected snapshot. No separate presentation data is maintained. Previous/Next, the chapter selector, Left/Right arrows and Escape support navigation. Links on presentation project/insight cards do not leave the walkthrough. Operational navigation and edit controls are absent. Milestone achievements are cumulative manually reported counts; the monthly journey reflects actual recorded effort, not historical status snapshots.

### Category lifecycle

Categories retain stable IDs. The internal manager supports name, description, curated icon, accent colour, ordering, default selection, archive/merge and restore. Archiving an assigned/default category requires a destination: both project category IDs and reporting-time allocations move together, without changing source time. A default transfers to the destination. Restoring a category does not undo prior reassignment. Duplicate active names and direct archival with remaining assignments are rejected by shared validation. Existing browser saves receive optional presentation defaults without replacing authored fields.

### Team and time ownership

Contact cards expose display name, role, expertise, project role and fictional contact details. Internal profiles have a client visibility flag and multiple source identity aliases. Hidden people are omitted from client directories; their recorded project hours remain counted. Unshared managers display a neutral fallback. Source time includes an optional raw work-order label, displayed separately from editable Morris reporting allocation. Legacy records without that source field display **Not supplied**, rather than inventing history from current reporting allocation.

Attaching a work-order label through the project editor retains the project ID, description, grouping, caps, team, milestones, notes and narrative. An Upcoming record becomes On track when attached unless the editor explicitly selects another status. This remains a mock identity change, not an import or sync.

### Insight rules and definitions

`src/domain/experience.ts` contains deterministic, tested rules. Utilization below 85% is within plan, 85–100% approaches cap, and above 100% exceeds cap. Health is Planned/Complete for those lifecycle states; active work is At risk for delayed/overdue status or actual effort over cap, Watch for attention/forecast over cap or ≥85% utilization, otherwise Healthy. This derived badge is intentionally separate from the manually maintained status and original portfolio health index.

Insight cards show their rule in **Why this appears**. Forecast confidence is descriptive evidence (actual delivered, manager estimate, indicative, limited evidence), not an invented probability. Raw approvals are preserved; total effort includes current unapproved hours. No live AI is used.

### Branding assets

- `public/branding/zagime/`: approved client logo or optional hero asset.
- `public/branding/morris/`: approved service-partner logo.
- `src/config/branding.ts`: set relative asset paths in `clientLogo`, `partnerLogo`, and optional `heroImage`.

No official logos were provided. Text placeholders are intentional; no logos or cultural graphics were invented. `brandAsset` prefixes the Vite base path so approved replacements work under the GitHub Pages repository subpath.

### Local review without deployment

```bash
git fetch origin
git switch --track origin/codex/final-presentation-qa-polish
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

If the branch already exists locally, use `git switch codex/final-presentation-qa-polish`. Open the local address printed by Vite, then test `/#/`, `/#/projects`, `/#/categories`, `/#/projects/p1` and `/#/presentation/1`. To compare clean seed data without losing saved edits, use a separate browser profile/incognito window. No Pages workflow needs to run for this review.

### Performance and accessibility

Client projection and portfolio/filter calculations are memoized where useful. Charts and motion are split into separate vendor bundles; no application dependency was added. Count-up, route/chart transitions and hover effects respect reduced motion. Drawers contain keyboard focus, support Escape/cancel and return focus on close; page navigation includes a skip link. Charts provide text alternatives, legends and definitions, and tables scroll within their containers. These are implemented affordances; a full accessibility and responsive visual audit is still required.

### Final presentation polish

Start over returns to chapter 1 without changing saved data. Finish review and Exit presentation return to the overview and restore the entry role. Left/Right move between chapters; Home/End go to the first/last chapter; Escape exits. Chapter changes reset scroll and focus the heading. Longer chapters scroll naturally above the fixed navigation.

Approved logo assets retain their aspect ratio and fall back to the text identity if loading fails. No official logo files are currently included. The active health index is shown as a score out of 100; milestone completion remains a percentage.

### Deployment after merge

The Pages workflow runs automatically on pushes to main, including a merged PR. It retains manual **Actions → Deploy prototype to GitHub Pages → Run workflow → main**. Both paths run npm ci, npm test and npm run build before deployment. A main-branch guard skips builds/deployment for manual runs on other branches.

After merging, wait for both build and deploy jobs to succeed, then check the existing Pages URL and refresh a project and presentation hash route. No deployment is required to review this branch locally. See QA.md for verified evidence and outstanding presentation acceptance checks.
