import type { PortalData, Project, ProjectCategory } from "./types";
import { analytics, portfolio } from "./analytics";
import { isDelayed, forecastRecord } from "./metrics";
import { AS_OF } from "../data/seed";
export type Health = "Healthy" | "Watch" | "At risk" | "Complete" | "Planned";
export function utilizationBand(
  value: number,
): "Within plan" | "Approaching cap" | "Over cap" {
  return value > 100
    ? "Over cap"
    : value >= 85
      ? "Approaching cap"
      : "Within plan";
}
export function projectHealth(data: PortalData, p: Project): Health {
  if (p.managed.status === "Completed") return "Complete";
  if (p.managed.status === "Upcoming") return "Planned";
  const a = analytics(data, p.id);
  if (isDelayed(p, AS_OF) || a.utilization > 100) return "At risk";
  return p.managed.status === "Attention" ||
    a.forecast > p.managed.cap ||
    a.utilization >= 85
    ? "Watch"
    : "Healthy";
}
export function hierarchyLabel(data: PortalData, p: Project) {
  if (!p.external.workOrder) return "Upcoming · no work order";
  if (p.managed.parentId) return "Child work order";
  return data.projects.some((c) => c.managed.parentId === p.id)
    ? "Umbrella project"
    : "Standalone project";
}
export function forecastConfidence(p: Project, hours: number) {
  if (p.managed.status === "Completed")
    return {
      label: "Actual delivered",
      detail: "Closed project; forecast equals recorded effort.",
    };
  if (p.managed.forecastOverride)
    return {
      label: "Manager estimate",
      detail: p.managed.forecastOverride.reason,
    };
  if (!hours || !p.managed.progress)
    return {
      label: "Limited evidence",
      detail: "No measured delivery pace yet; estimated cap is used.",
    };
  return {
    label: "Indicative",
    detail:
      "Based on recorded hours and manual progress. Not a statistical confidence score.",
  };
}
export interface ExperienceInsight {
  id: string;
  type:
    | "Positive signal"
    | "Needs attention"
    | "Delivery pace"
    | "Forecast"
    | "Client value"
    | "Suggested next step"
    | "Timeline watch"
    | "Utilization watch";
  projectId?: string;
  title: string;
  body: string;
  rule: string;
  tone: "good" | "watch" | "risk" | "neutral";
}
export function experienceInsights(data: PortalData): ExperienceInsight[] {
  const total = portfolio(data);
  const insights: ExperienceInsight[] = [
    {
      id: "value",
      type: "Client value",
      title: `${total.hours.toLocaleString("en-CA")} hours of partnership`,
      body: `Effort delivered across ${total.mix.length} service areas and ${data.projects.filter((p) => p.managed.status === "Completed").length} completed project items.`,
      rule: "Allocated hours; categories with recorded effort; completed status.",
      tone: "good",
    },
  ];
  for (const p of data.projects) {
    const a = analytics(data, p.id);
    const m = p.managed;
    const add = (
      type: ExperienceInsight["type"],
      title: string,
      body: string,
      rule: string,
      tone: ExperienceInsight["tone"],
    ) =>
      insights.push({
        id: `${p.id}:${type}`,
        type,
        projectId: p.id,
        title,
        body,
        rule,
        tone,
      });
    if (m.status === "Completed") {
      add(
        "Positive signal",
        `${m.name} delivered`,
        p.narrative.value ||
          `${m.milestones.filter((x) => x.done).length} milestones complete.`,
        "Status = Completed.",
        "good",
      );
      continue;
    }
    if (m.status === "Upcoming") {
      if (p.narrative.nextStep)
        add(
          "Suggested next step",
          m.name,
          p.narrative.nextStep,
          "Upcoming project with published next step.",
          "neutral",
        );
      continue;
    }
    if (isDelayed(p, AS_OF))
      add(
        "Timeline watch",
        m.name,
        p.narrative.risk || `Review the ${m.end} target with the project lead.`,
        "Explicitly delayed or unfinished past target as of " + AS_OF + ".",
        "risk",
      );
    if (a.utilization >= 85)
      add(
        "Utilization watch",
        `${Math.round(a.utilization)}% of cap used`,
        m.name,
        "Utilization ≥85%; >100% is over cap.",
        a.utilization > 100 ? "risk" : "watch",
      );
    if (a.forecast > m.cap)
      add(
        "Forecast",
        `${Math.round(a.forecast - m.cap)} hours above plan`,
        m.name,
        "Forecast at completion exceeds cap.",
        "watch",
      );
    if (m.status === "Attention" || p.narrative.decision)
      add(
        "Needs attention",
        m.name,
        p.narrative.decision ||
          p.narrative.risk ||
          "Review with the project lead.",
        "Attention status or published decision.",
        "watch",
      );
    if (a.hours && m.progress)
      add(
        "Delivery pace",
        `${m.progress}% complete · ${Math.round(a.utilization)}% used`,
        m.name,
        "Manual completion versus actual hours / cap; not earned value.",
        "neutral",
      );
    if (p.narrative.nextStep)
      add(
        "Suggested next step",
        m.name,
        p.narrative.nextStep,
        "Published next-step field.",
        "neutral",
      );
  }
  return insights;
}
export function serviceArea(data: PortalData, categoryId: string) {
  const projects = data.projects.filter(
    (p) => p.managed.categoryId === categoryId,
  );
  return {
    projects,
    hours: data.entries
      .filter(
        (t) =>
          t.managed.categoryId === categoryId &&
          data.projects.some((p) => p.id === t.managed.projectId),
      )
      .reduce((s, t) => s + t.external.hours, 0),
    active: projects.filter(
      (p) => !["Completed", "Upcoming"].includes(p.managed.status),
    ).length,
    completed: projects.filter((p) => p.managed.status === "Completed").length,
    upcoming: projects.filter((p) => p.managed.status === "Upcoming").length,
    teamIds: [...new Set(projects.flatMap((p) => p.managed.teamIds))],
    progress: projects.length
      ? Math.round(
          projects.reduce((s, p) => s + p.managed.progress, 0) /
            projects.length,
        )
      : 0,
  };
}
export const sortedCategories = (categories: ProjectCategory[]) =>
  [...categories].sort(
    (a, b) =>
      (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name),
  );
