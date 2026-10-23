/** Local demo identifiers, not security tokens. Supports HTTP development previews. */
export function newId():string {return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`}
