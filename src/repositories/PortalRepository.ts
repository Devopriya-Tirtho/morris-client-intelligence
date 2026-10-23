import type { PortalData } from '../domain/types';
/** Persistence only: ownership rules and commands live in PortalService. */
export interface PortalRepository {
 load(): Promise<PortalData>;
 save(data: PortalData): Promise<void>;
 reset(): Promise<PortalData>;
}
