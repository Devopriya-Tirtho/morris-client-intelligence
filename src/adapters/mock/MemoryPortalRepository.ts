import type { PortalData } from '../../domain/types';
import type { PortalRepository } from '../../repositories/PortalRepository';
import { seed } from '../../data/seed';
/** Isolated mock adapter for service tests and non-browser demos. */
export class MemoryPortalRepository implements PortalRepository {
 private data: PortalData;
 constructor(private readonly initial: PortalData = seed) { this.data = structuredClone(initial); }
 async load() { return structuredClone(this.data); }
 async save(data: PortalData) { this.data = structuredClone(data); }
 async reset() { this.data = structuredClone(this.initial); return this.load(); }
}
