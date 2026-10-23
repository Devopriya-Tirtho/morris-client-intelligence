import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  FolderPlus,
  GitPullRequest,
  Eye,
  Shapes,
} from "lucide-react";
import { usePortal } from "../services/PortalContext";
import { portfolio } from "../domain/analytics";
import { experienceInsights, projectHealth } from "../domain/experience";
import { Card, PageTitle, Progress, Avatar, number } from "../components/ui";
import {
  Stat,
  Ring,
  Partnership,
  PremiumProjectCard,
  InsightCards,
  Definition,
} from "../components/Experience";
import { BurnChart, ServiceMix } from "../components/Charts";
import { StatusDistribution, Pacing } from "../components/PortfolioVisuals";
import { branding, brandAsset } from "../config/branding";
export function Overview() {
  const { data, role } = usePortal();
  const p = useMemo(() => portfolio(data), [data]);
  const insights = useMemo(() => experienceInsights(data), [data]);
  const active = p.roots.filter(
    (x) => !["Completed", "Upcoming"].includes(x.managed.status),
  );
  const done = data.projects.flatMap((x) =>
    x.managed.milestones
      .filter((m) => m.done)
      .map((m) => ({ project: x, milestone: m })),
  );
  const allMilestones = data.projects.flatMap((x) => x.managed.milestones);
  const upcoming = data.projects.filter((x) => x.managed.status === "Upcoming");
  const watch = p.active.filter((x) =>
    ["Watch", "At risk"].includes(projectHealth(data, x)),
  );
  const published = data.projects.filter(
    (x) => x.narrative.published && x.managed.status !== "Upcoming",
  );
  if (role === "admin")
    return (
      <>
        <PageTitle
          eyebrow="MORRIS INTERNAL · OPERATIONS"
          title="Portfolio control centre"
          description="Maintain the records. Resolve exceptions. Shape the client story."
          action={
            <Link className="button primary" to="/projects/new">
              <FolderPlus size={16} />
              Create project
            </Link>
          }
        />
        <div className="ownership-strip">
          <span>Mock QBO · project identity</span>
          <span>Mock QBO Time · recorded hours</span>
          <span>Morris Managed · scope & narrative</span>
          <span>Calculated · analytics</span>
        </div>
        <div className="executive-stats">
          <Stat
            label="PROJECT RECORDS"
            value={data.projects.length}
            detail={`${active.length} active umbrella agreements`}
          />
          <Stat
            label="UNALLOCATED HOURS"
            value={data.entries
              .filter((t) => !t.managed.projectId)
              .reduce((s, t) => s + t.external.hours, 0)}
            unit="hrs"
            detail="Awaiting reporting classification"
          />
          <Stat
            label="DRAFT NARRATIVES"
            value={data.projects.filter((x) => !x.narrative.published).length}
            detail="Not published to the client"
          />
          <Stat
            label="HIDDEN PROJECTS"
            value={data.projects.filter((x) => !x.managed.visible).length}
            detail="Explicitly hidden; descendants inherit"
          />
        </div>
        <div className="admin-launchpad">
          {[
            {
              to: "/time",
              icon: GitPullRequest,
              title: "Review time allocation",
              body: "Keep raw time intact. Adjust reporting assignments.",
            },
            {
              to: "/content",
              icon: Eye,
              title: "Manage client content",
              body: "Review visibility and narrative publication.",
            },
            {
              to: "/categories",
              icon: Shapes,
              title: "Configure service areas",
              body: "Categories, defaults and archive controls.",
            },
          ].map((x) => (
            <Link key={x.to} to={x.to}>
              <x.icon size={22} />
              <h2>{x.title}</h2>
              <p>{x.body}</p>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
        <Card title="Delivery exceptions" eyebrow="ACTION QUEUE">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Owner</th>
                  <th>Health</th>
                  <th>Target</th>
                  <th>Next action</th>
                </tr>
              </thead>
              <tbody>
                {watch.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <Link to={`/projects/${x.id}`}>
                        {x.external.workOrder} · {x.managed.name}
                      </Link>
                    </td>
                    <td>
                      {data.people.find((t) => t.id === x.managed.managerId)
                        ?.name || "Unshared"}
                    </td>
                    <td>{projectHealth(data, x)}</td>
                    <td>{x.managed.end}</td>
                    <td>
                      {x.narrative.nextStep ||
                        "Review scope and delivery plan."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="executive-columns">
          <StatusDistribution />
          <Pacing />
        </div>
      </>
    );
  return (
    <>
      <div className="client-page-heading">
        <span className="eyebrow">YOUR PARTNERSHIP · MAY — OCTOBER 2026</span>
        <span>Prepared for leadership · October 23, 2026</span>
      </div>
      <section
        className="executive-hero"
        style={
          branding.heroImage
            ? {
                backgroundImage: `linear-gradient(90deg,#102d3bee,#102d3b99),url(${brandAsset(branding.heroImage)})`,
              }
            : undefined
        }
      >
        <div>
          <Partnership />
          <h1>
            Shared priorities.
            <br />
            <em>Visible progress.</em>
          </h1>
          <p>
            One connected view of the people, effort and outcomes moving your
            community’s priorities forward.
          </p>
          <div className="hero-focus">
            <span>CURRENT DELIVERY FOCUS</span>
            <strong>
              {active.map((x) => x.managed.name).join(" · ") ||
                "The next chapter of your partnership"}
            </strong>
          </div>
          <Link to="/portfolio">
            Explore your partnership <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-score">
          <span>ACTIVE PORTFOLIO HEALTH</span>
          <strong>
            {p.health}
            <small>/100</small>
          </strong>
          <p>{watch.length} project items to review</p>
          <div className="hero-score-rule" />
          <small>
            On track 100 · Attention 65 · Delayed 30
            <br />
            Mean score across active project items
          </small>
        </div>
      </section>
      <div className="executive-stats">
        <Stat
          label="HOURS DELIVERED"
          value={p.hours}
          unit="hrs"
          detail={`${number(p.monthly[5].hours)} hours recorded in October`}
        />
        <Stat
          label="ACTIVE PARTNERSHIPS"
          value={active.length}
          detail={`${p.active.filter((x) => x.managed.parentId).length} scoped sub-projects underway`}
        />
        <Stat
          label="EFFORT TO COMPLETION"
          value={p.remaining}
          unit="hrs"
          detail="Estimated remaining active contract effort"
        />
        <Stat
          label="PORTFOLIO UTILIZATION"
          value={Math.round(p.utilization)}
          unit="%"
          detail={`${number(p.cap)} capped hours across confirmed agreements`}
        />
      </div>
      <div className="supporting-metrics">
        <span>
          <b>
            {
              data.projects.filter((x) => x.managed.status === "Completed")
                .length
            }
          </b>{" "}
          completed projects
        </span>
        <span>
          <b>{upcoming.length}</b> upcoming opportunities
        </span>
        <span>
          <b>{data.people.length}</b> team members
        </span>
        <span>
          <b>{p.mix.length}</b> service areas delivered
        </span>
      </div>
      <div className="executive-columns wide-left">
        <Card title="Effort with a clear direction" eyebrow="MONTHLY DELIVERY">
          <BurnChart />
          <Definition>
            Allocated approved and current unapproved hours, May–October 2026.
            Planning effort, not invoiced or billable value.
          </Definition>
        </Card>
        <Card title="Expertise, connected" eyebrow="WHERE EFFORT IS INVESTED">
          <ServiceMix />
          <Link className="text-link" to="/categories">
            Explore service areas <ArrowUpRight size={15} />
          </Link>
        </Card>
      </div>
      <div className="section-title">
        <div>
          <span className="eyebrow">CURRENT FOCUS</span>
          <h2>The work moving forward now</h2>
        </div>
        <Link className="text-link" to="/projects">
          All projects <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="premium-project-grid">
        {active.map((x) => (
          <PremiumProjectCard key={x.id} project={x} />
        ))}
      </div>
      <div className="section-title">
        <div>
          <span className="eyebrow">ATTENTION REQUIRED</span>
          <h2>The conversations that keep work moving</h2>
        </div>
        <span className="muted">Delivery signals & decisions</span>
      </div>
      <InsightCards
        items={insights.filter((x) =>
          [
            "Timeline watch",
            "Forecast",
            "Needs attention",
            "Utilization watch",
          ].includes(x.type),
        )}
        limit={4}
      />
      <div className="executive-columns">
        <Card
          title="Progress worth recognizing"
          eyebrow="RECENT ACCOMPLISHMENTS"
        >
          <div className="achievement-summary">
            <Ring
              value={
                allMilestones.length
                  ? Math.round((done.length / allMilestones.length) * 100)
                  : 0
              }
              label="Recorded milestones complete"
            />
            <div>
              <strong>
                {done.length}
                <small> / {allMilestones.length}</small>
              </strong>
              <p>Milestones completed across the partnership</p>
            </div>
          </div>
          <ul className="delivery-list">
            {published
              .filter((x) => x.narrative.value)
              .slice(0, 3)
              .map((x) => (
                <li key={x.id}>
                  <span>✓</span>
                  <div>
                    <b>{x.narrative.value}</b>
                    <small>
                      {x.external.workOrder} · Reported {x.narrative.updatedAt}
                    </small>
                  </div>
                </li>
              ))}
          </ul>
          <Definition>
            Milestone completion is manually maintained. Undated milestones are
            cumulative; published updates provide reporting context, not
            verified completion dates.
          </Definition>
        </Card>
        <Card title="The next chapter" eyebrow="NEXT UP">
          {upcoming.map((x) => (
            <Link className="next-up-row" key={x.id} to={`/projects/${x.id}`}>
              <time>{x.managed.start.slice(0, 7)}</time>
              <div>
                <h3>{x.managed.name}</h3>
                <p>{x.narrative.nextStep || "Scope and delivery planning"}</p>
                <span>
                  {number(x.managed.cap)} planned hours ·{" "}
                  {data.people.find((t) => t.id === x.managed.managerId)
                    ?.name || "Lead to be shared"}
                </span>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          ))}
          {!upcoming.length && <p>No upcoming work is currently shared.</p>}
        </Card>
      </div>
      <section className="partnership-value">
        <div>
          <span className="eyebrow">PARTNERSHIP VALUE</span>
          <h2>
            Capability that stays.
            <br />
            Progress that connects.
          </h2>
        </div>
        <p>
          {insights[0]?.body} Behind every hour is a shared focus on practical
          tools, clearer decisions and stronger local capability.
        </p>
      </section>
      <div className="section-title">
        <div>
          <span className="eyebrow">FROM YOUR MORRIS TEAM</span>
          <h2>The latest from your project leads</h2>
        </div>
        <Link className="text-link" to="/insights">
          All updates <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="lead-updates">
        {published
          .filter((x) => !x.managed.parentId)
          .slice(0, 3)
          .map((x) => {
            const pm = data.people.find((t) => t.id === x.managed.managerId);
            return (
              <Link key={x.id} to={`/projects/${x.id}`}>
                <span className="eyebrow">
                  {x.external.workOrder} · {x.narrative.updatedAt}
                </span>
                <h3>{x.narrative.summary}</h3>
                <p>{x.narrative.nextStep}</p>
                <div className="row">
                  {pm && <Avatar person={pm} small />}
                  <span>
                    {pm?.name || "Project lead"}
                    <small>Project manager</small>
                  </span>
                </div>
              </Link>
            );
          })}
      </div>
      <div className="section-title">
        <h2>Recommended next steps</h2>
        <span className="muted">From your published workplan</span>
      </div>
      <InsightCards
        items={insights.filter((x) => x.type === "Suggested next step")}
        limit={3}
      />
    </>
  );
}
