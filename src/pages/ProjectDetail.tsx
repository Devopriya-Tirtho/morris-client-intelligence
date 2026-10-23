import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil, Check, Flag, ArrowUpRight } from "lucide-react";
import { usePortal } from "../services/PortalContext";
import { analytics } from "../domain/analytics";
import {
  projectHealth,
  projectForecast,
  hierarchyLabel,
} from "../domain/experience";
import { AS_OF } from "../data/seed";
import { Card, Avatar, Progress, Badge, date, number } from "../components/ui";
import {
  Stat,
  HealthBadge,
  Confidence,
  PremiumProjectCard,
  Definition,
} from "../components/Experience";
import { BurnChart } from "../components/Charts";
import { Contribution } from "../components/PortfolioVisuals";
import { ProjectEditor } from "./ProjectEditor";
export { NewProject } from "./ProjectEditor";
export function ProjectDetail() {
  const { id } = useParams();
  const { data, role } = usePortal();
  const [editing, setEditing] = useState(false);
  const p = data.projects.find((x) => x.id === id);
  if (!p)
    return (
      <Card>
        <h1>Project unavailable</h1>
        <p>This record may not be shared with the client.</p>
        <Link to="/projects">Return to projects</Link>
      </Card>
    );
  const a = analytics(data, p.id);
  const forecast = projectForecast(data, p);
  const pm = data.people.find((t) => t.id === p.managed.managerId);
  const parent = data.projects.find((x) => x.id === p.managed.parentId);
  const category = data.categories.find((c) => c.id === p.managed.categoryId);
  const children = data.projects.filter((x) => x.managed.parentId === p.id);
  const next = p.managed.milestones.find((m) => !m.done);
  const team = data.people.filter(
    (t) => p.managed.teamIds.includes(t.id) || t.id === p.managed.managerId,
  );
  const completed = p.managed.milestones.filter((m) => m.done);
  const length = Math.max(
    1,
    Date.parse(p.managed.end) - Date.parse(p.managed.start),
  );
  const point = Math.max(
    0,
    Math.min(
      100,
      ((Date.parse(AS_OF) - Date.parse(p.managed.start)) / length) * 100,
    ),
  );
  return (
    <>
      <section className="project-hero">
        <div className="row between">
          <span className="eyebrow">
            {hierarchyLabel(data, p)} · {p.external.workOrder || "IN PLANNING"}
          </span>
          <HealthBadge health={projectHealth(data, p)} />
        </div>
        <h1>{p.managed.name}</h1>
        <p>{category?.name}</p>
        {parent && (
          <Link className="parent-caption" to={`/projects/${parent.id}`}>
            Within {parent.external.workOrder} · {parent.managed.name}{" "}
            <ArrowUpRight size={14} />
          </Link>
        )}
        <div className="project-hero-bottom">
          <div>
            <span>PROJECT MANAGER</span>
            <strong>{pm?.name || "Contact not shared"}</strong>
          </div>
          <div>
            <span>START</span>
            <strong>{date(p.managed.start)}</strong>
          </div>
          <div>
            <span>TARGET</span>
            <strong>{date(p.managed.end)}</strong>
          </div>
          <div>
            <span>REPORTED PROGRESS</span>
            <strong>{p.managed.progress}%</strong>
          </div>
          <Badge status={p.managed.status} />
          {role === "admin" && (
            <button className="button primary" onClick={() => setEditing(true)}>
              <Pencil size={15} />
              Edit project
            </button>
          )}
        </div>
      </section>
      <div className="executive-stats">
        <Stat
          label="EFFORT INVESTED"
          value={a.hours}
          unit="hrs"
          detail={
            children.length
              ? "Direct + scoped sub-project effort"
              : "Direct project time"
          }
        />
        <Stat
          label="CAPPED / PLANNED"
          value={p.managed.cap}
          unit="hrs"
          detail={`${number(p.managed.monthlyCap)} hours monthly cap`}
        />
        <Stat
          label="UTILIZATION"
          value={Math.round(a.utilization)}
          unit="%"
          detail={`${number(Math.max(0, p.managed.cap - a.hours))} hours remaining within cap`}
        />
        <Stat
          label="PROJECTED TOTAL"
          value={a.forecast}
          unit="hrs"
          detail={`${number(a.remaining)} hours estimated to finish`}
        />
      </div>
      <div className="executive-columns">
        <Card title="A clear purpose" eyebrow="WHAT & WHY">
          <p className="purpose-text">{p.managed.description}</p>
          <div className="purpose-value">
            <span>CLIENT VALUE</span>
            <p>
              {p.narrative.value ||
                "The project lead will share the intended outcomes here."}
            </p>
          </div>
          <div className="owner-inline">
            {pm && <Avatar person={pm} />}
            <div>
              <strong>{pm?.name || "Project lead"}</strong>
              <span>
                {pm?.role || "Contact details will be shared when available."}
              </span>
            </div>
          </div>
        </Card>
        <Card title="Effort & delivery pace" eyebrow="ACTUAL VS PLAN">
          <BurnChart projectId={p.id} />
          <div className="row between">
            <span>{number(a.monthly[5])} hours in October</span>
            <span>{number(p.managed.monthlyCap)} monthly cap</span>
          </div>
          {a.monthly[5] > p.managed.monthlyCap && (
            <p className="warning-text">
              October effort exceeds the monthly cap by{" "}
              {number(a.monthly[5] - p.managed.monthlyCap)} hours.
            </p>
          )}
          <Confidence project={p} hours={a.hours} />
        </Card>
      </div>
      <Card title="From alignment to delivery" eyebrow="TIMELINE & MILESTONES">
        <div className="delivery-timeline">
          <div className="row between">
            <span>{date(p.managed.start)}</span>
            <span>Target {date(p.managed.end)}</span>
          </div>
          <div className="delivery-track">
            <span style={{ width: `${p.managed.progress}%` }} />
            <i
              style={{ left: `${point}%` }}
              title={`Reporting date ${AS_OF}`}
            />
          </div>
          <p>
            Reporting point: {date(AS_OF)} ·{" "}
            {forecast.estimatedCompletion
              ? `Pace-based estimate: ${date(forecast.estimatedCompletion)}`
              : "Pace-based date not available"}
          </p>
        </div>
        <div className="milestone-ladder">
          {p.managed.milestones.map((m, i) => (
            <div key={m.id} className={m.done ? "done" : ""}>
              <span>
                {m.done ? <Check size={16} /> : String(i + 1).padStart(2, "0")}
              </span>
              <h3>{m.name}</h3>
              <small>
                {m.done
                  ? "Completed"
                  : m.targetDate
                    ? date(m.targetDate)
                    : "Ahead · date to be agreed"}
              </small>
            </div>
          ))}
        </div>
        {!p.managed.milestones.length && <p>No milestones recorded yet.</p>}
        <Definition>
          Dates are manually maintained targets. The completion estimate
          extrapolates recorded hours per elapsed calendar day; it is not a
          delivery commitment. No date is estimated without observed pace.
        </Definition>
      </Card>
      <div className="executive-columns">
        <Card
          title="The project lead’s perspective"
          eyebrow="PROJECT MANAGER UPDATE"
        >
          <blockquote>
            {p.narrative.summary || "An update will be shared soon."}
          </blockquote>
          <p className="small-text">
            {pm?.name || "Project lead"} ·{" "}
            {p.narrative.updatedAt || "Not published"}
          </p>
          <div className="narrative-section">
            <span>CURRENT FOCUS</span>
            <p>
              {next
                ? `Working toward ${next.name.toLowerCase()}.`
                : p.managed.milestones.length
                  ? "All recorded milestones are complete."
                  : "Agree the next delivery milestones with your project lead."}
            </p>
          </div>
          <div className="narrative-section">
            <span>NEXT STEPS</span>
            <p>
              {p.narrative.nextStep ||
                "The next step will be confirmed with the project lead."}
            </p>
          </div>
        </Card>
        <Card title="Progress made tangible" eyebrow="ACCOMPLISHMENTS">
          <div className="completion-counter">
            {completed.length}
            <small> of {p.managed.milestones.length} milestones complete</small>
          </div>
          <Progress
            value={
              p.managed.milestones.length
                ? (completed.length / p.managed.milestones.length) * 100
                : 0
            }
          />
          <ul className="delivery-list">
            {completed.map((m) => (
              <li key={m.id}>
                <Check size={16} />
                <b>{m.name}</b>
              </li>
            ))}
          </ul>
          {!completed.length && (
            <p>
              Milestones are ahead of us. This area will reflect reported
              completion.
            </p>
          )}
          <p>{p.narrative.value}</p>
        </Card>
      </div>
      <div className="executive-columns">
        <Card title="Risks & watch items" eyebrow="WHAT TO MONITOR">
          <div className="risk-box">
            <Flag size={18} />
            <p>{p.narrative.risk || "No published risk has been recorded."}</p>
          </div>
          {a.forecast > p.managed.cap && (
            <p className="warning-text">
              Forecast exceeds capped effort by{" "}
              {number(a.forecast - p.managed.cap)} hours. Review scope and pace
              with the lead.
            </p>
          )}
        </Card>
        <Card title="Decisions that unlock progress" eyebrow="CLIENT ACTION">
          <p className="purpose-text">
            {p.narrative.decision ||
              "No published decision is currently required."}
          </p>
          <p className="small-text">
            Decision owner / coordination: {pm?.name || "Project lead"}
          </p>
        </Card>
      </div>
      {children.length > 0 && (
        <>
          <Contribution projectId={p.id} />
          <div className="section-title">
            <h2>Connected sub-projects</h2>
            <span>{children.length} scoped components</span>
          </div>
          <div className="premium-project-grid">
            {children.map((c) => (
              <PremiumProjectCard key={c.id} project={c} />
            ))}
          </div>
        </>
      )}
      <Card title="Your project team" eyebrow="WHO TO CONTACT">
        <div className="project-team-grid">
          {team.map((t) => (
            <div key={t.id}>
              <Avatar person={t} />
              <h3>{t.name}</h3>
              <span className="meta-label">
                {t.id === p.managed.managerId
                  ? "Project manager"
                  : "Delivery team"}
              </span>
              <p>{t.role}</p>
              <p>
                {t.email}
                <br />
                {t.phone}
              </p>
            </div>
          ))}
        </div>
        {!team.length && <p>Team contacts are not currently shared.</p>}
      </Card>
      {role === "admin" && (
        <Card
          title="Internal project record"
          eyebrow="MORRIS MANAGED · NEVER IN CLIENT VIEW"
        >
          <p>{p.managed.internalNotes || "No internal notes yet."}</p>
          <div className="ownership-strip">
            <span>
              Mock QBO: {p.external.qboProjectId || "Not initialized"}
            </span>
            <span>
              Client visibility: {p.managed.visible ? "Shared" : "Hidden"}
            </span>
            <span>
              Narrative: {p.narrative.published ? "Published" : "Draft"}
            </span>
          </div>
        </Card>
      )}
      {editing && (
        <ProjectEditor project={p} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
