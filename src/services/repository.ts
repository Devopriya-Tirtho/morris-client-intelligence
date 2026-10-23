import type {PortalData,PortalRepository,ExternalSyncAdapter} from '../domain/types';
import {seed} from '../data/seed';
const KEY='morris-zagime-prototype-v1';
export class LocalPortalRepository implements PortalRepository {
 async load():Promise<PortalData>{const raw=localStorage.getItem(KEY);if(!raw)return structuredClone(seed);try{const d=JSON.parse(raw) as PortalData;if(d.version===1&&Array.isArray(d.projects)&&Array.isArray(d.entries)&&Array.isArray(d.people)&&Array.isArray(d.categories))return d;}catch{/* Recovery to known seed */}return structuredClone(seed)}
 async save(data:PortalData){localStorage.setItem(KEY,JSON.stringify(data))}
 async reset(){const d=structuredClone(seed);await this.save(d);return d}
}
export const repository:PortalRepository=new LocalPortalRepository();
/** Future server-side integration boundary. No credentials or external calls belong in this browser app. */
export class DisabledExternalAdapter implements ExternalSyncAdapter {
 async readProjects():Promise<never>{throw new Error('External integrations are disabled in this prototype')}
 async readTimeEntries():Promise<never>{throw new Error('External integrations are disabled in this prototype')}
}
