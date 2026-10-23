import type { PortalRepository } from '../repositories/PortalRepository';
import type { PortalData, Role, Project, ProjectNarrativeUpdate, TeamMemberIdentityMap, WorkOrder, UpcomingProject, ClientViewSetting } from '../domain/types';
import { analytics, portfolio, visibleData } from '../domain/analytics';
import { groupedWorkOrders, attentionItems } from '../domain/intelligence';
import { forecastRecord } from '../domain/metrics';
import { applyExternalPatch } from '../domain/ownership';
import { validateData } from '../domain/validation';
import { AS_OF } from '../data/seed';

/** One cached snapshot per session. Commands serialize, validate, persist, then publish. */
export class PortalService {
 private snapshot?: PortalData;
 private loading?: Promise<PortalData>;
 private queue: Promise<unknown> = Promise.resolve();
 constructor(private readonly repository: PortalRepository, private readonly asOf = AS_OF) {}
 private async current(): Promise<PortalData> {
  if (this.snapshot) return this.snapshot;
  if (!this.loading) this.loading = this.repository.load().then(data => {
   validateData(data); this.snapshot = structuredClone(data); return this.snapshot;
  }).finally(() => { this.loading = undefined; });
  return this.loading;
 }
 async fetchPortfolioData(role: Role = 'client'): Promise<PortalData> {
  const data = structuredClone(await this.current());
  return role === 'client' ? visibleData(data) : data;
 }
 async fetchPortfolio(role: Role = 'client') {
  const data = await this.fetchPortfolioData(role);
  return { data, analytics: portfolio(data), insights: attentionItems(data, this.asOf) };
 }
 async fetchGroupedWorkOrders(role: Role = 'client') { return groupedWorkOrders(await this.fetchPortfolioData(role)); }
 async fetchProjectDetail(id: string, role: Role = 'client') {
  const data = await this.fetchPortfolioData(role);
  const project = this.project(data, id);
  const metrics = analytics(data, id);
  return { project, analytics: metrics, forecast: forecastRecord(project, metrics.hours, this.asOf),
   milestones: project.managed.milestones,
   risks: project.narrative.risk ? [{ projectId: id, description: project.narrative.risk, severity: project.managed.status === 'Delayed' ? 'risk' as const : 'attention' as const }] : [],
   decisions: project.narrative.decision ? [{ projectId: id, description: project.narrative.decision }] : [] };
 }
 async fetchTeamMappings(role: Role): Promise<TeamMemberIdentityMap[]> {
  this.requireAdmin(role);
  return (await this.fetchPortfolioData('admin')).people.map(p => ({ teamMemberId: p.id, externalPersonIds: [...p.qboIds] }));
 }
 async fetchClientViewSettings(role: Role): Promise<ClientViewSetting[]> {
  this.requireAdmin(role);
  return (await this.fetchPortfolioData('admin')).projects.map(p => ({ projectId: p.id, visible: p.managed.visible, narrativePublished: p.narrative.published }));
 }
 private requireAdmin(role: Role) { if (role !== 'admin') throw new Error('Switch to Morris Internal to edit this demo.'); }
 private project(data: PortalData, id: string): Project {
  const project = data.projects.find(p => p.id === id);
  if (!project) throw new Error('Project unavailable.');
  return project;
 }
 private command(role: Role, edit: (data: PortalData) => PortalData): Promise<PortalData> {
  const task = this.queue.then(async () => {
   this.requireAdmin(role);
   const next = edit(structuredClone(await this.current()));
   validateData(next);
   await this.repository.save(next);
   this.snapshot = structuredClone(next);
   return structuredClone(next);
  });
  this.queue = task.catch(() => undefined);
  return task;
 }
 saveInternalEdits(role: Role, id: string, patch: Partial<Project['managed']>) {
  return this.command(role, data => { const p = this.project(data, id); p.managed = { ...p.managed, ...structuredClone(patch) }; return data; });
 }
 saveNarrativeUpdate(role: Role, update: ProjectNarrativeUpdate) {
  return this.command(role, data => { this.project(data, update.projectId).narrative = structuredClone(update.content); return data; });
 }
 toggleClientVisibility(role: Role, id: string, visible: boolean) { return this.saveInternalEdits(role, id, { visible }); }
 createUpcomingProject(role: Role, project: UpcomingProject) {
  return this.command(role, data => {
   if (project.external.workOrder || project.external.qboProjectId || project.managed.status !== 'Upcoming') throw new Error('Upcoming projects must be uninitialized.');
   data.projects.push(structuredClone(project)); return data;
  });
 }
 attachWorkOrder(role: Role, id: string, workOrder: WorkOrder) {
  return this.command(role, data => {
   const p = this.project(data, id);
   if (p.external.workOrder || p.external.qboProjectId) throw new Error('Project already has an external work order.');
   if (!workOrder.workOrder?.trim()) throw new Error('A work order is required.');
   // This is local demo mapping only. No external adapter is invoked.
   const linked = applyExternalPatch(p, { ...workOrder, workOrder: workOrder.workOrder.trim() });
   data.projects = data.projects.map(item => item.id === id ? linked : item);
   return data;
  });
 }
 /** Compatibility command for existing editors. Preserves imported IDs/time and rejects deletion.
  * Manual work-order labels remain editable as in v1; future imports must use separate adapter contracts.
  */
 editWorkspace(role: Role, edit: (data: PortalData) => PortalData) {
  return this.command(role, current => {
   const next = edit(structuredClone(current));
   if (JSON.stringify(current.client) !== JSON.stringify(next.client) || next.version !== current.version) throw new Error('Client context cannot be changed by a project editor.');
   for (const old of current.projects) {
    const p = this.project(next, old.id);
    if (p.external.qboProjectId !== old.external.qboProjectId || p.external.lastSyncedAt !== old.external.lastSyncedAt) throw new Error('Imported project fields are read-only.');
   }
   for (const p of next.projects.filter(p => !current.projects.some(old => old.id === p.id))) {
    if (p.external.qboProjectId || p.external.lastSyncedAt) throw new Error('New manual projects cannot supply imported metadata.');
   }
   if (next.entries.length !== current.entries.length || current.entries.some(old => {
    const entry = next.entries.find(t => t.id === old.id);
    return !entry || JSON.stringify(entry.external) !== JSON.stringify(old.external);
   })) throw new Error('Imported time entries are read-only.');
   return next;
  });
 }
 reset(role: Role) {
  const task = this.queue.then(async () => {
   this.requireAdmin(role);
   const data = await this.repository.reset();
   this.snapshot = structuredClone(data);
   return structuredClone(data);
  });
  this.queue = task.catch(() => undefined);
  return task;
 }
}
