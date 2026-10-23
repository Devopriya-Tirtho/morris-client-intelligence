import { newId } from "../domain/id";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Flag,
  CheckCircle2,
  Plus,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { usePortal } from "../services/PortalContext";
import { portfolio, analytics } from "../domain/analytics";
import {
  PageTitle,
  Card,
  Progress,
  Badge,
  Avatar,
  number,
  date,
  ProjectCard,
} from "../components/ui";
import { ForecastChart } from "../components/Charts";
export function Forecast() {
  const { data } = usePortal();
  const p = portfolio(data);
  const watch = p.active.filter((x) => x.managed.status !== "On track");
  const start = Date.parse("2026-05-01"),
    end = Date.parse("2027-04-30");
  const position = (d: string) =>
    Math.max(0, Math.min(100, ((Date.parse(d) - start) / (end - start)) * 100));
  return (
    <>
      <PageTitle
        title="Looking ahead, together"
        description="See delivery horizons, capacity and the decisions that keep work moving."
      />
      <div className="detail-grid">
        <Card title="Forecast versus agreed hours" eyebrow="CAPACITY OUTLOOK">
          <ForecastChart />
          <p className="footnote">
            Umbrella caps cover their child projects. Forecast uses a Morris
            override when supplied, otherwise actual hours ÷ manual progress;
            completed projects use actuals. Upcoming projects are excluded here.
          </p>
        </Card>
        <Card title="The portfolio pulse" eyebrow="PROJECT HEALTH">
          <div className="health-summary">
            {(
              [
                "On track",
                "Attention",
                "Delayed",
                "Completed",
                "Upcoming",
              ] as const
            ).map((s) => (
              <div key={s}>
                <Badge status={s} />
                <strong>
                  {data.projects.filter((x) => x.managed.status === s).length}
                </strong>
              </div>
            ))}
          </div>
          <p className="footnote">
            Health index: average of active project scores (on track 100,
            attention 65, delayed 30). Counts include umbrella and sub-project
            items.
          </p>
          <div className="value-note">
            {number(p.remaining)} hours estimated to finish active contracts
          </div>
        </Card>
      </div>
      <Card
        title="Your shared delivery horizon"
        eyebrow="MAY 2026 — APRIL 2027"
      >
        <div className="timeline-scroll">
          <div className="timeline">
            <div className="timeline-head">
              <span>PROJECT / WORK ORDER</span>
              <div>
                {[
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                ].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
            {data.projects.map((x) => (
              <div className="timeline-row" key={x.id}>
                <Link to={`/projects/${x.id}`}>
                  <small>{x.external.workOrder || "Upcoming"}</small>
                  {x.managed.name}
                </Link>
                <div className="timeline-track">
                  <div
                    className={`timeline-bar ${x.managed.status.toLowerCase().replace(" ", "-")}`}
                    style={{
                      left: `${position(x.managed.start)}%`,
                      width: `${Math.max(1, position(x.managed.end) - position(x.managed.start))}%`,
                    }}
                    title={`${date(x.managed.start)} to ${date(x.managed.end)}`}
                  >
                    <span style={{ width: `${x.managed.progress}%` }} />
                  </div>
                  <i
                    className="today-line"
                    style={{ left: `${position("2026-10-23")}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="footnote">
          Vertical marker: October 23, 2026 · Dates are manually maintained
          target windows.
        </p>
      </Card>
      <div className="section-title">
        <h2>Timeline watch</h2>
        <span className="muted">{watch.length} items need a conversation</span>
      </div>
      <div className="project-grid">
        {watch.map((x) => (
          <Card
            key={x.id}
            title={x.managed.name}
            eyebrow={x.external.workOrder || "UPCOMING"}
          >
            <div className="risk-box">
              <Flag size={18} />
              <p>{x.narrative.risk}</p>
            </div>
            <p>{x.narrative.nextStep}</p>
            <Link className="text-link" to={`/projects/${x.id}`}>
              Review project <ArrowUpRight size={16} />
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
export function ContentControls() {
  const { data, update } = usePortal();
  return (
    <>
      <PageTitle
        title="A considered client experience"
        description="Choose what is shared. Hidden umbrella projects also hide their sub-projects and hours."
      />
      <div className="protected-note">
        <ShieldCheck size={18} />
        Visibility is applied before client metrics are calculated. This demo’s
        role switcher is not a security boundary.
      </div>
      <Card>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client visibility</th>
                <th>Narrative</th>
                <th>Manual field protection</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.managed.name}</strong>
                    <small>
                      {p.external.workOrder || "Upcoming"}
                      {p.managed.parentId ? " · Child project" : ""}
                    </small>
                  </td>
                  <td>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={p.managed.visible}
                        onChange={() =>
                          update((d) => ({
                            ...d,
                            projects: d.projects.map((x) =>
                              x.id === p.id
                                ? {
                                    ...x,
                                    managed: {
                                      ...x.managed,
                                      visible: !x.managed.visible,
                                    },
                                  }
                                : x,
                            ),
                          }))
                        }
                      />
                      {p.managed.visible ? "Shared" : "Hidden"}
                    </label>
                  </td>
                  <td>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={p.narrative.published}
                        onChange={() =>
                          update((d) => ({
                            ...d,
                            projects: d.projects.map((x) =>
                              x.id === p.id
                                ? {
                                    ...x,
                                    narrative: {
                                      ...x.narrative,
                                      published: !x.narrative.published,
                                    },
                                  }
                                : x,
                            ),
                          }))
                        }
                      />
                      {p.narrative.published ? "Published" : "Draft"}
                    </label>
                  </td>
                  <td>
                    <span className="protected-pill">
                      <ShieldCheck size={13} />
                      Protected
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
export function TimeReview() {
  const { data, update } = usePortal();
  const [filter, setFilter] = useState("unmapped");
  const [allocations, setAllocations] = useState<
    Record<string, { projectId: string; categoryId: string }>
  >({});
  const entries = data.entries.filter(
    (t) => filter === "all" || !t.managed.projectId,
  );
  return (
    <>
      <PageTitle
        title="Every hour, in the right place"
        description="Review time allocation while keeping source time entries intact. Unallocated hours are excluded from client analytics."
      />
      <div className="ownership-strip">
        <span>RAW SOURCE ASSIGNMENT · READ ONLY</span>
        <span>MORRIS REPORTING ALLOCATION · EDITABLE</span>
      </div>
      <div className="portfolio-summary">
        <div>
          <span>Unallocated entries</span>
          <b>{data.entries.filter((t) => !t.managed.projectId).length}</b>
        </div>
        <div>
          <span>Hours awaiting allocation</span>
          <b>
            {number(
              data.entries
                .filter((t) => !t.managed.projectId)
                .reduce((a, t) => a + t.external.hours, 0),
            )}
          </b>
        </div>
        <div>
          <span>Approval status</span>
          <b className="small-value">Approved + current</b>
        </div>
      </div>
      <div className="filter-bar">
        <select
          aria-label="Time entry filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="unmapped">Needs allocation</option>
          <option value="all">All time entries</option>
        </select>
        <span className="muted small-text">
          Manual allocations are protected from future syncs.
        </span>
      </div>
      <Card>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mock QBO Time · source</th>
                <th>Consultant / approval</th>
                <th>Raw work order</th>
                <th>Hours</th>
                <th>Morris reporting project</th>
                <th>Morris service area</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((t) => {
                const a = allocations[t.id] || {
                  projectId: t.managed.projectId || "",
                  categoryId: t.managed.categoryId || "",
                };
                const person = data.people.find((p) =>
                  p.qboIds.includes(t.external.personId),
                );
                return (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.external.description}</strong>
                      <small>{date(t.external.date)}</small>
                    </td>
                    <td>
                      {person?.name || t.external.personId}
                      <small>
                        {t.external.approved
                          ? "Approved"
                          : "Current · unapproved"}
                      </small>
                    </td>
                    <td>
                      <span className="source-chip">
                        {t.external.workOrder || "Not supplied"}
                      </span>
                    </td>
                    <td>{t.external.hours}</td>
                    <td>
                      <select
                        aria-label={`Project for ${t.id}`}
                        value={a.projectId}
                        onChange={(e) =>
                          setAllocations({
                            ...allocations,
                            [t.id]: {
                              projectId: e.target.value,
                              categoryId:
                                data.projects.find(
                                  (p) => p.id === e.target.value,
                                )?.managed.categoryId || "",
                            },
                          })
                        }
                      >
                        <option value="">Unallocated</option>
                        {data.projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.external.workOrder || "Upcoming"} ·{" "}
                            {p.managed.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`Category for ${t.id}`}
                        value={a.categoryId}
                        onChange={(e) =>
                          setAllocations({
                            ...allocations,
                            [t.id]: { ...a, categoryId: e.target.value },
                          })
                        }
                      >
                        <option value="">Select category</option>
                        {data.categories
                          .filter((c) => !c.archived)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="button"
                        disabled={!a.projectId || !a.categoryId}
                        onClick={() =>
                          update((d) => ({
                            ...d,
                            entries: d.entries.map((x) =>
                              x.id === t.id ? { ...x, managed: a } : x,
                            ),
                          }))
                        }
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!entries.length && (
            <div className="empty">
              <CheckCircle2 />
              <p>All time entries have been allocated.</p>
            </div>
          )}
        </div>
      </Card>
      <p className="footnote">
        This prototype includes unapproved current hours in total effort. These
        are planning hours, not invoiced or billable amounts.
      </p>
    </>
  );
}
