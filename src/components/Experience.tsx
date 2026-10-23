import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Info } from "lucide-react";
import { branding, brandAsset } from "../config/branding";
import { usePortal } from "../services/PortalContext";
import { analytics } from "../domain/analytics";
import {
  projectHealth,
  hierarchyLabel,
  forecastConfidence,
  type ExperienceInsight,
  type Health,
} from "../domain/experience";
import type { Project } from "../domain/types";
import { Avatar, Badge, Progress, number, date } from "./ui";
export function Partnership({ compact = false }: { compact?: boolean }) {
  const [clientFailed, setClientFailed] = useState(false);
  const [partnerFailed, setPartnerFailed] = useState(false);
  return (
    <div className={`partnership-lockup ${compact ? "compact" : ""}`}>
      <div>
        {branding.clientLogo && !clientFailed ? (
          <img
            src={brandAsset(branding.clientLogo)}
            alt={branding.clientName}
            onError={() => setClientFailed(true)}
          />
        ) : (
          <strong>{branding.clientName}</strong>
        )}
        <small>CLIENT INTELLIGENCE</small>
      </div>
      <span className="partnership-times">×</span>
      <div>
        {branding.partnerLogo && !partnerFailed ? (
          <img
            src={brandAsset(branding.partnerLogo)}
            alt={branding.partnerName}
            onError={() => setPartnerFailed(true)}
          />
        ) : (
          <span>{branding.partnerName}</span>
        )}
        <small>YOUR DELIVERY PARTNER</small>
      </div>
    </div>
  );
}
export function HealthBadge({ health }: { health: Health }) {
  return (
    <span className={`health-badge ${health.toLowerCase().replace(" ", "-")}`}>
      <i />
      {health}
    </span>
  );
}
export function Definition({ children }: { children: React.ReactNode }) {
  return (
    <details className="definition">
      <summary>
        <Info size={13} />
        How to read this
      </summary>
      <p>{children}</p>
    </details>
  );
}
function Count({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    let frame: number;
    let start: number;
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / 450);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <>{number(shown)}</>;
}
export function Stat({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: number;
  unit?: string;
  detail: string;
}) {
  return (
    <article className="executive-stat">
      <span>{label}</span>
      <strong>
        <Count value={value} />
        <small>{unit}</small>
      </strong>
      <p>{detail}</p>
    </article>
  );
}
export function Ring({
  value,
  label,
  score = false,
}: {
  value: number;
  label: string;
  score?: boolean;
}) {
  return (
    <div className="ring-wrap">
      <div
        className="premium-ring"
        role="img"
        aria-label={`${label}: ${value}${score ? " out of 100" : "%"}`}
        style={{
          background: `conic-gradient(var(--gold) ${Math.min(100, value) * 3.6}deg, #ffffff20 0)`,
        }}
      >
        <div>
          <b>
            {value}
            <small>{score ? "/100" : "%"}</small>
          </b>
        </div>
      </div>
      <span>{label}</span>
    </div>
  );
}
export function Sparkline({
  values,
  label,
}: {
  values: number[];
  label: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <svg
      className="sparkline"
      viewBox="0 0 120 32"
      role="img"
      aria-label={`${label}: ${values.join(", ")} hours`}
    >
      <polyline
        points={values
          .map((v, i) => `${i * 24},${29 - (v / max) * 26}`)
          .join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="0"
        x2="120"
        y1="31"
        y2="31"
        stroke="currentColor"
        opacity=".15"
      />
    </svg>
  );
}
export function InsightCards({
  items,
  limit = 6,
  interactive = true,
}: {
  items: ExperienceInsight[];
  limit?: number;
  interactive?: boolean;
}) {
  return (
    <div className="insight-cards">
      {items.slice(0, limit).map((item) => (
        <article className={`insight-card ${item.tone}`} key={item.id}>
          <span className="eyebrow">{item.type}</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <details>
            <summary>Why this appears</summary>
            <p>{item.rule}</p>
          </details>
          {interactive && item.projectId && (
            <Link to={`/projects/${item.projectId}`}>
              View project <ArrowUpRight size={14} />
            </Link>
          )}
        </article>
      ))}
      {items.length === 0 && (
        <p className="empty">No items to show for the shared portfolio.</p>
      )}
    </div>
  );
}
export function PremiumProjectCard({
  project: p,
  interactive = true,
}: {
  project: Project;
  interactive?: boolean;
}) {
  const { data } = usePortal();
  const a = analytics(data, p.id);
  const manager = data.people.find((x) => x.id === p.managed.managerId);
  const category = data.categories.find((c) => c.id === p.managed.categoryId);
  const parent = data.projects.find((x) => x.id === p.managed.parentId);
  const next = p.managed.milestones.find((m) => !m.done);
  return (
    <article className="premium-project">
      <div className="row between">
        <span className="eyebrow">{hierarchyLabel(data, p)}</span>
        <HealthBadge health={projectHealth(data, p)} />
      </div>
      <Link
        aria-disabled={!interactive || undefined}
        tabIndex={interactive ? undefined : -1}
        onClick={(e) => {
          if (!interactive) e.preventDefault();
        }}
        className="project-title"
        to={`/projects/${p.id}`}
      >
        <small>{p.external.workOrder || "IN PLANNING"}</small>
        <h2>{p.managed.name}</h2>
        <ArrowUpRight size={18} />
      </Link>
      <p
        className="project-category"
        style={{ borderLeftColor: category?.color }}
      >
        {category?.name}
      </p>
      {parent && (
        <Link
          aria-disabled={!interactive || undefined}
          tabIndex={interactive ? undefined : -1}
          onClick={(e) => {
            if (!interactive) e.preventDefault();
          }}
          className="parent-caption"
          to={`/projects/${parent.id}`}
        >
          Within {parent.external.workOrder} · {parent.managed.name}
        </Link>
      )}
      <div className="project-card-effort">
        <div>
          <b>{number(a.hours)}</b>
          <span> / {number(p.managed.cap)} hours</span>
        </div>
        <Sparkline
          values={a.monthly}
          label="Monthly delivery May to October 2026"
        />
      </div>
      <Progress value={a.utilization} />
      <div className="row between small-text">
        <span>{Math.round(a.utilization)}% utilized</span>
        <span>Forecast {number(a.forecast)} hrs</span>
      </div>
      <div className="project-delivery">
        <Badge status={p.managed.status} />
        <span>{p.managed.progress}% complete</span>
      </div>
      <div className="next-milestone">
        <Check size={15} />
        <span>
          <small>NEXT MILESTONE</small>
          {next?.name ||
            (p.managed.milestones.length
              ? "All recorded milestones complete"
              : "Milestones to be agreed")}
        </span>
      </div>
      <footer>
        <div className="row">
          {manager && <Avatar person={manager} small />}
          <span>{manager?.name || "Contact not shared"}</span>
        </div>
        <time dateTime={p.managed.end}>{date(p.managed.end)}</time>
      </footer>
    </article>
  );
}
export function Confidence({
  project,
  hours,
}: {
  project: Project;
  hours: number;
}) {
  const c = forecastConfidence(project, hours);
  return (
    <div className="confidence">
      <span>FORECAST BASIS</span>
      <strong>{c.label}</strong>
      <p>{c.detail}</p>
    </div>
  );
}
