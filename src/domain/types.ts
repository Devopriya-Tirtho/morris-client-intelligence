export type Role = "client" | "admin";
export type Status =
  | "On track"
  | "Attention"
  | "Delayed"
  | "Completed"
  | "Upcoming";
export interface Client {
  id: string;
  name: string;
  partnerName: string;
  synthetic: true;
}
/** External identifiers only. Never carries Morris metadata. */
export interface WorkOrder {
  workOrder: string | null;
  qboProjectId: string | null;
  lastSyncedAt: string | null;
}
export interface Milestone {
  id: string;
  name: string;
  done: boolean;
  targetDate?: string;
}
export interface ForecastOverride {
  hours: number;
  reason: string;
}
export interface ProjectManagement {
  name: string;
  parentId: string | null;
  categoryId: string;
  status: Status;
  start: string;
  end: string;
  cap: number;
  monthlyCap: number;
  progress: number;
  managerId: string;
  teamIds: string[];
  visible: boolean;
  description: string;
  internalNotes: string;
  milestones: Milestone[];
  forecastOverride?: ForecastOverride | null;
}
export interface NarrativeContent {
  summary: string;
  value: string;
  risk: string;
  decision: string;
  nextStep: string;
  updatedAt: string;
  published: boolean;
}
export interface Project {
  id: string;
  external: WorkOrder;
  managed: ProjectManagement;
  narrative: NarrativeContent;
}
export interface UpcomingProject extends Project {
  external: WorkOrder & { workOrder: null; qboProjectId: null };
  managed: ProjectManagement & { status: "Upcoming" };
}
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  initials: string;
  color: string;
  qboIds: string[];
  expertise?: string;
  clientVisible?: boolean;
}
/** Morris-owned display mapping; source IDs on time entries remain unchanged. */
export interface TeamMemberIdentityMap {
  teamMemberId: string;
  externalPersonIds: string[];
}
export interface ProjectCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  icon?: string;
  order?: number;
  archived?: boolean;
  isDefault?: boolean;
}
export type Person = TeamMember;
export type Category = ProjectCategory;
export interface TimeEntry {
  id: string;
  external: {
    personId: string;
    date: string;
    hours: number;
    approved: boolean;
    description: string;
    workOrder?: string | null;
  };
  managed: { projectId: string | null; categoryId: string | null };
}
/** Views derived from canonical project fields; not parallel mutable stores. */
export interface ProjectGroup {
  id: string;
  parent: Project;
  children: Project[];
  workOrders: WorkOrder[];
  analytics: ProjectAnalytics;
}
export interface ProjectNarrativeUpdate {
  projectId: string;
  content: NarrativeContent;
}
export interface RiskIssue {
  projectId: string;
  description: string;
  severity: "attention" | "risk";
}
export interface DecisionItem {
  projectId: string;
  description: string;
}
export interface ClientViewSetting {
  projectId: string;
  visible: boolean;
  narrativePublished: boolean;
}
export interface ForecastRecord {
  projectId: string;
  asOf: string;
  hours: number;
  remaining: number;
  estimatedCompletion: string | null;
  method: "actual" | "override" | "progress" | "cap";
}
export interface PortfolioInsight {
  id: string;
  projectId: string;
  kind: "delay" | "cap" | "decision" | "risk";
  severity: "attention" | "risk";
  message: string;
}
export interface PortalData {
  version: 1;
  client?: Client;
  projects: Project[];
  people: Person[];
  categories: Category[];
  entries: TimeEntry[];
}
export interface ProjectAnalytics {
  hours: number;
  remaining: number;
  forecast: number;
  utilization: number;
  monthly: number[];
  contributors: { person: Person; hours: number }[];
}
// Compatibility exports for consumers of the original prototype API.
export type { PortalRepository } from "../repositories/PortalRepository";
export type { ExternalSyncAdapter } from "../adapters/future/contracts";