/** Reassign both project metadata and reporting allocations before archiving. Raw time is untouched. */
export function archiveCategory(
  data: PortalData,
  id: string,
  targetId?: string,
): PortalData {
  const next = structuredClone(data),
    category = next.categories.find((c) => c.id === id);
  if (!category) throw Error("Category not found.");
  const used =
    next.projects.some((p) => p.managed.categoryId === id) ||
    next.entries.some((t) => t.managed.categoryId === id);
  const target = next.categories.find(
    (c) => c.id === targetId && !c.archived && c.id !== id,
  );
  if ((used || category.isDefault) && !target)
    throw Error("Choose an active destination before archiving this category.");
  if (target) {
    next.projects.forEach((p) => {
      if (p.managed.categoryId === id) p.managed.categoryId = target.id;
    });
    next.entries.forEach((t) => {
      if (t.managed.categoryId === id) t.managed.categoryId = target.id;
    });
    if (category.isDefault) target.isDefault = true;
  }
  category.archived = true;
  category.isDefault = false;
  return next;
}
export function convertUpcoming(project: Project, workOrder: string): Project {
  if (project.external.workOrder || !workOrder.trim())
    throw Error("Choose an uninitialized project and enter a work order.");
  return {
    ...project,
    external: { ...project.external, workOrder: workOrder.trim() },
    managed: {
      ...project.managed,
      status:
        project.managed.status === "Upcoming"
          ? "On track"
          : project.managed.status,
    },
  };
}
export function projectForecast(data: PortalData, p: Project) {
  return forecastRecord(p, analytics(data, p.id).hours, AS_OF);
}
