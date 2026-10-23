import type { Project, TimeEntry } from '../../domain/types';
/** Server-side integration contracts only. Stable IDs must be explicitly reconciled. */
export interface ExternalProjectRecord { projectId: string; external: Project['external'] }
export interface ExternalTimeRecord { entryId: string; external: TimeEntry['external'] }
export interface ExternalSyncAdapter {
 readProjects(): Promise<ExternalProjectRecord[]>;
 readTimeEntries(): Promise<ExternalTimeRecord[]>;
}
