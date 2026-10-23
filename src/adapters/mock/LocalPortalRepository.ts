import type { PortalData } from '../../domain/types';
import type { PortalRepository } from '../../repositories/PortalRepository';
import { seed } from '../../data/seed';
export const STORAGE_KEY = 'morris-zagime-prototype-v1';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
/** Existing v1 saves remain valid; optional fields have additive defaults. */
export class LocalPortalRepository implements PortalRepository {
 constructor(private readonly storage: () => StoragePort = () => localStorage) {}
 async load(): Promise<PortalData> {
  const raw = this.storage().getItem(STORAGE_KEY);
  if (raw) {
   try {
    const data = JSON.parse(raw) as PortalData;
    if (data.version === 1 && Array.isArray(data.projects) && Array.isArray(data.entries) && Array.isArray(data.people) && Array.isArray(data.categories)) {
     return { ...data, client: data.client ?? structuredClone(seed.client) };
    }
   } catch { /* Recover malformed JSON to the deterministic seed. */ }
  }
  return structuredClone(seed);
 }
 async save(data: PortalData): Promise<void> { this.storage().setItem(STORAGE_KEY, JSON.stringify(data)); }
 async reset(): Promise<PortalData> { const data = structuredClone(seed); await this.save(data); return data; }
}
