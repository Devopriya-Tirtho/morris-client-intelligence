import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { usePortal } from "../services/PortalContext";
import type { Person } from "../domain/types";
import { PageTitle, Card, Avatar, number } from "../components/ui";
import { TeamAllocation } from "../components/PortfolioVisuals";
export function TeamDirectory({ contacts = false }: { contacts?: boolean }) {
  const { data, role, update, notify } = usePortal();
  const [draft, setDraft] = useState<Person | null>(null);
  const [alias, setAlias] = useState("");
  const [owner, setOwner] = useState(data.people[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const primary = data.people[0];
  return (
    <>
      <PageTitle
        eyebrow={
          role === "admin"
            ? "MORRIS MANAGED · PEOPLE & IDENTITIES"
            : "PEOPLE WITH A SHARED PURPOSE"
        }
        title={
          contacts
            ? "The right people, within reach"
            : role === "admin"
              ? "Team & identity mapping"
              : "Your partners in progress"
        }
        description={
          role === "admin"
            ? "Maintain one display identity per person, independently of source-system identifiers."
            : "Clear ownership, complementary expertise and continuity across your partnership."
        }
      />
      {contacts && primary && (
        <section className="contact-owner">
          <Avatar person={primary} />
          <div>
            <span className="eyebrow">PRIMARY PARTNERSHIP CONTACT</span>
            <h2>{primary.name}</h2>
            <p>{primary.role} · Relationship and escalation</p>
            <p>
              {primary.email} · {primary.phone}
            </p>
          </div>
          <span className="meta-label">Fictional contact details</span>
        </section>
      )}
      <div className="directory-grid">
        {data.people.map((person) => {
          const projects = data.projects.filter(
            (p) =>
              p.managed.teamIds.includes(person.id) ||
              p.managed.managerId === person.id,
          );
          const led = projects.filter((p) => p.managed.managerId === person.id);
          const hours = data.entries
            .filter(
              (t) =>
                t.managed.projectId &&
                person.qboIds.includes(t.external.personId),
            )
            .reduce((s, t) => s + t.external.hours, 0);
          return (
            <article className="directory-card" key={person.id}>
              <div className="row between">
                <Avatar person={person} />
                {led.length > 0 && (
                  <span className="meta-label">PROJECT LEAD</span>
                )}
              </div>
              <h2>{person.name}</h2>
              <p>{person.role}</p>
              <div className="expertise-tag">
                {person.expertise || person.role}
              </div>
              <div className="contact-lines">
                <span>
                  <Mail size={14} />
                  {person.email}
                </span>
                <span>
                  <Phone size={14} />
                  {person.phone}
                </span>
              </div>
              <div className="team-stats">
                <span>
                  <b>{number(hours)}</b> allocated hours
                </span>
                <span>
                  <b>{projects.length}</b> project roles
                </span>
              </div>
              <div className="ownership-list">
                {projects.map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`}>
                    <span>
                      {p.external.workOrder || "Upcoming"} · {p.managed.name}
                      <small>
                        {p.managed.managerId === person.id
                          ? "Accountable project manager"
                          : "Delivery team member"}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
              {role === "admin" && (
                <>
                  <div className="identity-chips">
                    {person.qboIds.map((id) => (
                      <span key={id}>
                        {id}
                        <button
                          aria-label={`Remove identity ${id}`}
                          onClick={() =>
                            void update((d) => ({
                              ...d,
                              people: d.people.map((p) =>
                                p.id === person.id
                                  ? {
                                      ...p,
                                      qboIds: p.qboIds.filter((x) => x !== id),
                                    }
                                  : p,
                              ),
                            }))
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="small-text">
                    Client visibility:{" "}
                    {person.clientVisible === false ? "Hidden" : "Shared"}
                  </p>
                  <button
                    className="button"
                    onClick={() => setDraft(structuredClone(person))}
                  >
                    Edit profile
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>
      {!data.people.length && (
        <Card>
          <p>Team contacts have not been shared yet.</p>
        </Card>
      )}
      {!contacts && <TeamAllocation />}
      {role === "admin" && (
        <Card
          title="Resolve external identities"
          eyebrow="MOCK QBO / MOCK QBO TIME → MORRIS DISPLAY PERSON"
        >
          <div className="protected-note">
            <ShieldCheck size={18} />
            Mapping changes attribution. It never modifies the original source
            time entry.
          </div>
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const value = alias.trim();
              if (!value) return;
              if (data.people.some((p) => p.qboIds.includes(value))) {
                notify(
                  "That identity is already mapped. Remove its current mapping first.",
                );
                return;
              }
              const saved = await update((d) => ({
                ...d,
                people: d.people.map((p) =>
                  p.id === owner ? { ...p, qboIds: [...p.qboIds, value] } : p,
                ),
              }));
              if (saved) setAlias("");
            }}
          >
            <input
              aria-label="External person ID"
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. qbo-999"
            />
            <select
              aria-label="Identity owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              {data.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="button primary">Map identity</button>
          </form>
          <p>
            Unmapped:{" "}
            {[
              ...new Set(
                data.entries
                  .filter(
                    (t) =>
                      !data.people.some((p) =>
                        p.qboIds.includes(t.external.personId),
                      ),
                  )
                  .map((t) => t.external.personId),
              ),
            ].join(", ") || "None"}
          </p>
        </Card>
      )}
      {draft && (
        <div className="modal-backdrop">
          <section
            className="editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
          >
            <h2 id="profile-title">Edit display profile</h2>
            <p className="form-state">Unsaved changes · Morris Managed</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                const saved = await update((d) => ({
                  ...d,
                  people: d.people.map((p) => (p.id === draft.id ? draft : p)),
                }));
                setSaving(false);
                if (saved) setDraft(null);
              }}
            >
              <div className="form-grid">
                {(["name", "role", "email", "phone", "expertise"] as const).map(
                  (key) => (
                    <label className="full" key={key}>
                      {key === "name" ? "Preferred display name" : key}
                      <input
                        autoFocus={key === "name"}
                        required={key !== "expertise"}
                        type={key === "email" ? "email" : "text"}
                        value={draft[key] || ""}
                        onChange={(e) =>
                          setDraft({ ...draft, [key]: e.target.value })
                        }
                      />
                    </label>
                  ),
                )}
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={draft.clientVisible !== false}
                    onChange={(e) =>
                      setDraft({ ...draft, clientVisible: e.target.checked })
                    }
                  />
                  Visible to client
                </label>
              </div>
              <div className="row">
                <button className="button primary" disabled={saving}>
                  {saving ? "Saving…" : "Save profile"}
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    if (window.confirm("Discard profile edits?"))
                      setDraft(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
