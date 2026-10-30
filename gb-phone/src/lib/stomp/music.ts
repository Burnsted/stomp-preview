export type TrackMeta = {
  id: string;
  name: string;
};

type StoredTrack = TrackMeta & {
  blob: Blob;
};

const DB_NAME = "stomp-music";
const STORE = "tracks";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = fn(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function listTracks(): Promise<TrackMeta[]> {
  return run<StoredTrack[]>("readonly", (store) => store.getAll()).then((rows) =>
    rows.map((row) => ({ id: row.id, name: row.name })),
  );
}

export function saveTrack(file: File): Promise<TrackMeta> {
  const track: StoredTrack = {
    id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name.replace(/\.[^.]+$/, "") || "Track",
    blob: file,
  };
  return run("readwrite", (store) => store.put(track)).then(() => ({ id: track.id, name: track.name }));
}

export function removeTrack(id: string): Promise<void> {
  return run("readwrite", (store) => store.delete(id)).then(() => undefined);
}

export function trackUrl(id: string): Promise<string | null> {
  return run<StoredTrack | undefined>("readonly", (store) => store.get(id)).then((row) =>
    row ? URL.createObjectURL(row.blob) : null,
  );
}
