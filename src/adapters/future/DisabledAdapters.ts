import type { ExternalSyncAdapter } from './contracts';
import type { PortalRepository } from '../../repositories/PortalRepository';
const disabled = (): never => { throw new Error('Live integrations are disabled in this prototype'); };
/** No SDK, credentials, network request, or automatic adapter selection. */
export class DisabledExternalAdapter implements ExternalSyncAdapter {
 async readProjects(): Promise<never> { return disabled(); }
 async readTimeEntries(): Promise<never> { return disabled(); }
}
export class QuickBooksOnlinePlaceholder extends DisabledExternalAdapter {}
export class QuickBooksTimePlaceholder extends DisabledExternalAdapter {}
export class FirebaseRepositoryPlaceholder implements PortalRepository {
 async load(): Promise<never> { return disabled(); }
 async save(): Promise<never> { return disabled(); }
 async reset(): Promise<never> { return disabled(); }
}
