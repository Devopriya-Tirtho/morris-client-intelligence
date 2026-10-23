import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";
import { usePortal } from "../services/PortalContext";
import { portfolio } from "../domain/analytics";
import { experienceInsights } from "../domain/experience";
import {
  Partnership,
  Stat,
  InsightCards,
  Ring,
  PremiumProjectCard,
} from "../components/Experience";
import { Card, number, Avatar } from "../components/ui";
import { BurnChart, ServiceMix, ForecastChart } from "../components/Charts";
import {
  StatusDistribution,
  TeamAllocation,
  Pacing,
} from "../components/PortfolioVisuals";
export const chapters = [
  "Partnership at a Glance",
  "Our Journey Together",
  "Portfolio Overview",
  "Where Effort Is Being Invested",
  "Delivery Progress",
  "Achievements",
  "Attention & Decisions",
  "Upcoming Work",
  "Team & Contacts",
  "Next Steps",
];
export function Presentation() {
  const { chapter } = useParams();
  const navigate = useNavigate();
  const { data, role, setRole } = usePortal();
  const previousRole = useRef(role);
  const reduced = useReducedMotion();
  const n = Math.max(
    0,
    Math.min(chapters.length - 1, Math.trunc(Number(chapter) || 1) - 1),
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, [n, role]);
  const p = useMemo(() => portfolio(data), [data]);
  const insights = useMemo(() => experienceInsights(data), [data]);
  useEffect(() => {
    setRole("client");
    return () => setRole(previousRole.current);
  }, [setRole]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/");
        return;
      }
      if (
        ["INPUT", "SELECT", "TEXTAREA"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        (e.target as HTMLElement).isContentEditable
      )
        return;
      if (e.key === "Home") {
        e.preventDefault();
        navigate("/presentation/1");
      }
      if (e.key === "End") {
        e.preventDefault();
        navigate(`/presentation/${chapters.length}`);
      }
      if (e.key === "ArrowRight" && n < chapters.length - 1) {
        e.preventDefault();
        navigate(`/presentation/${n + 2}`);
      }
      if (e.key === "ArrowLeft" && n > 0) {
        e.preventDefault();
        navigate(`/presentation/${n}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [n, navigate]);
  if (role !== "client")
    return (
      <div className="loading">Preparing the shared partnership story…</div>
    );
  const milestones = data.projects.flatMap((x) => x.managed.milestones);
  const done = milestones.filter((m) => m.done).length;
  const active = p.roots.filter(
    (x) => !["Upcoming", "Completed"].includes(x.managed.status),
  );
  const upcoming = data.projects.filter((x) => x.managed.status === "Upcoming");
  return (
    <div className="presentation-experience">
      <header>
        <Partnership compact />
        <div className="presentation-actions">
          <button
            className="button"
            onClick={() => {
              navigate("/presentation/1");
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          >
            <RotateCcw size={16} /> Start over
          </button>
          <button className="button" onClick={() => navigate("/")}>
            <X size={16} />
            Exit presentation
          </button>
        </div>
      </header>
      <div className="presentation-demo">
        DEMONSTRATION ENVIRONMENT · SYNTHETIC DATA · OCTOBER 23, 2026
      </div>
      <main id="main-content">
        <div className="chapter-heading">
          <span>PARTNERSHIP REVIEW / {String(n + 1).padStart(2, "0")}</span>
          <h1 ref={heading} tabIndex={-1}>
            {chapters[n]}
          </h1>
          <p>
            {
              [
                "A shared view of effort, progress and the next conversation.",
                "The recorded delivery journey, May through October 2026.",
                "Connected agreements. Clear ownership. One partnership.",
                "The service areas and people behind every hour.",
                "A practical view of delivery, effort and completion.",
                "Recognizing the milestones and outcomes reported so far.",
                "The conversations that protect delivery and clarify decisions.",
                "Shaping the next opportunities before work begins.",
                "The people responsible for continuity and progress.",
                "From shared understanding to practical action.",
              ][n]
            }
          </p>
        </div>
        <motion.section
          key={n}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {n === 0 && (
            <>
              <div className="presentation-hero">
                <div>
                  <span className="eyebrow">
                    ZAGIMĒ ANISHINABĒK × MORRIS INTERACTIVE
                  </span>
                  <h2>
                    Shared priorities.
                    <br />
                    Visible progress.
                  </h2>
                  <p>
                    {active.length} active umbrella agreements connecting{" "}
                    {p.mix.length} service areas.
                  </p>
                </div>
                <Ring
                  value={p.health}
                  label="Active portfolio health index"
                  score
                />
              </div>
              <div className="executive-stats">
                <Stat
                  label="HOURS DELIVERED"
                  value={p.hours}
                  unit="hrs"
                  detail="Allocated effort across the partnership"
                />
                <Stat
                  label="ACTIVE SUB-PROJECTS"
                  value={p.active.filter((x) => x.managed.parentId).length}
                  detail="Scoped work within umbrella agreements"
                />
                <Stat
                  label="UPCOMING OPPORTUNITIES"
                  value={upcoming.length}
                  detail="Planning for the next chapter"
                />
              </div>
            </>
          )}
          {n === 1 && (
            <>
              <Card title="Every month adds to the story">
                <BurnChart />
              </Card>
              <div className="journey-months">
                {p.monthly.map((m, i) => (
                  <div key={m.month}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <h3>{m.month} 2026</h3>
                    <strong>{number(m.hours)} hrs</strong>
                    <small>Recorded delivery</small>
                  </div>
                ))}
              </div>
              <p className="footnote">
                This journey reflects recorded effort, not reconstructed
                historical project status.
              </p>
            </>
          )}
          {n === 2 && (
            <div className="premium-project-grid">
              {p.roots.map((x) => (
                <PremiumProjectCard
                  interactive={false}
                  key={x.id}
                  project={x}
                />
              ))}
            </div>
          )}
          {n === 3 && (
            <>
              <div className="executive-columns">
                <Card title="Expertise across the partnership">
                  <ServiceMix />
                </Card>
                <Card title="Planned effort & forecast">
                  <ForecastChart />
                </Card>
              </div>
              <TeamAllocation />
            </>
          )}
          {n === 4 && (
            <>
              <div className="executive-columns">
                <Pacing />
                <StatusDistribution />
              </div>
              <section className="presentation-hero">
                <div>
                  <h2>{done} recorded milestones complete</h2>
                  <p>
                    Delivery progress across {data.projects.length} umbrella and
                    scoped items.
                  </p>
                </div>
                <Ring
                  value={
                    milestones.length
                      ? Math.round((done / milestones.length) * 100)
                      : 0
                  }
                  label="Milestone completion"
                />
              </section>
            </>
          )}
          {n === 5 && (
            <>
              <InsightCards
                interactive={false}
                items={insights.filter((x) =>
                  ["Positive signal", "Client value"].includes(x.type),
                )}
                limit={8}
              />
              <div className="achievement-grid">
                {data.projects
                  .filter(
                    (x) =>
                      x.managed.status !== "Upcoming" &&
                      x.narrative.published &&
                      x.narrative.value,
                  )
                  .map((x) => (
                    <Card
                      key={x.id}
                      title={x.narrative.value}
                      eyebrow={x.external.workOrder || "UPCOMING"}
                    >
                      <p>{x.narrative.summary}</p>
                      <small>Reported {x.narrative.updatedAt}</small>
                    </Card>
                  ))}
              </div>
            </>
          )}
          {n === 6 && (
            <InsightCards
              interactive={false}
              items={insights.filter((x) =>
                [
                  "Timeline watch",
                  "Needs attention",
                  "Forecast",
                  "Utilization watch",
                ].includes(x.type),
              )}
              limit={20}
            />
          )}
          {n === 7 && (
            <div className="premium-project-grid">
              {upcoming.map((x) => (
                <PremiumProjectCard
                  interactive={false}
                  project={x}
                  key={x.id}
                />
              ))}
              {!upcoming.length && (
                <Card>
                  <p>No upcoming projects are currently shared.</p>
                </Card>
              )}
            </div>
          )}
          {n === 8 && (
            <div className="directory-grid">
              {data.people.map((t) => (
                <Card key={t.id}>
                  <Avatar person={t} />
                  <h2>{t.name}</h2>
                  <p>{t.role}</p>
                  <p>{t.expertise || t.role}</p>
                  <div className="contact-lines">
                    <span>{t.email}</span>
                    <span>{t.phone}</span>
                  </div>
                  <p>
                    {
                      data.projects.filter((x) => x.managed.managerId === t.id)
                        .length
                    }{" "}
                    project items led
                  </p>
                </Card>
              ))}
            </div>
          )}
          {n === 9 && (
            <>
              <InsightCards
                interactive={false}
                items={insights.filter((x) => x.type === "Suggested next step")}
                limit={20}
              />
              <section className="partnership-value">
                <h2>
                  A clear direction.
                  <br />A shared next step.
                </h2>
                <p>
                  Use this review to confirm priorities, resolve decisions and
                  agree the next delivery milestones with your Morris project
                  leads.
                </p>
              </section>
            </>
          )}
        </motion.section>
      </main>
      <nav className="chapter-controls" aria-label="Presentation chapters">
        <button
          className="button"
          disabled={n === 0}
          onClick={() => navigate(`/presentation/${n}`)}
        >
          <ArrowLeft size={17} />
          Previous
        </button>
        <label>
          Chapter
          <select
            aria-label="Presentation chapter"
            value={n}
            onChange={(e) =>
              navigate(`/presentation/${Number(e.target.value) + 1}`)
            }
          >
            {chapters.map((c, i) => (
              <option key={c} value={i}>
                {i + 1}. {c}
              </option>
            ))}
          </select>
        </label>
        <span aria-live="polite">
          {n + 1} / {chapters.length}
        </span>
        <button
          className="button primary"
          onClick={() =>
            navigate(n === chapters.length - 1 ? "/" : `/presentation/${n + 2}`)
          }
        >
          {n === chapters.length - 1 ? "Finish review" : "Next"}
          <ArrowRight size={17} />
        </button>
      </nav>
    </div>
  );
}
