import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePortal } from "../services/PortalContext";
import { PageTitle, Card, Avatar, date } from "../components/ui";
import { InsightCards } from "../components/Experience";
import { experienceInsights } from "../domain/experience";
import type { Project } from "../domain/types";
import { AS_OF } from "../data/seed";
function NarrativeEditor({
  project,
  onDirty,
}: {
  project: Project;
  onDirty: (dirty: boolean) => void;
}) {
  const { update } = usePortal();
  const [draft, setDraft] = useState(project.narrative);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(project.narrative);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const saved = { ...draft, updatedAt: AS_OF };
        const success = await update((d) => ({
          ...d,
          projects: d.projects.map((p) =>
            p.id === project.id ? { ...p, narrative: saved } : p,
          ),
        }));
        if (success) setDraft(saved);
        setSaving(false);
      }}
    >
      <div className="form-state">
        {saving
          ? "Saving…"
          : dirty
            ? "Unsaved narrative changes"
            : "Narrative matches the saved record"}{" "}
        · Morris Managed
      </div>
      <div className="form-grid">
        {(
          [
            ["summary", "Project manager update"],
            ["value", "Client value / accomplishments"],
            ["risk", "Risks & watch items"],
            ["decision", "Decisions required"],
            ["nextStep", "Recommended next step"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className={key === "summary" ? "full" : ""}>
            {label}
            <textarea
              rows={3}
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="check-label full">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) =>
              setDraft({ ...draft, published: e.target.checked })
            }
          />
          Publish this narrative to client view
        </label>
      </div>
      <button className="button primary" disabled={saving || !dirty}>
        {saving ? "Saving…" : "Save narrative"}
      </button>
      <p className="footnote">
        Draft content is excluded from the client projection and presentation.
        Publishing does not change project visibility.
      </p>
    </form>
  );
}
export function InsightsStudio() {
  const { data, role } = usePortal();
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState(data.projects[0]?.id || "");
  const project = data.projects.find((p) => p.id === selected);
  return (
    <>
      <PageTitle
        eyebrow={
          role === "admin"
            ? "MORRIS MANAGED · NARRATIVE CONTENT"
            : "THE STORY BEHIND THE PROGRESS"
        }
        title={
          role === "admin"
            ? "Insights studio"
            : "Progress, perspective & next steps"
        }
        description={
          role === "admin"
            ? "Shape clear client updates. Deterministic signals remain separate from authored narrative."
            : "Published updates from your project leads, alongside transparent planning signals."
        }
      />
      {role === "admin" && (
        <Card title="Project narrative editor">
          <label className="select-label">
            Project
            <select
              value={selected}
              onChange={(e) => {
                if (
                  !dirty ||
                  window.confirm(
                    "Discard unsaved narrative edits and switch project?",
                  )
                )
                  setSelected(e.target.value);
              }}
            >
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.external.workOrder || "Upcoming"} · {p.managed.name}
                </option>
              ))}
            </select>
          </label>
          {project && (
            <NarrativeEditor
              key={project.id}
              project={project}
              onDirty={setDirty}
            />
          )}
        </Card>
      )}
      <div className="lead-updates">
        {data.projects
          .filter((p) => p.narrative.published)
          .map((p) => {
            const owner = data.people.find((t) => t.id === p.managed.managerId);
            return (
              <Link to={`/projects/${p.id}`} key={p.id}>
                <span className="eyebrow">
                  {p.external.workOrder || "UPCOMING"} ·{" "}
                  {p.narrative.updatedAt
                    ? date(p.narrative.updatedAt)
                    : "Update"}
                </span>
                <h3>{p.narrative.summary || p.managed.name}</h3>
                <p>{p.narrative.value}</p>
                <div className="row">
                  {owner && <Avatar person={owner} small />}
                  <span>
                    {owner?.name || "Project lead"}
                    <small>{p.managed.name}</small>
                  </span>
                </div>
              </Link>
            );
          })}
      </div>
      <div className="section-title">
        <div>
          <span className="eyebrow">PORTFOLIO PERSPECTIVE</span>
          <h2>Signals for the next conversation</h2>
        </div>
      </div>
      <InsightCards items={experienceInsights(data)} limit={30} />
    </>
  );
}
