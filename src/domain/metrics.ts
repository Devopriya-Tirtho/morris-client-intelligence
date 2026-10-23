import type { Project, TimeEntry, ForecastRecord } from './types';
export function aggregateHours(entries: TimeEntry[]): number { return entries.reduce((sum, entry) => sum + entry.external.hours, 0); }
export function burnAgainstCap(hours: number, cap: number) {
 return { utilization: cap > 0 ? hours / cap * 100 : 0, remainingCap: Math.max(0, cap - hours), overCap: Math.max(0, hours - cap) };
}
export function isDelayed(project: Project, asOf: string): boolean {
 return !['Completed', 'Upcoming'].includes(project.managed.status) &&
  (project.managed.status === 'Delayed' || (project.managed.progress < 100 && project.managed.end < asOf));
}
export function forecastHours(project: Project, hours: number): number {
 if (project.managed.status === 'Completed') return hours;
 if (project.managed.forecastOverride) return Math.max(hours, project.managed.forecastOverride.hours);
 return project.managed.progress > 0 ? Math.max(hours, Math.round(hours / (project.managed.progress / 100))) : project.managed.cap;
}
/** Elapsed calendar-day pace, not a promised delivery date. Null without observed pace. */
export function forecastRecord(project: Project, hours: number, asOf: string): ForecastRecord {
 const forecast = forecastHours(project, hours);
 const remaining = Math.max(0, forecast - hours);
 const day = 86400000;
 const elapsed = (Date.parse(asOf) - Date.parse(project.managed.start)) / day;
 const active = !['Completed', 'Upcoming'].includes(project.managed.status);
 const days = hours > 0 && elapsed > 0 ? Math.ceil(remaining / (hours / elapsed)) : null;
 return { projectId: project.id, asOf, hours: forecast, remaining,
  estimatedCompletion: active && days !== null ? new Date(Date.parse(asOf) + days * day).toISOString().slice(0,10) : null,
  method: project.managed.status === 'Completed' ? 'actual' : project.managed.forecastOverride ? 'override' : project.managed.progress > 0 ? 'progress' : 'cap' };
}
export function portfolioHealth(projects: Project[]): number {
 const active = projects.filter(p => !['Completed', 'Upcoming'].includes(p.managed.status));
 const scores = { 'On track': 100, Attention: 65, Delayed: 30, Completed: 100, Upcoming: 100 };
 return active.length ? Math.round(active.reduce((sum, p) => sum + scores[p.managed.status], 0) / active.length) : 100;
}
