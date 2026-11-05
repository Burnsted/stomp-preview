/**
 * Bag of Tricks — alpine phone screens from Ted reference boards 2026-10-31.
 * Verbatim microcopy from INTEGRATION-LOG; SCOPE locks for counts/filters/nav.
 */
import { useEffect } from "react";
import {
  Camera,
  Check,
  ChevronRight,
  Layers,
  Lock,
  Mic,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  Trophy,
  Users,
  Waves,
} from "lucide-react";
import { AlpineWordmark, FavHeart, GlassCard, HeySessionCompact } from "@/components/stomp/alpine-chrome";
import { DemoSimBadge } from "@/components/stomp/playtest/demo-sim-badge";
import {
  BAG_TAGLINE,
  BEGINNER_LEARN,
  CHALLENGES,
  FEATURED_TRICK_ID,
  JOURNEY,
  LEVEL_BLURB,
  LEVEL_COUNTS,
  LOG_METHODS,
  MOTION_ANALYSIS,
  OLLIE_PRO_TIP,
  OLLIE_STEPS,
  PROGRESS_STATS,
  bagCounts,
  bagThumb,
  filterLearn,
  filterMyBag,
  formatPreroll,
  trickByBagId,
  trickStatusLabel,
  useBag,
  type BagFilter,
  type ChallengeTab,
  type LearnFilter,
  type LogMethod,
  type PracticeSpeed,
} from "@/lib/stomp/bag";
import { BAND_LABEL, type Band } from "@/lib/stomp/library";
import { useStomp } from "@/lib/stomp/store";

function BagHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const setScreen = useStomp((s) => s.setScreen);
  return (
    <header className="flex items-center gap-2 px-4 pt-5 pb-2" data-testid="bag-header">
      {onBack ? (
        <button
          type="button"
          data-testid="bag-back"
          onClick={onBack}
          className="text-sm font-semibold text-ink"
          aria-label="Back"
        >
          ←
        </button>
      ) : (
        <AlpineWordmark size="sm" onClick={() => setScreen("greet")} />
      )}
      <h1 className="min-w-0 flex-1 truncate font-display text-3xl tracking-wide text-ink">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <DemoSimBadge label="Demo" testId="bag-demo-badge" />
        {right}
        <HeySessionCompact />
      </div>
    </header>
  );
}

