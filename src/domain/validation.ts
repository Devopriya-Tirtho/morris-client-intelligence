import type { PortalData } from './types';
import { canParent } from './analytics';
function requireValue(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function unique(values: string[], label: string) { requireValue(new Set(values).size === values.length, `Duplicate ${label}.`); }
function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
export function validateData(data: PortalData): void {
 unique(data.projects.map(p => p.id), 'project ID');
 unique(data.people.map(p => p.id), 'team member ID');
 unique(data.categories.map(p => p.id), 'category ID');
 unique(data.entries.map(p => p.id), 'time entry ID');
 unique(data.projects.flatMap(p => p.external.workOrder ? [p.external.workOrder.trim().toUpperCase()] : []), 'work order');
 unique(data.projects.flatMap(p => p.external.qboProjectId ? [p.external.qboProjectId] : []), 'QBO project ID');
 unique(data.people.flatMap(p => p.qboIds), 'external person identity');
 for (const p of data.projects) {
  const m = p.managed;
  requireValue(m.name.trim(), 'Enter a project name.');
  requireValue(['On track','Attention','Delayed','Completed','Upcoming'].includes(m.status), 'Invalid project status.');
  requireValue(canParent(data.projects, p.id, m.parentId), 'Invalid umbrella mapping.');
  requireValue(!m.parentId || !data.projects.some(child => child.managed.parentId === p.id), 'Move child projects before regrouping this umbrella.');
  requireValue(data.categories.some(c => c.id === m.categoryId), 'Unknown category.');
  requireValue(data.people.some(person => person.id === m.managerId) && m.teamIds.every(id => data.people.some(person => person.id === id)), 'Unknown team member.');
  requireValue(validDate(m.start) && validDate(m.end) && m.end >= m.start, 'Invalid project date range.');
  requireValue([m.cap, m.monthlyCap, m.progress].every(n => Number.isFinite(n) && n >= 0) && m.progress <= 100, 'Invalid cap or progress.');
  if (m.forecastOverride) requireValue(Number.isFinite(m.forecastOverride.hours) && m.forecastOverride.hours >= 0 && m.forecastOverride.reason.trim(), 'Forecast override requires nonnegative hours and a reason.');
 }
 for (const entry of data.entries) {
  requireValue(Number.isFinite(entry.external.hours) && entry.external.hours >= 0, 'Invalid time entry hours.');
  requireValue(!entry.managed.projectId || data.projects.some(p => p.id === entry.managed.projectId), 'Unknown time allocation project.');
  requireValue(!entry.managed.categoryId || data.categories.some(c => c.id === entry.managed.categoryId), 'Unknown time allocation category.');
 }
}
