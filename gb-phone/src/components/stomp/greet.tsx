import { useEffect, useRef, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import {
  Camera,
  ChevronRight,
  Ghost,
  Layers,
  MapPin,
  Mic,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { Form7Brand } from "@/components/stomp/brand/form7-brand";
import { BoltBadge, HomeButton } from "@/components/stomp/chrome";
import { HomeMapCard } from "@/components/stomp/home-map-card";
import { HomePlaylistBlock } from "@/components/stomp/home-playlist-block";
import { SessionMic } from "@/components/stomp/session-mic";
import { PROGRESS_STATS, useBag } from "@/lib/stomp/bag";
import { SESSIONS } from "@/lib/stomp/sessions";
import { PHOTOS, crewPayload, parseCrew, useStomp } from "@/lib/stomp/store";

/** Look-board demo lineups (visual density) — not a full Lineups ship. */
const DEMO_LINEUPS = [
  { id: "big-line", name: "Big Line Sesh", place: "Revelstoke · 4 hits", feet: "1,842 ft", today: true, image: "line" as const },
  { id: "park-lap", name: "Park Lap", place: "Main Park · 6 hits", feet: "980 ft", today: false, image: "hud" as const },
  { id: "tree-run", name: "Tree Run Flow", place: "North Bowl · 5 hits", feet: "1,210 ft", today: false, image: "hero" as const },
  { id: "groomer", name: "Groomer Cruise", place: "Upper Mtn · 3 hits", feet: "740 ft", today: false, image: "air" as const },
] as const;

function shrinkSelfie(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 480 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}

/**
 * Home — look-target density (Ted 2026-10-31 ~10:59 PM ET).
 * Hero + 4 feature tiles + Today's Lineup + My Lineups + quick actions.
 * Map HARD LOCK: secondary single-mountain card only (no state pills).
 * CrewLink below stays Invite-locked.
 */
export function Greet() {
  const setScreen = useStomp((state) => state.setScreen);
  const startRun = useStomp((state) => state.startRun);
  const selfie = useStomp((state) => state.selfie);
  const setSelfie = useStomp((state) => state.setSelfie);
  const riderName = useStomp((state) => state.riderName);
  const chooseSession = useStomp((state) => state.chooseSession);
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const today = DEMO_LINEUPS[0]!;

  async function onSelfie(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNote("That file isn’t a photo.");
      return;
    }
    try {
      setSelfie(await shrinkSelfie(file));
      setNote("Selfie’s on your pass.");
    } catch {
      setNote("Couldn’t read that photo. Try another.");
    }
  }

  function openBag(tab: "my-bag" | "learn" | "challenges" = "my-bag") {
    useBag.getState().openHub(tab);
    setScreen("bag");
  }

  return (
    <div className="relative overflow-hidden pb-28" data-testid="home-look-board">
      {/* Cinematic hero — look board Lineups home language */}
      <section data-testid="home-zone-ride" className="relative" aria-label="Lineups hero">
        <div className="relative min-h-[16rem] overflow-hidden">
          <img src={PHOTOS.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/35 to-navy" />
          <div className="relative flex items-center justify-between px-5 pt-5">
            {/* Form #7 brand only — CrewLink / invite paths untouched */}
            <Form7Brand tone="onDark" size="md" testId="home-form7-brand" />
            <div className="flex items-center gap-2">
              <BoltBadge />
              <button type="button" onClick={() => fileRef.current?.click()} className="size-9 overflow-hidden rounded-full ring-2 ring-lime/60">
                <img
                  src={selfie || PHOTOS.crew}
                  alt={selfie ? `${riderName} selfie` : "Rider"}
                  className="size-full object-cover"
                />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="user"
                className="sr-only"
                onChange={(event) => void onSelfie(event.target.files?.[0])}
              />
            </div>
          </div>
          <div className="relative px-5 pb-6 pt-10">
            <p className="flex items-center gap-2 font-display text-5xl tracking-wide text-ink">
              <Layers className="size-8 text-lime" aria-hidden="true" />
              Lineups
            </p>
            <p className="mt-2 max-w-xs text-sm text-ink/85">
              Plan your runs · Build your lines · Capture the ride.
            </p>
          </div>
        </div>
        <div className="px-5 pt-2">
          <SessionMic />
          {note ? <p className="mt-2 text-sm font-semibold text-teal">{note}</p> : null}
        </div>
      </section>

      {/* Four gradient feature tiles */}
      <section data-testid="home-zone-features" className="mt-4 px-5" aria-label="Feature tiles">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="home-tool-park"
            onClick={() => setScreen("park")}
            className="relative overflow-hidden rounded-3xl p-[2px] text-left"
            style={{ background: "linear-gradient(135deg,#f5e66e,#c9a227)" }}
          >
            <span className="flex min-h-[6.5rem] flex-col justify-between rounded-[1.35rem] bg-navy/90 p-3">
              <Layers className="size-6 text-lime" aria-hidden="true" />
              <span className="font-display text-2xl tracking-wide text-ink">Lineups</span>
            </span>
          </button>
          <button
            type="button"
            data-testid="home-tile-bag"
            onClick={() => openBag("my-bag")}
            className="relative overflow-hidden rounded-3xl p-[2px] text-left"
            style={{ background: "linear-gradient(135deg,#5ec8ff,#2ad4c2)" }}
          >
            <span className="flex min-h-[6.5rem] flex-col justify-between rounded-[1.35rem] bg-navy/90 p-3">
              <Sparkles className="size-6 text-teal" aria-hidden="true" />
              <span className="font-display text-2xl tracking-wide text-ink">Bag of Tricks</span>
            </span>
          </button>
          <button
            type="button"
            data-testid="home-tool-stompers"
            onClick={() => setScreen("stompers")}
            className="relative overflow-hidden rounded-3xl p-[2px] text-left"
            style={{ background: "linear-gradient(135deg,#c084fc,#f472b6)" }}
          >
            <span className="flex min-h-[6.5rem] flex-col justify-between rounded-[1.35rem] bg-navy/90 p-3">
              <Users className="size-6 text-pink" aria-hidden="true" />
              <span className="font-display text-2xl tracking-wide text-ink">Crew</span>
            </span>
          </button>
          <button
            type="button"
            data-testid="home-tile-media"
            onClick={() => setScreen("playlist")}
            className="relative overflow-hidden rounded-3xl p-[2px] text-left"
            style={{ background: "linear-gradient(135deg,#fb923c,#b45309)" }}
          >
            <span className="flex min-h-[6.5rem] flex-col justify-between rounded-[1.35rem] bg-navy/90 p-3">
              <Play className="size-6 text-orange-300" aria-hidden="true" fill="currentColor" />
              <span className="font-display text-2xl tracking-wide text-ink">Media</span>
            </span>
          </button>
        </div>
      </section>

      {/* Today's Lineup photo card */}
      <section data-testid="home-zone-today" className="mt-5 px-5" aria-label="Today's Lineup">
        <p className="text-xs font-bold tracking-widest text-muted">TODAY&apos;S LINEUP</p>
        <button
          type="button"
          data-testid="home-today-lineup"
          onClick={() => setScreen("session")}
          className="relative mt-2 flex w-full overflow-hidden rounded-3xl text-left ring-1 ring-line"
        >
          <img src={PHOTOS[today.image]} alt="" className="h-28 w-28 shrink-0 object-cover" />
          <span className="flex min-w-0 flex-1 flex-col justify-center bg-snow/5 px-4 py-3">
            <span className="font-display text-2xl tracking-wide text-ink">{today.name}</span>
            <span className="mt-0.5 text-sm text-muted">
              {today.place} · {today.feet}
            </span>
          </span>
          <span className="flex items-center pr-4">
            <span className="flex size-11 items-center justify-center rounded-full bg-ink text-lime">
              <Play className="size-5" fill="currentColor" aria-hidden="true" />
            </span>
          </span>
        </button>
      </section>

      {/* My Lineups list */}
      <section data-testid="home-zone-lineups" className="mt-5 px-5" aria-label="My Lineups">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-muted">MY LINEUPS</p>
          <button
            type="button"
            data-testid="home-lineups-all"
            onClick={() => setScreen("park")}
            className="text-sm font-semibold text-teal"
          >
            All ›
          </button>
        </div>
        <ul className="mt-2 flex flex-col gap-2">
          {DEMO_LINEUPS.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                data-testid={`home-lineup-${row.id}`}
                onClick={() => setScreen(row.today ? "session" : "park")}
                className={
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 " +
                  (row.today ? "bg-lime/10 ring-lime/40" : "bg-snow/5 ring-line")
                }
              >
                <img src={PHOTOS[row.image]} alt="" className="size-12 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{row.name}</span>
                  <span className="block text-xs text-muted">{row.place}</span>
                </span>
                <ChevronRight className="size-4 text-muted" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Quick actions — icons, not pill flood */}
      <section data-testid="home-zone-quick" className="mt-5 px-5" aria-label="Quick actions">
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            data-testid="home-quick-preroll"
            onClick={() => {
              useBag.getState().openTrick("fs180", "log");
              useBag.getState().startPreroll();
              setScreen("bag");
            }}
            className="flex flex-col items-center gap-1.5 py-2"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-snow/10 ring-1 ring-line">
              <Mic className="size-5 text-lime" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold text-ink">Pre-Roll</span>
          </button>
          <button
            type="button"
            data-testid="home-quick-record"
            onClick={() => {
              useBag.getState().openView("add");
              setScreen("bag");
            }}
            className="flex flex-col items-center gap-1.5 py-2"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-snow/10 ring-1 ring-line">
              <Camera className="size-5 text-teal" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold text-ink">Record</span>
          </button>
          <button
            type="button"
            data-testid="home-quick-map"
            onClick={() => setScreen("map")}
            className="flex flex-col items-center gap-1.5 py-2"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-snow/10 ring-1 ring-line">
              <MapPin className="size-5 text-teal" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold text-ink">Map Run</span>
          </button>
          <button
            type="button"
            data-testid="home-quick-ghost"
            onClick={startRun}
            className="flex flex-col items-center gap-1.5 py-2"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-snow/10 ring-1 ring-line">
              <Ghost className="size-5 text-ink/80" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-semibold text-ink">Ghost Run</span>
          </button>
        </div>
      </section>

      {/* Trick journey strip + Crew invite entry */}
      <section data-testid="home-zone-bag" className="mt-4 px-5" aria-label="Progress">
        <button
          type="button"
          data-testid="home-trick-journey"
          onClick={() => {
            useBag.getState().openView("journey");
            setScreen("bag");
          }}
          className="flex w-full items-center justify-between rounded-2xl bg-snow/10 px-4 py-3 text-left ring-1 ring-line"
        >
          <span>
            <span className="block text-xs font-bold tracking-widest text-teal">MY TRICK JOURNEY</span>
            <span className="mt-0.5 block text-sm font-semibold text-ink">
              {PROGRESS_STATS.landed} landed · {PROGRESS_STATS.inProgress} in progress
            </span>
          </span>
          <ChevronRight className="size-5 text-teal" aria-hidden="true" />
        </button>
        <button
          type="button"
          data-testid="home-tool-crew"
          onClick={() => setScreen("crew")}
          className="mt-2 h-11 w-full rounded-2xl bg-snow/5 text-sm font-semibold text-ink ring-1 ring-line"
        >
          Crew invite
        </button>
      </section>

      {/* Secondary map — HARD LOCK single mountain, not the whole home */}
      <section data-testid="home-zone-mountain" className="mt-5 px-5" aria-label="Location and map">
        <HomeMapCard />
      </section>

      {/* Playlist soft bar */}
      <section data-testid="home-zone-playlist" className="mt-4 px-5" aria-label="Music">
        <HomePlaylistBlock />
      </section>

      {/* Session plans (collapsed) */}
      <section data-testid="home-zone-tools" className="mt-4 px-5 pb-4" aria-label="Session plans">
        <button
          type="button"
          data-testid="home-plans-toggle"
          onClick={() => setShowPlans((v) => !v)}
          className="h-11 w-full rounded-2xl bg-snow/5 text-sm font-semibold ring-1 ring-line"
        >
          {showPlans ? "Hide plans" : "Session plans"}
        </button>
        {showPlans ? (
          <ul className="mt-2 flex flex-col gap-2" data-testid="home-plans-list">
            {SESSIONS.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => chooseSession(session.id)}
                  className="flex w-full items-center justify-between rounded-2xl bg-snow/5 px-4 py-3 text-left ring-1 ring-line"
                >
                  <span className="font-semibold">{session.name}</span>
                  {session.sample ? <span className="text-xs font-bold tracking-widest text-pink">Sample</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function CrewQr({ value }: { value: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancel = false;
    void QRCode.toDataURL(value, {
      margin: 1,
      width: 280,
      color: { dark: "#10140f", light: "#ffffff" },
    }).then((url) => {
      if (!cancel) setSrc(url);
    });
    return () => {
      cancel = true;
    };
  }, [value]);

  if (!src) return <div className="mx-auto size-56 rounded-3xl bg-paper" />;
  return <img src={src} alt="Your crew QR code" className="mx-auto size-56 rounded-3xl bg-snow p-3 ring-1 ring-line" />;
}

export function CrewLink() {
  const riderName = useStomp((state) => state.riderName);
  const riderCode = useStomp((state) => state.riderCode);
  const crew = useStomp((state) => state.crew);
  const setRiderName = useStomp((state) => state.setRiderName);
  const ensureCode = useStomp((state) => state.ensureCode);
  const linkCrew = useStomp((state) => state.linkCrew);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCode = useRef<(raw: string) => void>(() => undefined);
  const [draft, setDraft] = useState(riderName);
  const [codeDraft, setCodeDraft] = useState("");
  const [note, setNote] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    ensureCode();
  }, [ensureCode]);

  function accept(raw: string) {
    const mate = parseCrew(raw);
    if (!mate) {
      setNote("That’s not a STOMP crew code.");
      return;
    }
    if (mate.code === useStomp.getState().riderCode) {
      setNote("That’s your own code.");
      return;
    }
    const before = useStomp.getState().crew.length;
    linkCrew(mate);
    const after = useStomp.getState().crew.length;
    setNote(after > before ? `Linked ${mate.name}` : `${mate.name} is already on the crew`);
    setScanning(false);
    setCodeDraft("");
  }

  onCode.current = accept;

  useEffect(() => {
    if (!scanning) return;
    let stop = false;
    let stream: MediaStream | null = null;
    const host = window as Window & {
      BarcodeDetector?: new (options: { formats: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
      };
    };
    if (!host.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
      setNote("This phone can’t open the scanner. Type their code.");
      setScanning(false);
      return;
    }
    const detector = new host.BarcodeDetector({ formats: ["qr_code"] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((next) => {
        stream = next;
        const video = videoRef.current;
        if (stop || !video) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = next;
        void video.play();
        const tick = () => {
          if (stop || !videoRef.current) return;
          detector
            .detect(videoRef.current)
            .then((codes) => {
              const raw = codes[0]?.rawValue;
              if (raw) onCode.current(raw);
              else if (!stop) requestAnimationFrame(tick);
            })
            .catch(() => {
              if (!stop) requestAnimationFrame(tick);
            });
        };
        requestAnimationFrame(tick);
      })
      .catch(() => {
        setNote("Camera is blocked. Type their code.");
        setScanning(false);
      });
    return () => {
      stop = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning]);

  async function invite() {
    const code = useStomp.getState().riderCode;
    const name = useStomp.getState().riderName;
    if (!code) return;
    const text = `Ride with me on STOMP. Code ${code}. ${crewPayload(code, name)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "STOMP crew", text });
        setNote("Share sheet opened. Nothing is sent until they type or scan the code.");
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setNote("Share canceled. Nothing was sent.");
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setNote("Code copied. Nothing was sent. They still have to type or scan it.");
    } catch {
      setNote(`Read them ${code}. Nothing was sent.`);
    }
  }

  function saveName(event: FormEvent) {
    event.preventDefault();
    setRiderName(draft);
    setDraft(useStomp.getState().riderName);
  }

  return (
    <div className="px-1 pb-10">
      <header className="flex items-center gap-3 px-4 pt-5">
        <HomeButton />
        <h1 className="font-display text-4xl tracking-wide">Crew</h1>
      </header>
      <div className="px-4 pt-4">
        <form onSubmit={saveName} className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Your name"
            className="h-12 min-w-0 flex-1 rounded-full bg-snow px-4 ring-1 ring-line outline-none"
          />
          <button type="submit" className="h-12 rounded-full bg-ink px-4 font-semibold text-snow">
            Save
          </button>
        </form>
        <p className="mt-4 text-sm text-pretty text-muted">
          Show this so a friend can scan you. Your code is {riderCode || "…"}.
        </p>
        {riderCode ? <div className="mt-3">{<CrewQr value={crewPayload(riderCode, riderName)} />}</div> : null}
        <button type="button" onClick={() => void invite()} className="mt-4 h-14 w-full rounded-full bg-lime font-semibold">
          Invite
        </button>
        <button
          type="button"
          onClick={() => setScanning((on) => !on)}
          className="mt-4 h-12 w-full rounded-full bg-pink font-semibold text-snow"
        >
          {scanning ? "Stop scanning" : "Scan their QR"}
        </button>
        {scanning ? (
          <video ref={videoRef} muted playsInline className="mt-3 aspect-square w-full rounded-3xl bg-ink object-cover" />
        ) : null}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            accept(codeDraft);
          }}
        >
          <input
            value={codeDraft}
            onChange={(event) => setCodeDraft(event.target.value.toUpperCase())}
            placeholder="Or type their code"
            aria-label="Crew code"
            className="h-12 min-w-0 flex-1 rounded-full bg-snow px-4 uppercase ring-1 ring-line outline-none"
          />
          <button type="submit" className="h-12 rounded-full bg-ink px-4 font-semibold text-snow">
            Link
          </button>
        </form>
        {note ? <p className="mt-2 text-sm font-semibold text-teal">{note}</p> : null}
        {crew.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {crew.map((person) => (
              <li key={person.code} className="flex h-12 items-center justify-between rounded-2xl bg-snow px-4 ring-1 ring-line">
                <span className="font-semibold">{person.name}</span>
                <span className="text-sm text-muted">{person.code}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl bg-snow p-4 ring-1 ring-line">
            <p className="text-xs font-bold tracking-widest text-muted">Example · not linked</p>
            <p className="mt-1 font-semibold">Your crew</p>
            <p className="text-sm text-muted">Just you, until someone scans this code. Nobody else is on it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
