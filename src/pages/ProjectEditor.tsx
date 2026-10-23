import { newId } from "../domain/id";
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Pencil,
  Check,
  ShieldCheck,
  Clock3,
  Target,
  TrendingUp,
  X,
  Flag,
  ArrowUpRight,
} from "lucide-react";
import { usePortal } from "../services/PortalContext";
import type { Project, Status } from "../domain/types";
import { analytics, canParent } from "../domain/analytics";
import {
  Card,
  PageTitle,
  Metric,
  Badge,
  Progress,
  Avatar,
  Breadcrumb,
  ProjectCard,
  date,
  number,
} from "../components/ui";
import { BurnChart } from "../components/Charts";
import { convertUpcoming } from "../domain/experience";
import { AS_OF } from "../data/seed";
function blank(): Project {
  return {
    id: newId(),
    external: { workOrder: null, qboProjectId: null, lastSyncedAt: null },
    managed: {
      name: "",
      parentId: null,
      categoryId: "c1",
      status: "Upcoming",
      start: "2026-11-01",
      end: "2027-02-01",
      cap: 100,
      monthlyCap: 25,
      progress: 0,
      managerId: "person0",
      teamIds: ["person0"],
      visible: false,
      description: "",
      internalNotes: "",
      milestones: [],
    },
    narrative: {
      summary: "",
      value: "",
      risk: "",
      decision: "",
      nextStep: "",
      updatedAt: AS_OF,
      published: false,
    },
  };
}
export function ProjectEditor({
  project,
  onClose,
  isNew = false,
}: {
  project: Project;
  onClose: () => void;
  isNew?: boolean;
}) {
  const { data, update } = usePortal();
  const [draft, setDraft] = useState<Project>(structuredClone(project));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(project);
  function close() {
    if (!dirty || window.confirm("Discard unsaved project changes?")) onClose();
  }
  const navigate = useNavigate();
  const m = draft.managed;
  function field<K extends keyof Project["managed"]>(
    key: K,
    value: Project["managed"][K],
  ) {
    setDraft({ ...draft, managed: { ...m, [key]: value } });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!m.name.trim()) return setError("Enter a project name.");
    if (m.end < m.start)
      return setError("Target completion must be after the start date.");
    if (!canParent(data.projects, draft.id, m.parentId))
      return setError(
        "Choose an umbrella project outside this project’s descendants.",
      );
    if (
      m.parentId &&
      data.projects.some((p) => p.managed.parentId === draft.id)
    )
      return setError(
        "This umbrella has children. Move its sub-projects before grouping it under another project.",
      );
    if (
      draft.external.workOrder &&
      data.projects.some(
        (p) =>
          p.id !== draft.id &&
          p.external.workOrder === draft.external.workOrder,
      )
    )
      return setError("That work order is already assigned.");
    setSaving(true);
    const submitted =
      !project.external.workOrder &&
      draft.external.workOrder &&
      draft.managed.status === "Upcoming"
        ? convertUpcoming(
            { ...draft, external: { ...draft.external, workOrder: null } },
            draft.external.workOrder,
          )
        : draft;
    const saved = await update((d) => ({
      ...d,
      projects: isNew
        ? [...d.projects, submitted]
        : d.projects.map((p) => (p.id === draft.id ? submitted : p)),
    }));
    setSaving(false);
    if (!saved) return;
    onClose();
    if (isNew) navigate(`/projects/${draft.id}`);
  }
  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        className="editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="editor-header">
          <div>
            <div className="eyebrow">MORRIS INTERNAL</div>
            <h2 id="editor-title">
              {isNew ? "Create a project" : "Edit project details"}
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close editor"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <p className="form-state">
          {saving
            ? "Saving…"
            : dirty
              ? "Unsaved changes · Morris Managed"
              : "Morris Managed · Ready to edit"}
        </p>
        <form onSubmit={save}>
          <div className="protected-note">
            <ShieldCheck size={18} />
            Morris-managed fields stay protected from future automated syncs.
          </div>
          <div className="form-grid">
            <label className="full">
              Project name
              <input
                required
                value={m.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label>
              Work order <span className="muted">(optional)</span>
              <input
                placeholder="Not initialized"
                value={draft.external.workOrder || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    external: {
                      ...draft.external,
                      workOrder: e.target.value.trim() || null,
                    },
                  })
                }
              />
            </label>
            <label>
              Umbrella project
              <select
                value={m.parentId || ""}
                onChange={(e) => field("parentId", e.target.value || null)}
              >
                <option value="">Standalone / umbrella</option>
                {data.projects
                  .filter(
                    (p) =>
                      p.id !== draft.id &&
                      !p.managed.parentId &&
                      canParent(data.projects, draft.id, p.id),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.external.workOrder || "Upcoming"} · {p.managed.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Service line
              <select
                value={m.categoryId}
                onChange={(e) => field("categoryId", e.target.value)}
              >
                {data.categories
                  .filter((c) => !c.archived)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={m.status}
                onChange={(e) => field("status", e.target.value as Status)}
              >
                {[
                  "On track",
                  "Attention",
                  "Delayed",
                  "Completed",
                  "Upcoming",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Start date
              <input
                type="date"
                required
                value={m.start}
                onChange={(e) => field("start", e.target.value)}
              />
            </label>
            <label>
              Target completion
              <input
                type="date"
                required
                value={m.end}
                onChange={(e) => field("end", e.target.value)}
              />
            </label>
            <label>
              Hours cap
              <input
                type="number"
                min="0"
                required
                value={m.cap}
                onChange={(e) => field("cap", Number(e.target.value))}
              />
            </label>
            <label>
              Monthly cap
              <input
                type="number"
                min="0"
                required
                value={m.monthlyCap}
                onChange={(e) => field("monthlyCap", Number(e.target.value))}
              />
            </label>
            <label>
              Reported progress (%)
              <input
                type="number"
                min="0"
                max="100"
                required
                value={m.progress}
                onChange={(e) => field("progress", Number(e.target.value))}
              />
            </label>
            <label>
              Project manager
              <select
                value={m.managerId}
                onChange={(e) => field("managerId", e.target.value)}
              >
                {data.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="full">
              Project description
              <textarea
                rows={3}
                value={m.description}
                onChange={(e) => field("description", e.target.value)}
              />
            </label>
            <fieldset className="full">
              <legend>Assigned team</legend>
              <div className="checks">
                {data.people.map((p) => (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={m.teamIds.includes(p.id)}
                      onChange={(e) =>
                        field(
                          "teamIds",
                          e.target.checked
                            ? [...m.teamIds, p.id]
                            : m.teamIds.filter((id) => id !== p.id),
                        )
                      }
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="full">
              <legend>Milestone tracker</legend>
              {m.milestones.map((x, i) => (
                <label className="check-label" key={x.id}>
                  <input
                    type="checkbox"
                    checked={x.done}
                    onChange={(e) =>
                      field(
                        "milestones",
                        m.milestones.map((v, j) =>
                          j === i ? { ...v, done: e.target.checked } : v,
                        ),
                      )
                    }
                  />
                  {x.name}
                </label>
              ))}
              <button
                type="button"
                className="button subtle"
                onClick={() =>
                  field("milestones", [
                    ...m.milestones,
                    {
                      id: newId(),
                      name: `Milestone ${m.milestones.length + 1}`,
                      done: false,
                    },
                  ])
                }
              >
                Add milestone
              </button>
              {m.milestones.map((x, i) => (
                <input
                  aria-label={`Milestone ${i + 1} name`}
                  key={x.id}
                  value={x.name}
                  onChange={(e) =>
                    field(
                      "milestones",
                      m.milestones.map((v, j) =>
                        i === j ? { ...v, name: e.target.value } : v,
                      ),
                    )
                  }
                />
              ))}
            </fieldset>
            <label>
              Forecast override (hours)
              <input
                type="number"
                min="0"
                value={m.forecastOverride?.hours ?? ""}
                onChange={(e) =>
                  field(
                    "forecastOverride",
                    e.target.value === ""
                      ? null
                      : {
                          hours: Number(e.target.value),
                          reason: m.forecastOverride?.reason || "",
                        },
                  )
                }
              />
            </label>
            <label>
              Override reason
              <input
                value={m.forecastOverride?.reason || ""}
                disabled={!m.forecastOverride}
                required={!!m.forecastOverride}
                onChange={(e) =>
                  field("forecastOverride", {
                    hours: m.forecastOverride?.hours || 0,
                    reason: e.target.value,
                  })
                }
              />
            </label>
            <label className="full">
              Internal notes
              <textarea
                rows={2}
                value={m.internalNotes}
                onChange={(e) => field("internalNotes", e.target.value)}
              />
            </label>
            <label className="check-label full">
              <input
                type="checkbox"
                checked={m.visible}
                onChange={(e) => field("visible", e.target.checked)}
              />
              Visible to client
            </label>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="editor-footer">
            <button type="button" className="button" onClick={close}>
              Cancel
            </button>
            <button className="button primary" type="submit" disabled={saving}>
              {isNew ? "Create project" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
export function NewProject() {
  const { role, data } = usePortal();
  const navigate = useNavigate();
  const [project] = useState(() => {
    const p = blank();
    p.managed.categoryId =
      data.categories.find((c) => c.isDefault && !c.archived)?.id ||
      data.categories.find((c) => !c.archived)?.id ||
      "c1";
    return p;
  });
  return role === "admin" ? (
    <ProjectEditor
      project={project}
      isNew
      onClose={() => navigate("/projects")}
    />
  ) : (
    <PageTitle
      title="Morris internal workspace"
      description="Switch to Morris Internal to create a project."
    />
  );
}
