import { useMemo } from "react";
import { usePortal } from "../services/PortalContext";
import { analytics, portfolio } from "../domain/analytics";
import { projectHealth } from "../domain/experience";
import { Card, number, Progress } from "./ui";
import { Definition } from "./Experience";
export function StatusDistribution() {
  const { data } = usePortal();
  const counts = [
    "On track",
    "Attention",
    "Delayed",
    "Completed",
    "Upcoming",
  ].map((status) => ({
    status,
    count: data.projects.filter((p) => p.managed.status === status).length,
  }));
  return (
    <Card title="The delivery picture" eyebrow="PROJECT ITEMS">
      <div
        className="status-segments"
        role="img"
        aria-label={counts.map((c) => `${c.status}: ${c.count}`).join("; ")}
      >
        {counts
          .filter((c) => c.count)
          .map((c) => (
            <span
              key={c.status}
              className={c.status.toLowerCase().replace(" ", "-")}
              style={{ flex: c.count }}
            />
          ))}
      </div>
      <div className="status-legend">
        {counts.map((c) => (
          <div key={c.status}>
            <span>
              <i className={c.status.toLowerCase().replace(" ", "-")} />
              {c.status}
            </span>
            <b>{c.count}</b>
          </div>
        ))}
      </div>
      <Definition>
        Counts include umbrella and child project items. Status is manually
        maintained; it is not an accounting approval.
      </Definition>
    </Card>
  );
}
export function Contribution({ projectId }: { projectId: string }) {
  const { data } = usePortal();
  const p = data.projects.find((p) => p.id === projectId)!;
  const items = [
    {
      id: p.id,
      name: "Direct umbrella effort",
      hours: data.entries
        .filter((t) => t.managed.projectId === p.id)
        .reduce((s, t) => s + t.external.hours, 0),
    },
    ...data.projects
      .filter((x) => x.managed.parentId === p.id)
      .map((x) => ({
        id: x.id,
        name: x.managed.name,
        hours: analytics(data, x.id).hours,
      })),
  ];
  const total = items.reduce((s, i) => s + i.hours, 0);
  return (
    <Card title="How the work connects" eyebrow="PARENT & CHILD CONTRIBUTION">
      <div className="horizontal-bars">
        {items.map((i) => (
          <div key={i.id}>
            <span>
              {i.name}
              <b>{number(i.hours)} hrs</b>
            </span>
            <Progress value={total ? (i.hours / total) * 100 : 0} />
          </div>
        ))}
      </div>
      <Definition>
        Direct parent time plus child contributions. Each time entry is counted
        once within this contract.
      </Definition>
    </Card>
  );
}
export function TeamAllocation() {
  const { data } = usePortal();
  const rows = useMemo(
    () =>
      data.people.map((person) => ({
        person,
        months: Array.from({ length: 6 }, (_, i) =>
          data.entries
            .filter(
              (t) =>
                t.managed.projectId &&
                data.projects.some((p) => p.id === t.managed.projectId) &&
                person.qboIds.includes(t.external.personId) &&
                t.external.date.startsWith(
                  `2026-${String(i + 5).padStart(2, "0")}`,
                ),
            )
            .reduce((s, t) => s + t.external.hours, 0),
        ),
      })),
    [data],
  );
  const max = Math.max(1, ...rows.flatMap((r) => r.months));
  return (
    <Card title="The people behind the progress" eyebrow="TEAM EFFORT · HOURS">
      <div className="table-scroll">
        <table className="allocation-heatmap">
          <caption className="sr-only">
            Monthly allocated hours by team member
          </caption>
          <thead>
            <tr>
              <th>Team member</th>
              {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
                <th key={m}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.person.id}>
                <th scope="row">{r.person.name}</th>
                {r.months.map((hours, i) => (
                  <td
                    key={i}
                    style={{
                      background: `rgba(74,119,128,${0.05 + (hours / max) * 0.23})`,
                    }}
                  >
                    {number(hours)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Definition>
        Source identity aliases map to a single display person. Unallocated and
        hidden-project time is excluded. Unknown or hidden people may leave some
        portfolio hours unattributed here.
      </Definition>
    </Card>
  );
}
export function Pacing() {
  const { data } = usePortal();
  const p = portfolio(data);
  return (
    <Card title="Progress in perspective" eyebrow="DELIVERY VS EFFORT">
      <div className="pace-legend">
        <span>Reported completion</span>
        <span>Cap utilized</span>
      </div>
      {p.roots
        .filter((x) => x.managed.status !== "Upcoming")
        .map((x) => {
          const a = analytics(data, x.id);
          return (
            <div className="pace-row" key={x.id}>
              <div>
                <b>{x.external.workOrder}</b>
                <span>{projectHealth(data, x)}</span>
              </div>
              <label>
                {x.managed.progress}% complete
                <Progress value={x.managed.progress} color="#587b67" />
              </label>
              <label>
                {Math.round(a.utilization)}% utilized
                <Progress value={a.utilization} color="#bc9755" />
              </label>
            </div>
          );
        })}
      <Definition>
        Manual completion compared with hours used. A difference prompts a
        conversation; it does not establish earned value or financial
        performance.
      </Definition>
    </Card>
  );
}
