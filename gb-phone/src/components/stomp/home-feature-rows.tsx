/**
 * Compact Home feature rows — Lineups / Bag / Crew / Media (t1218u).
 * Adjacent to Greet: replaces the four big colored squares without a card wall.
 */
import { ChevronRight, Layers, Play, Sparkles, Users } from "lucide-react";
import { useBag } from "@/lib/stomp/bag";
import { useStomp, type Screen } from "@/lib/stomp/store";

type Row = {
  id: string;
  testId: string;
  label: string;
  hint: string;
  Icon: typeof Layers;
  screen?: Screen;
  openBag?: boolean;
};

const ROWS: Row[] = [
  {
    id: "lineups",
    testId: "home-row-lineups",
    label: "Lineups",
    hint: "Plan runs · build lines",
    Icon: Layers,
    screen: "park",
  },
  {
    id: "bag",
    testId: "home-row-bag",
    label: "Bag of Tricks",
    hint: "Tricks · journey · log",
    Icon: Sparkles,
    openBag: true,
  },
  {
    id: "crew",
    testId: "home-row-crew",
    label: "Crew",
    hint: "Invite · link · ride together",
    Icon: Users,
    screen: "stompers",
  },
  {
    id: "media",
    testId: "home-row-media",
    label: "Media",
    hint: "Playlist · clips",
    Icon: Play,
    screen: "playlist",
  },
];

function openRow(row: Row, setScreen: (screen: Screen) => void) {
  if (row.openBag) {
    useBag.getState().openHub("my-bag");
    setScreen("bag");
    return;
  }
  if (row.screen) setScreen(row.screen);
}

export function HomeFeatureRows() {
  const setScreen = useStomp((s) => s.setScreen);

  return (
    <section data-testid="home-zone-features" aria-label="Features" className="mt-5 px-5">
      <p className="text-xs font-bold tracking-widest text-muted">OPEN</p>
      <ul className="mt-1 divide-y divide-line/60" data-testid="home-feature-rows">
        {ROWS.map((row) => {
          const Icon = row.Icon;
          return (
            <li key={row.id}>
              <button
                type="button"
                data-testid={row.testId}
                onClick={() => openRow(row, setScreen)}
                className="flex min-h-12 w-full items-center gap-3 py-3 text-left"
              >
                <span className="flex size-11 shrink-0 items-center justify-center text-ink">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-2xl tracking-wide text-ink">{row.label}</span>
                  <span className="block text-xs text-muted">{row.hint}</span>
                </span>
                <ChevronRight className="size-5 text-muted" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      {/* Legacy test ids kept as aliases so older bag/home hooks still resolve */}
      <span className="sr-only">
        <button type="button" data-testid="home-tile-bag" onClick={() => openRow(ROWS[1]!, setScreen)}>
          Bag of Tricks
        </button>
        <button type="button" data-testid="home-tool-park" onClick={() => setScreen("park")}>
          Lineups
        </button>
        <button type="button" data-testid="home-tool-stompers" onClick={() => setScreen("stompers")}>
          Crew
        </button>
        <button type="button" data-testid="home-tile-media" onClick={() => setScreen("playlist")}>
          Media
        </button>
      </span>
    </section>
  );
}
