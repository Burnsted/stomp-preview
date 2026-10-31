/**
 * Offline Trail Pack library — Concept B (Ted lock batch 4).
 * Steel filter tabs; sparse cards; text links Open/Update/Share/Delete.
 */
import { useState } from "react";
import { AlpineTopBar, GlassCard } from "@/components/stomp/alpine-chrome";
import { nativeShare, shareResultNote } from "@/lib/stomp/native-share";
import {
  filterPacks,
  packStats,
  statusLabel,
  useOfflinePacks,
  type PackFilter,
} from "@/lib/stomp/offline-packs";
import { useStomp } from "@/lib/stomp/store";

const FILTERS: { id: PackFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "update", label: "Update" },
  { id: "none", label: "None" },
];

export function OfflineScreen() {
  const packs = useOfflinePacks((s) => s.packs);
  const filter = useOfflinePacks((s) => s.filter);
  const setFilter = useOfflinePacks((s) => s.setFilter);
  const markReady = useOfflinePacks((s) => s.markReady);
  const markUpdate = useOfflinePacks((s) => s.markUpdate);
  const deletePack = useOfflinePacks((s) => s.deletePack);
  const setScreen = useStomp((s) => s.setScreen);
  const [note, setNote] = useState("");
  const stats = packStats(packs);
  const rows = filterPacks(packs, filter);

  return (
    <div className="pb-28" data-testid="offline-screen" data-concept="offline-B">
      <AlpineTopBar title="Offline Packs" />
      <div className="px-4 pt-1">
        <p className="text-sm text-snow/55" data-testid="offline-budget">
          {stats.total} mountains · {stats.usedLabel}
        </p>
        <div className="mt-3 flex gap-1 overflow-x-auto" data-testid="offline-filters">
          {FILTERS.map((f) => {
            const count =
              f.id === "all"
                ? stats.total
                : f.id === "ready"
                  ? stats.ready
                  : f.id === "update"
                    ? stats.update
                    : stats.none;
            return (
              <button
                key={f.id}
                type="button"
                data-testid={`offline-filter-${f.id}`}
                onClick={() => setFilter(f.id)}
                className={
                  "h-10 shrink-0 rounded-xl px-3 text-sm font-semibold " +
                  (filter === f.id
                    ? "bg-steel text-snow ring-1 ring-snow/25"
                    : "bg-snow/5 text-snow/55 ring-1 ring-snow/10")
                }
              >
                {f.label} {count}
              </button>
            );
          })}
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-3 px-4">
        {rows.map((pack) => (
          <li key={pack.id}>
            <GlassCard testId={`offline-pack-${pack.id}`} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-3xl leading-none tracking-wide text-snow">
                    {pack.name}
                  </p>
                  <p className="mt-1 text-sm text-snow/55">
                    {statusLabel(pack.status)}
                    {pack.status !== "none" ? ` · ${pack.sizeMb} MB · ${pack.pins} pins` : ""}
                  </p>
                  <p className="text-sm text-teal/90">Playlist · {pack.playlist}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-snow/80">
                <button
                  type="button"
                  data-testid={`offline-open-${pack.id}`}
                  onClick={() => {
                    if (pack.status === "none") {
                      setNote("Download first.");
                      return;
                    }
                    setScreen("map");
                  }}
                >
                  Open
                </button>
                {pack.status === "update" ? (
                  <button
                    type="button"
                    data-testid={`offline-update-${pack.id}`}
                    onClick={() => {
                      markUpdate(pack.id);
                      setNote(`Updated ${pack.name} on this phone.`);
                    }}
                  >
                    Update
                  </button>
                ) : null}
                {pack.status === "none" ? (
                  <button
                    type="button"
                    data-testid={`offline-download-${pack.id}`}
                    onClick={() => {
                      markReady(pack.id);
                      setNote(`Downloaded ${pack.name} (demo pack).`);
                    }}
                  >
                    Download
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    void nativeShare({
                      title: pack.name,
                      text: `STOMP offline pack · ${pack.name} · ${statusLabel(pack.status)}`,
                    }).then((r) => setNote(shareResultNote(r)))
                  }
                >
                  Share
                </button>
                <button
                  type="button"
                  data-testid={`offline-delete-${pack.id}`}
                  className="ml-auto text-orange"
                  onClick={() => {
                    deletePack(pack.id);
                    setNote(`Removed ${pack.name} pack from this phone.`);
                  }}
                >
                  Delete
                </button>
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>
      {note ? <p className="px-4 pt-2 text-sm font-semibold text-teal">{note}</p> : null}
    </div>
  );
}
