/** In-memory + serializable JSON store (offline-safe). No disk/cloud I/O here. */
export interface KeyValueBackend {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  keys(): string[];
}
export function createMemoryBackend(): KeyValueBackend {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k), set: (k, v) => void m.set(k, v), delete: (k) => void m.delete(k), keys: () => [...m.keys()] };
}
export const STORE_SCHEMA_VERSION = 1;
export interface Envelope<T> { v: number; savedAtIso: string; data: T }

export class LocalJsonStore {
  constructor(private backend: KeyValueBackend = createMemoryBackend(), private ns = "stomp") {}
  private k(key: string) { return `${this.ns}:${key}`; }
  save<T>(key: string, data: T, nowIso: string): void {
    const env: Envelope<T> = { v: STORE_SCHEMA_VERSION, savedAtIso: nowIso, data };
    this.backend.set(this.k(key), JSON.stringify(env));
  }
  load<T>(key: string): T | undefined {
    const raw = this.backend.get(this.k(key));
    if (raw === undefined) return undefined;
    try {
      const env = JSON.parse(raw) as Envelope<T>;
      if (!env || typeof env !== "object" || env.v !== STORE_SCHEMA_VERSION) return undefined;
      return env.data;
    } catch { return undefined; }
  }
  remove(key: string): void { this.backend.delete(this.k(key)); }
  listKeys(): string[] { const p = `${this.ns}:`; return this.backend.keys().filter((x) => x.startsWith(p)).map((x) => x.slice(p.length)); }
  exportAll(): string { const o: Record<string, unknown> = {}; for (const k of this.listKeys()) o[k] = JSON.parse(this.backend.get(this.k(k))!); return JSON.stringify(o); }
  importAll(json: string): number {
    const o = JSON.parse(json) as Record<string, Envelope<unknown>>; let n = 0;
    for (const [k, env] of Object.entries(o)) { if (env && env.v === STORE_SCHEMA_VERSION) { this.backend.set(this.k(k), JSON.stringify(env)); n++; } }
    return n;
  }
}
