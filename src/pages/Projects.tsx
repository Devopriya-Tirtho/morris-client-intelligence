import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { usePortal } from "../services/PortalContext";
import { analytics } from "../domain/analytics";
import {
  projectHealth,
  hierarchyLabel,
  sortedCategories,
} from "../domain/experience";
import { PageTitle, Card, Progress, number, Empty } from "../components/ui";
import {
  PremiumProjectCard,
  HealthBadge,
  Stat,
} from "../components/Experience";
export function Projects({
  portfolioView = false,
  pipeline = false,
}: {
  portfolioView?: boolean;
  pipeline?: boolean;
}) {
  const { data, role } = usePortal();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [health, setHealth] = useState("all");
  const [manager, setManager] = useState("all");
  const [parent, setParent] = useState("all");
  const [stage, setStage] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [sort, setSort] = useState("name");
  const [group, setGroup] = useState(portfolioView ? "parent" : "none");
  const [layout, setLayout] = useState(role === "admin" ? "table" : "grid");
  const items = useMemo(
    () =>
      data.projects
        .filter(
          (p) =>
            (!pipeline ||
              p.managed.status === "Upcoming" ||
              !p.external.workOrder) &&
            `${p.managed.name} ${p.external.workOrder || ""}`
              .toLowerCase()
              .includes(q.toLowerCase()) &&
            (status === "all" || p.managed.status === status) &&
            (category === "all" || p.managed.categoryId === category) &&
            (health === "all" || projectHealth(data, p) === health) &&
            (manager === "all" || p.managed.managerId === manager) &&
            (parent === "all" ||
              (parent === "root"
                ? !p.managed.parentId
                : p.managed.parentId === parent || p.id === parent)) &&
            (stage === "all" ||
              (stage === "active"
                ? !["Completed", "Upcoming"].includes(p.managed.status)
                : p.managed.status === stage)) &&
            (role !== "admin" ||
              visibility === "all" ||
              p.managed.visible === (visibility === "shared")),
        )
        .sort((a, b) =>
          sort === "hours"
            ? analytics(data, b.id).hours - analytics(data, a.id).hours
            : sort === "utilization"
              ? analytics(data, b.id).utilization -
                analytics(data, a.id).utilization
              : sort === "date"
                ? a.managed.end.localeCompare(b.managed.end)
                : sort === "workOrder"
                  ? (a.external.workOrder || "ZZZ").localeCompare(
                      b.external.workOrder || "ZZZ",
                      undefined,
                      { numeric: true },
                    )
                  : a.managed.name.localeCompare(b.managed.name),
        ),
    [
      data,
      pipeline,
      q,
      status,
      category,
      health,
      manager,
      parent,
      stage,
      role,
      visibility,
      sort,
    ],
  );
  const groups = useMemo(() => {
    const result = new Map<string, typeof items>();
    for (const p of items) {
      const key =
        group === "category"
          ? data.categories.find((c) => c.id === p.managed.categoryId)?.name ||
            "Unassigned"
          : group === "parent"
            ? data.projects.find((x) => x.id === (p.managed.parentId || p.id))
                ?.managed.name || "Standalone"
            : "All projects";
      result.set(key, [...(result.get(key) || []), p]);
    }
    return [...result];
  }, [items, group, data]);
  const pipelineItems = data.projects.filter(
    (p) => p.managed.status === "Upcoming" || !p.external.workOrder,
  );
  const select = (
    label: string,
    value: string,
    set: (v: string) => void,
    options: { value: string; label: string }[],
  ) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => set(e.target.value)}
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      <PageTitle
        eyebrow={
          role === "admin"
            ? "MORRIS INTERNAL · PROJECT OPERATIONS"
            : "YOUR CONNECTED PORTFOLIO"
        }
        title={
          pipeline
            ? "Tomorrow’s possibilities"
            : portfolioView
              ? "One partnership. Connected work."
              : role === "admin"
                ? "Project registry"
                : "Projects with purpose"
        }
        description={
          pipeline
            ? "Shape upcoming work before a work order exists. Attach identity later without losing the plan."
            : "Explore each agreement, the scoped work beneath it and the people moving it forward."
        }
        action={
          role === "admin" && (
            <Link className="button primary" to="/projects/new">
              <Plus size={16} />
              New project
            </Link>
          )
        }
      />
      {pipeline && (
        <div className="executive-stats">
          <Stat
            label="IN THE PIPELINE"
            value={pipelineItems.length}
            detail="Upcoming or uninitialized project records"
          />
          <Stat
            label="PLANNED EFFORT"
            value={pipelineItems.reduce((s, p) => s + p.managed.cap, 0)}
            unit="hrs"
            detail="Estimates; excluded from initialized contract cap"
          />
          <Stat
            label="NOT INITIALIZED"
            value={pipelineItems.filter((p) => !p.external.workOrder).length}
            detail="Stable records awaiting work-order attachment"
          />
        </div>
      )}
      <section className="portfolio-tools">
        <div className="row between">
          <label className="search">
            <Search size={17} />
            <input
              aria-label="Search projects"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search project or work order"
            />
          </label>
          <div className="view-toggle">
            <button
              aria-label="Card view"
              aria-pressed={layout === "grid"}
              onClick={() => setLayout("grid")}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              aria-label="Table view"
              aria-pressed={layout === "table"}
              onClick={() => setLayout("table")}
            >
              <List size={17} />
            </button>
          </div>
        </div>
        <div className="portfolio-filters">
          {select(
            "Service area",
            category,
            setCategory,
            sortedCategories(data.categories)
              .filter((c) => !c.archived)
              .map((c) => ({ value: c.id, label: c.name })),
          )}
          {select(
            "Status",
            status,
            setStatus,
            ["On track", "Attention", "Delayed", "Completed", "Upcoming"].map(
              (s) => ({ value: s, label: s }),
            ),
          )}
          {select(
            "Health",
            health,
            setHealth,
            ["Healthy", "Watch", "At risk", "Complete", "Planned"].map((s) => ({
              value: s,
              label: s,
            })),
          )}
          {select(
            "Project manager",
            manager,
            setManager,
            data.people.map((p) => ({ value: p.id, label: p.name })),
          )}
          {select("Parent project", parent, setParent, [
            { value: "root", label: "Umbrella / standalone only" },
            ...data.projects
              .filter((p) => !p.managed.parentId)
              .map((p) => ({ value: p.id, label: p.managed.name })),
          ])}
          {select("Lifecycle", stage, setStage, [
            { value: "active", label: "Active" },
            { value: "Upcoming", label: "Upcoming" },
            { value: "Completed", label: "Completed" },
          ])}
          {role === "admin" &&
            select("Client visibility", visibility, setVisibility, [
              { value: "shared", label: "Shared" },
              { value: "hidden", label: "Hidden" },
            ])}
          <label>
            Sort by
            <select
              aria-label="Sort projects"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name">Name A–Z</option>
              <option value="workOrder">Work order</option>
              <option value="hours">Hours · highest first</option>
              <option value="utilization">Utilization · highest first</option>
              <option value="date">Target · earliest first</option>
            </select>
          </label>
          <label>
            Group by
            <select
              aria-label="Group projects"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option value="none">No grouping</option>
              <option value="parent">Umbrella / parent</option>
              <option value="category">Service area</option>
            </select>
          </label>
        </div>
        <div className="row between result-caption">
          <span>
            {items.length} project items · parent and child hours overlap; do
            not sum cards
          </span>
          <button
            className="text-link"
            onClick={() => {
              setQ("");
              setStatus("all");
              setCategory("all");
              setHealth("all");
              setManager("all");
              setParent("all");
              setStage("all");
              setVisibility("all");
            }}
          >
            Clear filters
          </button>
        </div>
      </section>
      {!items.length ? (
        <Empty>No projects match these filters.</Empty>
      ) : (
        groups.map(([label, projects]) => (
          <section className="portfolio-group" key={label}>
            {group !== "none" && (
              <div className="section-title">
                <h2>{label}</h2>
                <span>{projects.length} project items</span>
              </div>
            )}
            {layout === "grid" ? (
              <div className="premium-project-grid">
                {projects.map((p) => (
                  <PremiumProjectCard project={p} key={p.id} />
                ))}
              </div>
            ) : (
              <Card>
                <div className="table-scroll">
                  <table>
                    <caption className="sr-only">
                      {label} sorted by {sort}
                    </caption>
                    <thead>
                      <tr>
                        <th>Project / relationship</th>
                        <th>Lead</th>
                        <th>Status / health</th>
                        <th>Actual / cap</th>
                        <th>Utilization</th>
                        <th>Forecast</th>
                        <th>Progress</th>
                        <th>Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => {
                        const a = analytics(data, p.id);
                        return (
                          <tr key={p.id}>
                            <td>
                              <Link to={`/projects/${p.id}`}>
                                <strong>{p.managed.name}</strong>
                                <small>
                                  {p.external.workOrder || "Not initialized"} ·{" "}
                                  {hierarchyLabel(data, p)}
                                </small>
                              </Link>
                            </td>
                            <td>
                              {data.people.find(
                                (t) => t.id === p.managed.managerId,
                              )?.name || "Not shared"}
                            </td>
                            <td>
                              <span>{p.managed.status}</span>
                              <HealthBadge health={projectHealth(data, p)} />
                            </td>
                            <td>
                              {number(a.hours)} / {number(p.managed.cap)}
                            </td>
                            <td>{Math.round(a.utilization)}%</td>
                            <td>{number(a.forecast)} hrs</td>
                            <td>
                              {p.managed.progress}%
                              <Progress value={p.managed.progress} />
                            </td>
                            <td>{p.managed.end}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>
        ))
      )}
    </>
  );
}
