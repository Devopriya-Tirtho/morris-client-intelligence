import type { Project, TimeEntry, WorkOrder } from "./types";
/** Explicit allowlists also discard extra properties supplied at runtime. */
export function applyExternalPatch(
  project: Project,
  patch: Partial<WorkOrder>,
): Project {
  const external = { ...project.external };
  if (patch.workOrder !== undefined) external.workOrder = patch.workOrder;
  if (patch.qboProjectId !== undefined)
    external.qboProjectId = patch.qboProjectId;
  if (patch.lastSyncedAt !== undefined)
    external.lastSyncedAt = patch.lastSyncedAt;
  return { ...project, external };
}
export function applyExternalTimePatch(
  entry: TimeEntry,
  patch: TimeEntry["external"],
): TimeEntry {
  const { personId, date, hours, approved, description, workOrder } = patch;
  return {
    ...entry,
    external: {
      personId,
      date,
      hours,
      approved,
      description,
      ...(workOrder !== undefined ? { workOrder } : {}),
    },
  };
}
