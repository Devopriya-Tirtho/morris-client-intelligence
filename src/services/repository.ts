import type { PortalRepository } from '../repositories/PortalRepository';
import { LocalPortalRepository } from '../adapters/mock/LocalPortalRepository';
export { LocalPortalRepository } from '../adapters/mock/LocalPortalRepository';
export { DisabledExternalAdapter } from '../adapters/future/DisabledAdapters';
/** Composition root stays mock-only. Future adapters are never selected here. */
export const repository: PortalRepository = new LocalPortalRepository();
