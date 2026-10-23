import {
  aggregateHours,
  burnAgainstCap,
  forecastHours,
  portfolioHealth,
} from "./metrics";
export { applyExternalPatch } from "./ownership";
import type { PortalData, Project, ProjectAnalytics } from "./types";
export function descendants(projects: Project[], id: string): Project[] {
  const seen = new Set<string>();
  const visit = (key: string): Project[] => {
    if (seen.has(key)) return [];
    seen.add(key);
    return projects
      .filter((p) => p.id === key)
      .concat(
        projects
          .filter((p) => p.managed.parentId === key)
          .flatMap((p) => visit(p.id)),
      );
  };
  return visit(id);
}
export function visibleData(data: PortalData): PortalData {
  const hidden = new Set(
    data.projects
      .filter((p) => !p.managed.visible)
      .flatMap((p) => descendants(data.projects, p.id).map((x) => x.id)),
  );
  const projects = data.projects
    .filter((p) => !hidden.has(p.id))
    .map((p) => ({
      ...p,
      managed: { ...p.managed, internalNotes: "" },
      narrative: p.narrative.published
        ? p.narrative
        : {
            summary: "An update will be shared soon.",
            value: "",
            risk: "",
            decision: "",
            nextStep: "",
            updatedAt: "",
            published: false,
          },
    }));
  const ids = new Set(projects.map((p) => p.id));
  return {
    ...data,
    people: data.people.filter((p) => p.clientVisible !== false),
    projects,
    entries: data.entries.filter(
      (t) => t.managed.projectId && ids.has(t.managed.projectId),
    ),
  };
}
export function analytics(data: PortalData, id: string): ProjectAnalytics {
  const project = data.projects.find((p) => p.id === id);
  if (!project) throw Error("Unknown project");
  const scope = descendants(data.projects, id);
  const ids = new Set(scope.map((p) => p.id));
  const entries = data.entries.filter(
    (t) => t.managed.projectId && ids.has(t.managed.projectId),
  );
  const hours = aggregateHours(entries);
  const forecast = forecastHours(project, hours);
  return {
    hours,
    forecast,
    remaining: Math.max(0, forecast - hours),
    utilization: burnAgainstCap(hours, project.managed.cap).utilization,
    monthly: Array.from({ length: 6 }, (_, i) =>
      entries
        .filter(
          (t) =>
            t.external.date.slice(0, 4) === "2026" &&
            Number(t.external.date.slice(5, 7)) === i + 5,
        )
        .reduce((a, t) => a + t.external.hours, 0),
    ),
    contributors: data.people
      .map((person) => ({
        person,
        hours: entries
          .filter((t) => person.qboIds.includes(t.external.personId))
          .reduce((a, t) => a + t.external.hours, 0),
      }))
      .filter((x) => x.hours > 0),
  };
}
export function portfolio(data: PortalData) {
  const roots = data.projects.filter((p) => !p.managed.parentId);
  const active = data.projects.filter(
    (p) => !["Completed", "Upcoming"].includes(p.managed.status),
  );
  const known = new Set(data.projects.map((p) => p.id));
  const entries = data.entries.filter(
    (t) => t.managed.projectId && known.has(t.managed.projectId),
  );
  const hours = aggregateHours(entries);
  const cap = roots
    .filter((p) => p.managed.status !== "Upcoming")
    .reduce((a, p) => a + p.managed.cap, 0);
  const health = portfolioHealth(data.projects);
  return {
    hours,
    cap,
    utilization: cap ? (hours / cap) * 100 : 0,
    health,
    roots,
    active,
    remaining: roots
      .filter((p) => !["Upcoming", "Completed"].includes(p.managed.status))
      .reduce((a, p) => a + analytics(data, p.id).remaining, 0),
    monthly: Array.from({ length: 6 }, (_, i) => ({
      month: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"][i],
      hours: entries
        .filter(
          (t) =>
            t.external.date.slice(0, 4) === "2026" &&
            Number(t.external.date.slice(5, 7)) === i + 5,
        )
        .reduce((a, t) => a + t.external.hours, 0),
    })),
    mix: data.categories
      .map((c) => ({
        ...c,
        hours: entries
          .filter((t) => t.managed.categoryId === c.id)
          .reduce((a, t) => a + t.external.hours, 0),
      }))
      .filter((c) => c.hours > 0),
  };
}
export function canParent(
  projects: Project[],
  id: string,
  parent: string | null,
) {
  return (
    !parent ||
    (!descendants(projects, id).some((p) => p.id === parent) &&
      projects.some((p) => p.id === parent && !p.managed.parentId))
  );
}
