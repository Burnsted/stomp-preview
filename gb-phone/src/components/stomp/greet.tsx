import { useEffect, useRef, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { BoltBadge, HomeButton } from "@/components/stomp/chrome";
import { SessionMic } from "@/components/stomp/session-mic";
import { countProgress } from "@/lib/stomp/goals";
import { BAND_LABEL } from "@/lib/stomp/library";
import { SESSIONS, sessionById, suggestedSession } from "@/lib/stomp/sessions";
import { PHOTOS, crewPayload, formatAir, parseCrew, useStomp, type Screen } from "@/lib/stomp/store";

const LINKS: { screen: Screen; label: string }[] = [
  { screen: "home", label: "The line" },
  { screen: "park", label: "Park" },
  { screen: "goals", label: "Tricks" },
  { screen: "map", label: "Clips" },
  { screen: "playlist", label: "Music" },
  { screen: "log", label: "Airtime" },
  { screen: "guide", label: "Guide" },
  { screen: "stash", label: "Stash" },
];

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

export function Greet() {
  const setScreen = useStomp((state) => state.setScreen);
  const startRun = useStomp((state) => state.startRun);
  const landings = useStomp((state) => state.landings);
  const selfie = useStomp((state) => state.selfie);
  const setSelfie = useStomp((state) => state.setSelfie);
  const riderName = useStomp((state) => state.riderName);
  const crew = useStomp((state) => state.crew);
  const band = useStomp((state) => state.band);
  const trickStatus = useStomp((state) => state.trickStatus);
  const activeSession = useStomp((state) => state.activeSession);
  const sessionDone = useStomp((state) => state.sessionDone);
  const chooseSession = useStomp((state) => state.chooseSession);
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const template = sessionById(activeSession) ?? suggestedSession(band, crew.length);
  const counts = countProgress(trickStatus);
  const goalsDone = template.steps.filter((step) => sessionDone.includes(step.id)).length;

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

  return (
    <div className="relative overflow-hidden pb-10">
      <div className="flex items-start justify-between px-5 pt-5">
        <span className="rounded-full border-2 border-ink px-3 py-1.5 text-[11px] font-bold tracking-widest">
          TRAIL · HIT · CLIP
        </span>
        <BoltBadge />
      </div>
      <div className="relative px-5 pt-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="ml-auto block w-28 rotate-3">
          <img
            src={selfie || PHOTOS.crew}
            alt={selfie ? `${riderName} selfie` : "Crew selfie on the ridge"}
            className="aspect-square w-full rounded-2xl object-cover ring-4 ring-snow"
          />
          <span className="mt-1 block text-center text-[10px] font-bold tracking-widest">
            {selfie ? riderName : "Crew selfie"}
          </span>
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
      <div className="px-5">
        <h1 className="font-display text-7xl leading-none tracking-tight">STOMP</h1>
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="max-w-48 text-lg font-medium text-pretty">Hands-free caddy. Lap the park. Log the hit.</p>
          <button
            type="button"
            onClick={() => setScreen("map")}
            className="flex size-16 shrink-0 rotate-6 items-center justify-center rounded-2xl border-2 border-ink bg-pink text-center font-display text-lg leading-none text-snow"
          >
            HIT
            <br />
            clip
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setScreen("log")} className="h-10 rounded-full bg-pink px-4 text-sm font-semibold text-snow">
            {landings[0] ? `${formatAir(landings[0].seconds)}s of air` : "Log air"}
          </button>
          <button type="button" onClick={() => setScreen("park")} className="h-10 rounded-full bg-teal px-4 text-sm font-semibold">
            Park laps
          </button>
          <button type="button" onClick={() => setScreen("map")} className="h-10 rounded-full bg-snow px-4 text-sm font-semibold ring-1 ring-line">
            Maps
          </button>
        </div>
        <button
          type="button"
          onClick={() => chooseSession(template.id)}
          className="mt-4 h-16 w-full rounded-full bg-pink font-display text-3xl tracking-wide text-snow"
        >
          {template.name}
        </button>
        <p className="mt-2 text-center text-sm text-muted">
          {BAND_LABEL[band]} · about {template.minutes} min · no GPS
          {template.sample ? " · Sample" : ""}
        </p>
        <button
          type="button"
          onClick={startRun}
          className="mt-3 h-16 w-full rounded-full bg-ink font-display text-3xl tracking-wide text-snow"
        >
          Drop in
        </button>
        <div className="mt-3">
          <SessionMic />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-display text-3xl leading-none text-pink">{counts.landed}</p>
            <p className="text-xs font-semibold text-muted">Landed</p>
          </div>
          <div>
            <p className="font-display text-3xl leading-none">{counts.working}</p>
            <p className="text-xs font-semibold text-muted">Working</p>
          </div>
          <div>
            <p className="font-display text-3xl leading-none text-teal">
              {goalsDone}/{template.steps.length}
            </p>
            <p className="text-xs font-semibold text-muted">Goals</p>
          </div>
        </div>
        <button type="button" onClick={() => setScreen("stompers")} className="mt-5 w-full text-center text-lg font-semibold">
          STOMPERS
        </button>
        <div className="mt-1 flex justify-between text-sm text-muted">
          <button type="button" onClick={() => chooseSession(template.id)}>
            the plan
          </button>
          <button type="button" onClick={() => setScreen("park")}>
            or hit the park
          </button>
          <button type="button" onClick={() => setScreen("playlist")}>
            today’s playlist
          </button>
        </div>
        {note ? <p className="mt-2 text-sm font-semibold text-teal">{note}</p> : null}
        <p className="mt-6 text-xs font-bold tracking-widest text-muted">Templates</p>
        <ul className="mt-2 flex flex-col gap-2">
          {SESSIONS.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                onClick={() => chooseSession(session.id)}
                className="flex w-full items-center justify-between rounded-2xl bg-snow px-4 py-3 text-left ring-1 ring-line"
              >
                <span className="font-semibold">{session.name}</span>
                {session.sample ? <span className="text-xs font-bold tracking-widest text-pink">Sample</span> : null}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setScreen("crew")} className="h-10 rounded-full bg-snow px-4 text-sm font-semibold ring-1 ring-line">
            {crew.length > 0 ? `Crew · ${crew.length}` : "Link crew"}
          </button>
          {LINKS.map((link) => (
            <button
              key={link.screen}
              type="button"
              onClick={() => setScreen(link.screen)}
              className="h-10 rounded-full bg-snow px-4 text-sm font-semibold ring-1 ring-line"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
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
