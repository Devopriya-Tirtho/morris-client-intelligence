import { useState } from "react";
import {
  BookOpen,
  Compass,
  Users,
  Heart,
  Landmark,
  Pencil,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { usePortal } from "../services/PortalContext";
import {
  serviceArea,
  sortedCategories,
  archiveCategory,
  projectHealth,
} from "../domain/experience";
import type { ProjectCategory } from "../domain/types";
import { newId } from "../domain/id";
import { Card, PageTitle, Progress, number } from "../components/ui";
import { PremiumProjectCard } from "../components/Experience";
const icons = {
  Learning: BookOpen,
  Advisory: Compass,
  Strategy: Landmark,
  Community: Users,
  People: Users,
  Finance: Landmark,
  Writing: Pencil,
  Health: Heart,
};
export function ServiceAreas() {
  const { data, role, update, notify } = usePortal();
  const [selected, setSelected] = useState("all");
  const [editing, setEditing] = useState<ProjectCategory | null>(null);
  const [archive, setArchive] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const categories = sortedCategories(data.categories);
  const active = categories.filter((c) => !c.archived);
  const changeOrder = (id: string, offset: number) => {
    const rows = [...categories];
    const i = rows.findIndex((c) => c.id === id);
    if (i + offset < 0 || i + offset >= rows.length) return;
    [rows[i], rows[i + offset]] = [rows[i + offset], rows[i]];
    void update((d) => ({
      ...d,
      categories: rows.map((c, order) => ({ ...c, order })),
    }));
  };
  return (
    <>
      <PageTitle
        eyebrow={
          role === "admin"
            ? "MORRIS MANAGED · CONFIGURATION"
            : "BREADTH OF YOUR PARTNERSHIP"
        }
        title={
          role === "admin" ? "Category manager" : "Expertise, working together"
        }
        description={
          role === "admin"
            ? "Maintain service areas by stable ID. Renames flow through every project automatically."
            : "A connected view of the service areas supporting your community’s priorities."
        }
        action={
          role === "admin" && (
            <button
              className="button primary"
              onClick={() =>
                setEditing({
                  id: newId(),
                  name: "",
                  description: "",
                  color: "#587b80",
                  icon: "Advisory",
                  order: categories.length,
                })
              }
            >
              <Plus size={16} />
              Add service area
            </button>
          )
        }
      />
      <div className="service-area-grid">
        {active.map((c) => {
          const a = serviceArea(data, c.id);
          const Icon = icons[c.icon as keyof typeof icons] || Compass;
          const watch = a.projects.filter((p) =>
            ["Watch", "At risk"].includes(projectHealth(data, p)),
          ).length;
          return (
            <article
              key={c.id}
              className={`service-area-card ${selected === c.id ? "selected" : ""}`}
              style={{ borderTopColor: c.color }}
            >
              <div className="row between">
                <Icon size={24} color={c.color} />
                {c.isDefault && <span className="meta-label">Default</span>}
              </div>
              <h2>{c.name}</h2>
              <p>
                {c.description ||
                  "Project expertise supporting the shared workplan."}
              </p>
              <div className="service-hours">
                <b>{number(a.hours)}</b>
                <span>hours delivered</span>
              </div>
              <div className="service-counts">
                <span>
                  <b>{a.active}</b> active
                </span>
                <span>
                  <b>{a.completed}</b> complete
                </span>
                <span>
                  <b>{a.upcoming}</b> upcoming
                </span>
              </div>
              <Progress value={a.progress} color={c.color} />
              <p className="small-text">
                {a.progress}% average reported progress ·{" "}
                {
                  a.teamIds.filter((id) => data.people.some((p) => p.id === id))
                    .length
                }{" "}
                team members · {watch} watch items
              </p>
              <div className="row between">
                <button
                  className="text-link"
                  onClick={() => setSelected(selected === c.id ? "all" : c.id)}
                >
                  {selected === c.id
                    ? "Show all projects"
                    : `Explore ${a.projects.length} projects`}
                </button>
                {role === "admin" && (
                  <button
                    className="button subtle"
                    onClick={() => setEditing({ ...c })}
                  >
                    Edit
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {role === "admin" && (
        <Card
          title="Service area lifecycle"
          eyebrow="ORDER · DEFAULT · ARCHIVE"
        >
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Service area</th>
                  <th>Projects</th>
                  <th>State</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr key={c.id}>
                    <td>
                      {c.name}
                      <small>{c.id}</small>
                    </td>
                    <td>
                      {
                        data.projects.filter(
                          (p) => p.managed.categoryId === c.id,
                        ).length
                      }
                    </td>
                    <td>
                      {c.archived
                        ? "Archived"
                        : c.isDefault
                          ? "Default"
                          : "Active"}
                    </td>
                    <td>
                      <button
                        aria-label={`Move ${c.name} up`}
                        disabled={i === 0}
                        onClick={() => changeOrder(c.id, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        aria-label={`Move ${c.name} down`}
                        disabled={i === categories.length - 1}
                        onClick={() => changeOrder(c.id, 1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                    </td>
                    <td>
                      <div className="row">
                        <button
                          className="button subtle"
                          onClick={() => setEditing({ ...c })}
                        >
                          Edit
                        </button>
                        {c.archived ? (
                          <button
                            className="button"
                            onClick={() =>
                              void update((d) => ({
                                ...d,
                                categories: d.categories.map((x) =>
                                  x.id === c.id ? { ...x, archived: false } : x,
                                ),
                              }))
                            }
                          >
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              className="button"
                              disabled={c.isDefault}
                              onClick={() =>
                                void update((d) => ({
                                  ...d,
                                  categories: d.categories.map((x) => ({
                                    ...x,
                                    isDefault: x.id === c.id,
                                  })),
                                }))
                              }
                            >
                              Set default
                            </button>
                            <button
                              className="button"
                              onClick={() => {
                                setArchive(c.id);
                                setTarget("");
                              }}
                            >
                              Archive / merge
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <div className="section-title">
        <h2>
          {selected === "all"
            ? "Projects across service areas"
            : data.categories.find((c) => c.id === selected)?.name}
        </h2>
        {selected !== "all" && (
          <button className="button" onClick={() => setSelected("all")}>
            Clear selection
          </button>
        )}
      </div>
      <div className="premium-project-grid">
        {data.projects
          .filter(
            (p) => selected === "all" || p.managed.categoryId === selected,
          )
          .map((p) => (
            <PremiumProjectCard key={p.id} project={p} />
          ))}
      </div>
      {editing && (
        <div className="modal-backdrop">
          <section
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-title"
          >
            <h2 id="category-title">{editing.name || "New service area"}</h2>
            <p>Unsaved changes · Morris Managed</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                const saved = await update((d) => ({
                  ...d,
                  categories: d.categories.some((c) => c.id === editing.id)
                    ? d.categories.map((c) =>
                        c.id === editing.id ? editing : c,
                      )
                    : [...d.categories, editing],
                }));
                setSaving(false);
                if (saved) setEditing(null);
              }}
            >
              <div className="form-grid">
                <label className="full">
                  Name
                  <input
                    autoFocus
                    required
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </label>
                <label className="full">
                  Description
                  <textarea
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                  />
                </label>
                <label>
                  Icon
                  <select
                    value={editing.icon || "Advisory"}
                    onChange={(e) =>
                      setEditing({ ...editing, icon: e.target.value })
                    }
                  >
                    {Object.keys(icons).map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Accent colour
                  <input
                    type="color"
                    value={editing.color}
                    onChange={(e) =>
                      setEditing({ ...editing, color: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="row">
                <button disabled={saving} className="button primary">
                  {saving ? "Saving…" : "Save service area"}
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    if (window.confirm("Discard these category edits?"))
                      setEditing(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {archive && (
        <div className="modal-backdrop">
          <section
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-title"
          >
            <h2 id="archive-title">Archive this service area?</h2>
            <p>
              Move all project and reporting-time assignments to an active
              destination first. Raw time remains unchanged. The archived
              category can be restored later; assignments stay with the
              destination.
            </p>
            <label>
              Destination service area
              <select
                autoFocus
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">
                  No destination (unused categories only)
                </option>
                {active
                  .filter((c) => c.id !== archive)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="row">
              <button
                className="button primary"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const saved = await update((d) =>
                      archiveCategory(d, archive, target || undefined),
                    );
                    if (saved) {
                      setArchive(null);
                      setSelected("all");
                    }
                  } catch (e) {
                    notify(String(e));
                  }
                  setSaving(false);
                }}
              >
                {saving ? "Saving…" : "Confirm archive"}
              </button>
              <button className="button" onClick={() => setArchive(null)}>
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