function HubTabs() {
  const hubTab = useBag((s) => s.hubTab);
  const setHubTab = useBag((s) => s.setHubTab);
  const openView = useBag((s) => s.openView);
  const tabs = [
    { id: "my-bag" as const, label: "My Bag" },
    { id: "learn" as const, label: "Learn" },
    { id: "challenges" as const, label: "Challenges" },
  ];
  return (
    <div className="mt-3 flex justify-center gap-5 px-4" data-testid="bag-hub-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          data-testid={`bag-tab-${t.id}`}
          onClick={() => {
            if (t.id === "challenges") {
              setHubTab("challenges");
              openView("challenges");
            } else {
              setHubTab(t.id);
              openView("hub");
            }
          }}
          className={
            "pb-1 text-sm font-semibold " +
            (hubTab === t.id ? "border-b-2 border-teal text-ink" : "text-muted")
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function LevelCards({ onOpen }: { onOpen: (band: Band) => void }) {
  const levels: Band[] = ["beginner", "intermediate", "advanced"];
  const edge =
    {
      beginner: "from-sky-400/80 via-teal/40 to-transparent",
      intermediate: "from-violet-400/80 via-pink/30 to-transparent",
      advanced: "from-amber-300/70 via-pink/40 to-transparent",
    } as const;
  return (
    <div className="mt-4 flex flex-col gap-3 px-4" data-testid="bag-level-cards">
      {levels.map((band) => (
        <button
          key={band}
          type="button"
          data-testid={`bag-level-${band}`}
          onClick={() => onOpen(band)}
          className="relative overflow-hidden rounded-3xl text-left ring-1 ring-white/10"
        >
          <img
            src={bagThumb(band === "beginner" ? "ollie" : band === "intermediate" ? "fs180" : "tail-grab")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${edge[band]} opacity-90`} />
          <div className="relative flex min-h-[5.5rem] items-end justify-between bg-gradient-to-t from-navy/95 via-navy/55 to-transparent px-4 pb-3 pt-10">
            <div>
              <p className="font-display text-3xl tracking-wide text-ink">{BAND_LABEL[band]}</p>
              <p className="text-sm text-ink/80">
                {LEVEL_BLURB[band]}. {LEVEL_COUNTS[band]} tricks.
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg viewBox="0 0 72 72" className="size-16" aria-hidden="true">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#2ad4c2"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="40" textAnchor="middle" className="fill-ink text-[14px] font-bold">
        {percent}%
      </text>
    </svg>
  );
}

function HubMyBag() {
  const openView = useBag((s) => s.openView);
  const openTrick = useBag((s) => s.openTrick);
  const openLearnBand = useBag((s) => s.openLearnBand);
  const startPreroll = useBag((s) => s.startPreroll);
  const setLogMethod = useBag((s) => s.setLogMethod);
  const myBag = useBag((s) => s.myBag);
  const featured = trickByBagId(FEATURED_TRICK_ID)!;
  const recent = myBag.slice(0, 4);

  return (
    <div data-testid="bag-hub-my-bag" className="pb-28">
      <LevelCards onOpen={openLearnBand} />

      <GlassCard className="mx-4 mt-4" testId="bag-featured">
        <div className="relative h-36 overflow-hidden rounded-2xl">
          <img src={bagThumb(featured.id)} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-navy/70 text-ink">
              <Play className="size-5" fill="currentColor" />
            </span>
          </span>
          <span className="absolute bottom-2 left-2 text-[10px] font-bold tracking-[0.2em] text-lime drop-shadow">
            INTERMEDIATE
          </span>
        </div>
        <p className="mt-3 font-display text-3xl tracking-wide text-ink">{featured.name}</p>
        <p className="mt-1 text-sm text-pretty text-muted">{featured.detail}</p>
        <div className="mt-3 flex justify-center gap-6">
          {(["learn", "practice", "log"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              data-testid={`bag-featured-${tab}`}
              onClick={() => openTrick(featured.id, tab === "log" ? "log" : tab)}
              className="pb-0.5 text-sm font-semibold text-ink/90 hover:text-teal"
            >
              {tab === "learn" ? "Learn" : tab === "practice" ? "Practice" : "Log"}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="mx-4 mt-3" testId="bag-my-progress">
        <div className="flex items-center gap-3">
          <ProgressRing percent={PROGRESS_STATS.percent} />
          <div>
            <p className="text-xs font-bold tracking-widest text-teal">MY PROGRESS</p>
            <p className="text-sm font-semibold text-ink">{PROGRESS_STATS.landed} landed</p>
            <p className="text-sm text-muted">{PROGRESS_STATS.inProgress} in progress</p>
            <p className="text-sm text-muted">{PROGRESS_STATS.toNext} to next level</p>
          </div>
          <button
            type="button"
            data-testid="bag-open-journey"
            onClick={() => openView("journey")}
            className="ml-auto text-teal"
            aria-label="Trick Journey"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </GlassCard>

      <GlassCard className="mx-4 mt-3" testId="bag-quick-log">
        <p className="text-xs font-bold tracking-widest text-muted">QUICK LOG</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            data-testid="bag-quick-preroll"
            onClick={() => {
              setLogMethod("preroll");
              openTrick(FEATURED_TRICK_ID, "log");
              startPreroll();
            }}
            className="flex flex-col items-center gap-1 rounded-2xl bg-snow/5 py-3 ring-1 ring-line"
          >
            <Mic className="size-5 text-lime" />
            <span className="text-[11px] font-semibold">Pre-Roll</span>
          </button>
          <button
            type="button"
            data-testid="bag-quick-log-trick"
            onClick={() => openTrick(FEATURED_TRICK_ID, "log")}
            className="flex flex-col items-center gap-1 rounded-2xl bg-snow/5 py-3 ring-1 ring-line"
          >
            <Check className="size-5 text-teal" />
            <span className="text-[11px] font-semibold">Log Trick</span>
          </button>
          <button
            type="button"
            data-testid="bag-quick-lineup"
            onClick={() => openView("add")}
            className="flex flex-col items-center gap-1 rounded-2xl bg-snow/5 py-3 ring-1 ring-line"
          >
            <Plus className="size-5 text-teal" />
            <span className="text-[11px] font-semibold">Add to Lineup</span>
          </button>
        </div>
      </GlassCard>

      <section className="mt-4 px-4" data-testid="bag-recent">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-muted">RECENT TRICKS</p>
          <button
            type="button"
            data-testid="bag-recent-all"
            onClick={() => openView("my-bag-list")}
            className="text-sm font-semibold text-teal"
          >
            All ({PROGRESS_STATS.all}) ›
          </button>
        </div>
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {recent.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => openView("progress")}
                className="w-28 rounded-2xl bg-snow/5 p-2 text-left ring-1 ring-line"
              >
                <img src={bagThumb(t.id)} alt="" className="aspect-square w-full rounded-xl object-cover" />
                <p className="mt-1 truncate text-xs font-semibold text-ink">{t.name}</p>
                <p className="flex items-center gap-1 truncate text-[10px] text-muted">
                  {t.status === "landed" ? <Check className="size-3 shrink-0 text-lime" aria-hidden="true" /> : null}
                  {trickStatusLabel(t)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-3 px-4 text-sm text-muted" data-testid="bag-self-reported-note">
        Marks here are self-reported on this phone. Confirmed clips stay on Rider history.
      </p>
    </div>
  );
}

function HubLearn() {
  const openLearnBand = useBag((s) => s.openLearnBand);
  const openView = useBag((s) => s.openView);
  return (
    <div data-testid="bag-hub-learn" className="pb-28">
      <LevelCards onOpen={openLearnBand} />
      <GlassCard className="mx-4 mt-4" testId="bag-your-progress">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-widest text-teal">YOUR PROGRESS</p>
            <p className="mt-1 text-sm text-ink">
              {PROGRESS_STATS.landed} landed • {PROGRESS_STATS.inProgress} in progress • {PROGRESS_STATS.toNext} to next level
            </p>
          </div>
          <ProgressRing percent={PROGRESS_STATS.percent} />
        </div>
        <button
          type="button"
          data-testid="bag-learn-to-journey"
          onClick={() => openView("journey")}
          className="mt-3 h-10 w-full rounded-full bg-snow/10 text-sm font-semibold text-ink ring-1 ring-line"
        >
          Trick Journey
        </button>
      </GlassCard>
    </div>
  );
}

function MyBagList() {
  const myBag = useBag((s) => s.myBag);
  const bagFilter = useBag((s) => s.bagFilter);
  const setBagFilter = useBag((s) => s.setBagFilter);
  const openView = useBag((s) => s.openView);
  const openTrick = useBag((s) => s.openTrick);
  const back = useBag((s) => s.back);
  const counts = bagCounts(myBag);
  const rows = filterMyBag(myBag, bagFilter);
  const filters: { id: BagFilter; label: string }[] = [
    { id: "all", label: `All (${counts.all})` },
    { id: "landed", label: `Landed (${counts.landed})` },
    { id: "progress", label: `In Progress (${counts.progress})` },
  ];

  return (
    <div className="pb-28" data-testid="bag-my-list">
      <BagHeader title="My Bag of Tricks" onBack={back} />
      <div className="mt-2 flex justify-center gap-5 px-4" data-testid="bag-list-filters">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            data-testid={`bag-filter-${f.id}`}
            onClick={() => setBagFilter(f.id)}
            className={
              "pb-1 text-sm font-semibold " +
              (bagFilter === f.id ? "border-b-2 border-teal text-ink" : "text-muted")
            }
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-2 px-4">
        {rows.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              data-testid={`bag-row-${t.id}`}
              onClick={() => {
                openTrick(t.id);
                if (t.status === "progress") openView("progress");
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-snow/5 px-3 py-3 text-left ring-1 ring-line"
            >
              <img src={bagThumb(t.id)} alt="" className="size-12 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{t.name}</span>
                <span className="block text-xs text-muted">{trickStatusLabel(t)}</span>
              </span>
              {t.status === "landed" ? (
                <Check className="size-5 text-lime" aria-label="Landed" />
              ) : (
                <span className="text-[10px] font-semibold tracking-wide text-amber-400">IN PROGRESS</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="px-4 pt-4">
        <button
          type="button"
          data-testid="bag-add-trick"
          onClick={() => openView("add")}
          className="h-14 w-full rounded-full bg-lime font-bold text-navy"
        >
          + Add Trick
        </button>
      </div>
    </div>
  );
}

function LearnList() {
  const learnBand = useBag((s) => s.learnBand);
  const learnFilter = useBag((s) => s.learnFilter);
  const setLearnFilter = useBag((s) => s.setLearnFilter);
  const openTrick = useBag((s) => s.openTrick);
  const back = useBag((s) => s.back);
  const rows = filterLearn(BEGINNER_LEARN, learnFilter);
  const filters: { id: LearnFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "flat", label: "Flat Ground" },
    { id: "jumps", label: "Jumps" },
    { id: "boxes", label: "Boxes/Rails" },
  ];

  return (
    <div className="pb-28" data-testid="bag-learn-list">
      <BagHeader
        title={`${BAND_LABEL[learnBand]} Tricks`}
        onBack={back}
        right={<Search className="size-5 text-muted" aria-hidden="true" />}
      />
      <div className="mt-2 flex gap-4 overflow-x-auto px-4" data-testid="bag-learn-filters">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            data-testid={`bag-learn-filter-${f.id}`}
            onClick={() => setLearnFilter(f.id)}
            className={
              "shrink-0 pb-1 text-sm font-semibold " +
              (learnFilter === f.id ? "border-b-2 border-teal text-ink" : "text-muted")
            }
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-2 px-4">
        {rows.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              data-testid={`bag-learn-row-${t.id}`}
              onClick={() => openTrick(t.id, "learn")}
              className="flex w-full items-center gap-3 rounded-2xl bg-snow/5 px-3 py-3 text-left ring-1 ring-line"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                <img src={bagThumb(t.id)} alt="" className="h-full w-full object-cover" />
                <Play className="absolute inset-0 m-auto size-5 text-ink drop-shadow" />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{t.name}</span>
                <span className="block text-xs text-muted">{t.blurb}</span>
              </span>
              <ChevronRight className="size-4 text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrickDetail() {
  const id = useBag((s) => s.activeTrickId);
  const detailTab = useBag((s) => s.detailTab);
  const setDetailTab = useBag((s) => s.setDetailTab);
  const favorited = useBag((s) => s.favorited.includes(id));
  const toggleFavorite = useBag((s) => s.toggleFavorite);
  const markLanded = useBag((s) => s.markLanded);
  const openView = useBag((s) => s.openView);
  const back = useBag((s) => s.back);
  const trick = trickByBagId(id) ?? BEGINNER_LEARN[0];
  const steps = trick.id === "ollie" ? OLLIE_STEPS : OLLIE_STEPS;

  return (
    <div className="pb-28" data-testid="bag-trick-detail">
      <BagHeader
        title={trick.name}
        onBack={back}
        right={
          <div className="flex items-center gap-1">
            <Share2 className="size-4 text-muted" aria-hidden="true" />
            <FavHeart saved={favorited} onToggle={() => toggleFavorite(id)} />
          </div>
        }
      />
      <div className="px-4">
        <div className="relative h-44 overflow-hidden rounded-3xl">
          <img src={bagThumb(trick.id)} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-navy/65">
              <Play className="size-6 text-ink" fill="currentColor" />
            </span>
          </span>
        </div>
        <span className="mt-3 inline-block text-[10px] font-bold tracking-[0.2em] text-lime">
          {BAND_LABEL[trick.band].toUpperCase()}
        </span>
        <p className="mt-2 text-pretty text-sm text-muted">{trick.detail}</p>
        <div className="mt-3 flex justify-center gap-5" data-testid="bag-detail-tabs">
          {([
            { id: "learn" as const, label: "Learn" },
            { id: "practice" as const, label: "Practice" },
            { id: "log" as const, label: "Log It" },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`bag-detail-tab-${t.id}`}
              onClick={() => setDetailTab(t.id)}
              className={
                "pb-1 text-sm font-semibold " +
                (detailTab === t.id ? "border-b-2 border-teal text-ink" : "text-muted")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        {detailTab === "learn" ? (
          <ul className="mt-4 flex flex-col gap-2" data-testid="bag-tutorial-steps">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-3 rounded-2xl bg-snow/5 px-3 py-3 ring-1 ring-line">
                <img src={bagThumb(trick.id)} alt="" className="size-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{step.title}</p>
                  <p className="text-xs text-muted">{step.seconds}</p>
                </div>
                <ChevronRight className="size-4 text-muted" />
              </li>
            ))}
            <li>
              <button type="button" className="flex w-full items-center justify-between rounded-2xl bg-snow/5 px-3 py-3 ring-1 ring-line">
                <span className="font-semibold text-ink">Tutorial (Video)</span>
                <ChevronRight className="size-4 text-muted" />
              </button>
            </li>
            <li>
              <button type="button" className="flex w-full items-center justify-between rounded-2xl bg-snow/5 px-3 py-3 ring-1 ring-line">
                <span className="font-semibold text-ink">Tips & Common Mistakes</span>
                <ChevronRight className="size-4 text-muted" />
              </button>
            </li>
            <li>
              <button type="button" className="flex w-full items-center justify-between rounded-2xl bg-snow/5 px-3 py-3 ring-1 ring-line">
                <span className="font-semibold text-ink">Motion Example (Ghost Run)</span>
                <ChevronRight className="size-4 text-muted" />
              </button>
            </li>
          </ul>
        ) : null}
        <button
          type="button"
          data-testid="bag-mark-landed"
          onClick={() => {
            markLanded(trick.id);
            openView("my-bag-list");
          }}
          className="mt-4 h-14 w-full rounded-full bg-lime font-bold text-navy"
        >
          ✓ Mark as Landed
        </button>
      </div>
    </div>
  );
}

function PracticeMode() {
  const id = useBag((s) => s.activeTrickId);
  const speed = useBag((s) => s.practiceSpeed);
  const setPracticeSpeed = useBag((s) => s.setPracticeSpeed);
  const back = useBag((s) => s.back);
  const trick = trickByBagId(id) ?? BEGINNER_LEARN[0];
  const speeds: { id: PracticeSpeed; label: string }[] = [
    { id: "slow", label: "Slow (0.5x)" },
    { id: "normal", label: "Normal (1x)" },
    { id: "loop", label: "Loop (∞)" },
  ];

  return (
    <div className="pb-28" data-testid="bag-practice">
      <BagHeader title="Practice Mode" onBack={back} />
      <p className="px-4 text-sm text-muted">{trick.name}</p>
      <div className="relative mx-4 mt-3 h-52 overflow-hidden rounded-3xl">
        <img src={bagThumb(trick.id)} alt="" className="h-full w-full object-cover" />
        <span className="absolute top-2 right-2 rounded-md bg-navy/70 px-2 py-0.5 text-[10px] font-bold text-teal">
          AR
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <Play className="size-10 text-ink drop-shadow" fill="currentColor" />
        </span>
      </div>
      <div className="mt-3 flex justify-center gap-5 px-4" data-testid="bag-practice-speed">
        {speeds.map((s) => (
          <button
            key={s.id}
            type="button"
            data-testid={`bag-speed-${s.id}`}
            onClick={() => setPracticeSpeed(s.id)}
            className={
              "pb-1 text-xs font-semibold " +
              (speed === s.id ? "border-b-2 border-lime text-ink" : "text-muted")
            }
          >
            {s.label}
          </button>
        ))}
      </div>
      <GlassCard className="mx-4 mt-4" testId="bag-pro-tip">
        <p className="text-xs font-bold tracking-widest text-amber-400">PRO TIP</p>
        <p className="mt-1 text-pretty text-sm text-ink">{OLLIE_PRO_TIP}</p>
      </GlassCard>
    </div>
  );
}

function LogTrick() {
  const id = useBag((s) => s.activeTrickId);
  const method = useBag((s) => s.logMethod);
  const setLogMethod = useBag((s) => s.setLogMethod);
  const startPreroll = useBag((s) => s.startPreroll);
  const markLanded = useBag((s) => s.markLanded);
  const addToBag = useBag((s) => s.addToBag);
  const openView = useBag((s) => s.openView);
  const back = useBag((s) => s.back);
  const trick = trickByBagId(id) ?? BEGINNER_LEARN[0];

  function primary() {
    if (method === "preroll") {
      startPreroll();
      return;
    }
    if (method === "rider" || method === "crew") {
      markLanded(trick.id);
      addToBag(trick.id, "landed");
      openView("my-bag-list");
      return;
    }
    // motion stub → review
    openView("review");
  }

  return (
    <div className="pb-28" data-testid="bag-log">
      <BagHeader title="Log Trick" onBack={back} />
      <div className="px-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-snow/10 px-3 py-1.5 ring-1 ring-line">
          <img src={bagThumb(trick.id)} alt="" className="size-6 rounded-full object-cover" />
          <span className="text-sm font-semibold text-ink">{trick.name}</span>
        </div>
        <p className="mt-4 text-sm font-semibold text-ink">How do you want to log it?</p>
        <ul className="mt-3 flex flex-col gap-2" data-testid="bag-log-methods">
          {LOG_METHODS.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                data-testid={`bag-log-method-${m.id}`}
                onClick={() => setLogMethod(m.id)}
                className={
                  "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left ring-1 " +
                  (method === m.id ? "bg-lime/15 ring-lime" : "bg-snow/5 ring-line")
                }
              >
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-navy text-teal">
                  {m.id === "preroll" ? (
                    <Mic className="size-4" />
                  ) : m.id === "motion" ? (
                    <Waves className="size-4" />
                  ) : m.id === "crew" ? (
                    <Users className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </span>
                <span>
                  <span className="block font-semibold text-ink">{m.title}</span>
                  <span className="block text-xs text-muted">{m.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          data-testid="bag-log-primary"
          onClick={primary}
          className="mt-4 h-14 w-full rounded-full bg-lime font-bold text-navy"
        >
          {method === "preroll" ? "Start Pre-Roll" : method === "motion" ? "Start Motion Capture" : "Confirm Landing"}
        </button>
      </div>
    </div>
  );
}

function PreRoll() {
  const seconds = useBag((s) => s.prerollSeconds);
  const active = useBag((s) => s.prerollActive);
  const tickPreroll = useBag((s) => s.tickPreroll);
  const stopPreroll = useBag((s) => s.stopPreroll);
  const back = useBag((s) => s.back);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => tickPreroll(), 1000);
    return () => window.clearInterval(id);
  }, [active, tickPreroll]);

  return (
    <div className="pb-28" data-testid="bag-preroll">
      <BagHeader title="Pre-Roll" onBack={back} />
      <div className="flex flex-col items-center px-4 pt-10">
        <div className="relative flex size-40 items-center justify-center rounded-full ring-4 ring-lime/60">
          <div className="absolute inset-2 rounded-full ring-2 ring-teal/40" />
          <Layers className="size-14 text-teal" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-bold tracking-[0.25em] text-lime">PRE-ROLL ACTIVE</p>
        <div className="mt-3 flex h-8 items-end gap-0.5" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-lime"
              style={{ height: `${8 + ((i * 7) % 20)}px` }}
            />
          ))}
        </div>
        <p className="mt-2 font-display text-4xl tabular-nums text-ink" data-testid="bag-preroll-timer">
          {formatPreroll(seconds)}
        </p>
        <button
          type="button"
          data-testid="bag-preroll-stop"
          onClick={stopPreroll}
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-snow font-bold text-navy"
        >
          <Pause className="size-5" />
          Stop & Review
        </button>
      </div>
    </div>
  );
}

function ReviewAttempt() {
  const id = useBag((s) => s.activeTrickId);
  const outcome = useBag((s) => s.reviewOutcome);
  const setReviewOutcome = useBag((s) => s.setReviewOutcome);
  const addToBag = useBag((s) => s.addToBag);
  const markLanded = useBag((s) => s.markLanded);
  const markProgress = useBag((s) => s.markProgress);
  const back = useBag((s) => s.back);
  const trick = trickByBagId(id) ?? BEGINNER_LEARN[0];

  return (
    <div className="pb-28" data-testid="bag-review">
      <BagHeader title="Review Attempt" onBack={back} />
      <div className="px-4">
        <div className="relative h-40 overflow-hidden rounded-3xl">
          <img src={bagThumb(trick.id)} alt="" className="h-full w-full object-cover" />
          <Play className="absolute inset-0 m-auto size-10 text-ink drop-shadow" fill="currentColor" />
        </div>
        <GlassCard className="mt-3" testId="bag-motion-analysis">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-widest text-muted">MOTION ANALYSIS (PHONE / META)</p>
            <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-bold text-lime">
              Motion Supported
            </span>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {MOTION_ANALYSIS.map((row) => (
              <li key={row.label} className="flex items-center gap-2 text-sm text-ink">
                <Check className="size-4 text-lime" />
                {row.label}
              </li>
            ))}
          </ul>
        </GlassCard>
        <ul className="mt-3 flex flex-col gap-2">
          {(
            [
              { id: "stomped" as const, label: "Stomped it (Landed)" },
              { id: "working" as const, label: "Still working on it" },
              { id: "lineup" as const, label: "Add to Lineup" },
            ] as const
          ).map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                data-testid={`bag-review-${opt.id}`}
                onClick={() => setReviewOutcome(opt.id)}
                className={
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ring-1 " +
                  (outcome === opt.id ? "bg-lime/15 ring-lime" : "bg-snow/5 ring-line")
                }
              >
                <span
                  className={
                    "flex size-5 items-center justify-center rounded border " +
                    (outcome === opt.id ? "border-lime bg-lime text-navy" : "border-line")
                  }
                >
                  {outcome === opt.id ? <Check className="size-3" /> : null}
                </span>
                <span className="font-semibold text-ink">{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          data-testid="bag-review-add"
          onClick={() => {
            if (outcome === "stomped") {
              markLanded(trick.id);
              addToBag(trick.id, "landed");
            } else if (outcome === "working") {
              markProgress(trick.id);
              addToBag(trick.id, "progress");
            } else {
              addToBag(trick.id, "progress");
            }
          }}
          className="mt-4 h-14 w-full rounded-full bg-lime font-bold text-navy"
        >
          Add to My Bag
        </button>
      </div>
    </div>
  );
}

function TrickJourney() {
  const back = useBag((s) => s.back);
  return (
    <div className="pb-28" data-testid="bag-journey">
      <BagHeader title="Trick Journey" onBack={back} />
      <div className="px-4">
        <GlassCard testId="bag-rider-level">
          <p className="text-xs font-bold tracking-widest text-teal">RIDER LEVEL</p>
          <p className="font-display text-4xl tracking-wide text-ink">{JOURNEY.level}</p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {JOURNEY.landed} / {JOURNEY.total} Tricks
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-snow/10">
            <div className="h-full rounded-full bg-teal" style={{ width: `${JOURNEY.percent}%` }} />
          </div>
          <p className="mt-1 text-right text-sm font-bold text-teal">{JOURNEY.percent}%</p>
        </GlassCard>
        <p className="mt-4 text-xs font-bold tracking-widest text-muted">YOUR PROGRESS</p>
        <ul className="mt-2 flex flex-col gap-2">
          {JOURNEY.byLevel.map((row) => (
            <li key={row.band} className="flex items-center justify-between rounded-2xl bg-snow/5 px-4 py-3 ring-1 ring-line">
              <span className="font-semibold text-ink">{BAND_LABEL[row.band]}</span>
              <span className="flex items-center gap-2 text-sm text-muted">
                {row.done} / {row.total}
                {row.locked ? <Lock className="size-4 text-pink" /> : row.done === row.total ? <Check className="size-4 text-lime" /> : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs font-bold tracking-widest text-muted">RECENT UNLOCKS</p>
        <div className="mt-2 flex gap-2">
          {JOURNEY.unlocks.map((name) => (
            <span key={name} className="rounded-2xl bg-snow/5 px-3 py-2 text-sm font-semibold text-ink ring-1 ring-line">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrickChallenges() {
  const tab = useBag((s) => s.challengeTab);
  const setChallengeTab = useBag((s) => s.setChallengeTab);
  const back = useBag((s) => s.back);
  const tabs: { id: ChallengeTab; label: string }[] = [
    { id: "crew", label: "Crew" },
    { id: "weekly", label: "Weekly" },
    { id: "season", label: "Season" },
  ];
  const rows = CHALLENGES.filter((c) => c.tab === tab);

  return (
    <div className="pb-28" data-testid="bag-challenges">
      <BagHeader
        title="Trick Challenges"
        onBack={back}
        right={<Trophy className="size-5 text-lime" aria-hidden="true" />}
      />
      <div className="mt-2 flex justify-center gap-5 px-4" data-testid="bag-challenge-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            data-testid={`bag-challenge-tab-${t.id}`}
            onClick={() => setChallengeTab(t.id)}
            className={
              "pb-1 text-sm font-semibold " +
              (tab === t.id ? "border-b-2 border-teal text-ink" : "text-muted")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-3 px-4">
        {rows.map((c) => (
          <li key={c.id}>
            <GlassCard testId={`bag-challenge-${c.id}`}>
              <p className="font-display text-2xl tracking-wide text-ink">{c.title}</p>
              <p className="mt-1 text-sm text-muted">{c.detail}</p>
              <div className="mt-2 flex items-center justify-between text-xs font-bold">
                <span className="text-lime">{c.reward}</span>
                <span className="text-muted">{c.meta}</span>
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>
      <div className="px-4 pt-4">
        <button
          type="button"
          data-testid="bag-create-callout"
          className="h-14 w-full rounded-full bg-lime font-bold text-navy"
        >
          + Create Callout
        </button>
      </div>
    </div>
  );
}

function AddToBag() {
  const tab = useBag((s) => s.addTab);
  const setAddTab = useBag((s) => s.setAddTab);
  const id = useBag((s) => s.activeTrickId);
  const openTrick = useBag((s) => s.openTrick);
  const back = useBag((s) => s.back);
  const trick = trickByBagId(id) ?? BEGINNER_LEARN[0];
  const tabs = [
    { id: "record" as const, label: "Record" },
    { id: "upload" as const, label: "Upload" },
    { id: "session" as const, label: "From Session" },
  ];

  return (
    <div className="pb-28" data-testid="bag-add">
      <BagHeader
        title="Add to Bag"
        onBack={back}
        right={<Camera className="size-5 text-muted" aria-hidden="true" />}
      />
      <div className="mt-2 flex justify-center gap-5 px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            data-testid={`bag-add-tab-${t.id}`}
            onClick={() => setAddTab(t.id)}
            className={
              "pb-1 text-sm font-semibold " +
              (tab === t.id ? "border-b-2 border-teal text-ink" : "text-muted")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative mx-4 mt-3 h-64 overflow-hidden rounded-3xl">
        <img src={bagThumb(trick.id)} alt="" className="h-full w-full object-cover" />
        <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-pink px-3 py-1 text-xs font-bold text-ink">
          00:14
        </span>
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-6">
          <span className="size-10 rounded-xl bg-snow/20" />
          <button type="button" className="size-16 rounded-full bg-pink ring-4 ring-ink/30" aria-label="Stop" />
          <span className="size-10 rounded-xl bg-snow/20" />
        </div>
      </div>
      <label className="mx-4 mt-4 block text-xs font-bold tracking-widest text-muted">
        TAG THIS TRICK
        <select
          data-testid="bag-tag-trick"
          className="mt-1 h-12 w-full rounded-2xl bg-snow/5 px-3 text-sm font-semibold text-ink ring-1 ring-line"
          value={trick.id}
          onChange={(e) => openTrick(e.target.value)}
        >
          {MY_BAG_OPTIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const MY_BAG_OPTIONS = [
  ...BEGINNER_LEARN,
  { id: "tail-grab", name: "Tail Grab", band: "intermediate" as Band, blurb: "", detail: "", filter: "jumps" as const },
];

function TrickProgress() {
  const id = useBag((s) => s.activeTrickId);
  const step = useBag((s) => s.progressStep);
  const clips = useBag((s) => s.clips);
  const favorited = useBag((s) => s.favorited.includes(id));
  const toggleFavorite = useBag((s) => s.toggleFavorite);
  const setDetailTab = useBag((s) => s.setDetailTab);
  const markLanded = useBag((s) => s.markLanded);
  const openView = useBag((s) => s.openView);
  const back = useBag((s) => s.back);
  const trick = trickByBagId(id) ?? BEGINNER_LEARN[0];
  const steps = [
    { id: "learn" as const, label: "Learn" },
    { id: "practice" as const, label: "Practice" },
    { id: "land" as const, label: "Land" },
    { id: "clip" as const, label: "Clip" },
  ];
  const idx = steps.findIndex((s) => s.id === step);

  return (
    <div className="pb-28" data-testid="bag-progress">
      <BagHeader
        title="Trick Detail – Progress"
        onBack={back}
        right={<FavHeart saved={favorited} onToggle={() => toggleFavorite(id)} />}
      />
      <div className="px-4">
        <div className="relative h-40 overflow-hidden rounded-3xl">
          <img src={bagThumb(trick.id)} alt="" className="h-full w-full object-cover" />
          <span className="absolute bottom-2 left-2 text-[10px] font-bold tracking-[0.2em] text-amber-300 drop-shadow">
            IN PROGRESS
          </span>
        </div>
        <p className="mt-3 font-display text-3xl tracking-wide text-ink">{trick.name}</p>
        <div className="mt-3 flex items-center justify-between" data-testid="bag-progress-stepper">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold " +
                  (i < idx
                    ? "bg-lime text-navy"
                    : i === idx
                      ? "bg-amber-400 text-navy"
                      : "bg-snow/10 text-muted")
                }
              >
                {i < idx ? "✓" : i + 1}
              </span>
              <span className="text-[10px] font-semibold text-muted">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-bold tracking-widest text-muted">YOUR CLIPS ({clips.length})</p>
        <div className="mt-2 flex gap-2">
          {clips.map((c) => (
            <div key={c.id} className="relative h-20 w-24 overflow-hidden rounded-xl">
              <img src={bagThumb(trick.id)} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-1 right-1 text-[10px] font-bold text-ink">{c.seconds}</span>
            </div>
          ))}
          <button
            type="button"
            data-testid="bag-clip-add"
            onClick={() => openView("add")}
            className="flex h-20 w-20 items-center justify-center rounded-xl bg-snow/5 ring-1 ring-line"
          >
            <Plus className="size-5 text-muted" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="bag-practice-again"
            onClick={() => setDetailTab("practice")}
            className="h-12 rounded-full bg-snow/5 font-semibold text-ink ring-1 ring-line"
          >
            Practice Again
          </button>
          <button
            type="button"
            data-testid="bag-progress-landed"
            onClick={() => {
              markLanded(trick.id);
              openView("my-bag-list");
            }}
            className="h-12 rounded-full bg-lime font-bold text-navy"
          >
            ✓ Mark as Landed
          </button>
        </div>
      </div>
    </div>
  );
}

function HubShell({ children }: { children: React.ReactNode }) {
  const setScreen = useStomp((s) => s.setScreen);
  const openView = useBag((s) => s.openView);
  return (
    <div data-testid="bag-hub" className="pb-4">
      <header className="flex items-center gap-2 px-4 pt-5">
        <AlpineWordmark size="sm" onClick={() => setScreen("greet")} />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            data-testid="bag-open-my-list"
            onClick={() => openView("my-bag-list")}
            className="text-xs font-semibold text-teal"
          >
            My Bag ›
          </button>
          <HeySessionCompact />
        </div>
      </header>
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-lime" aria-hidden="true" />
          <h1 className="font-display text-4xl tracking-wide text-ink">Bag of Tricks</h1>
          <DemoSimBadge label="Demo" testId="bag-demo-badge" />
        </div>
        <p className="mt-1 text-sm text-muted">{BAG_TAGLINE}</p>
      </div>
      <HubTabs />
      {children}
    </div>
  );
}

export function BagOfTricks() {
  const view = useBag((s) => s.view);
  const hubTab = useBag((s) => s.hubTab);

  if (view === "my-bag-list") return <MyBagList />;
  if (view === "learn-list") return <LearnList />;
  if (view === "trick-detail") return <TrickDetail />;
  if (view === "practice") return <PracticeMode />;
  if (view === "log") return <LogTrick />;
  if (view === "pre-roll") return <PreRoll />;
  if (view === "review") return <ReviewAttempt />;
  if (view === "journey") return <TrickJourney />;
  if (view === "challenges") return <TrickChallenges />;
  if (view === "add") return <AddToBag />;
  if (view === "progress") return <TrickProgress />;

  return (
    <HubShell>
      {hubTab === "learn" ? <HubLearn /> : <HubMyBag />}
    </HubShell>
  );
}
