import { useRef, useState } from "react";
import { HomeButton, LivePill, Pin } from "@/components/stomp/chrome";
import { PHOTOS, useStomp } from "@/lib/stomp/store";

export function ClipMap() {
  const setScreen = useStomp((state) => state.setScreen);
  const clips = useStomp((state) => state.clips);
  const addClip = useStomp((state) => state.addClip);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("Backside air");
  const [recording, setRecording] = useState(0);
  const [note, setNote] = useState("");
  const featured = clips.find((clip) => clip.seconds > 0) ?? clips[0];
  const gallery = clips.filter((clip) => clip.id !== featured?.id).slice(0, 2);

  function capture() {
    if (recording > 0) return;
    setRecording(3);
    window.setTimeout(() => setRecording(2), 700);
    window.setTimeout(() => setRecording(1), 1400);
    window.setTimeout(() => {
      addClip({
        title: title.trim() || "Hit clip",
        place: "North trees",
        seconds: 7,
        image: PHOTOS.line,
      });
      setRecording(0);
      setNote("Pinned to the line.");
    }, 2100);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNote("Upload a still. Video stays on the phone — pin a frame here.");
      return;
    }
    try {
      const image = await shrink(file);
      addClip({
        title: title.trim() || "Uploaded clip",
        place: "North trees",
        seconds: 0,
        image,
      });
      setNote("Still is on the stash.");
    } catch {
      setNote("That still didn’t load. Try another photo.");
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-8">
      <header className="flex items-center justify-between gap-3 px-1">
        <HomeButton />
        <LivePill onClick={() => setScreen("run")}>Clip map</LivePill>
      </header>
      <div className="relative h-72 overflow-hidden rounded-3xl">
        <img
          src={PHOTOS.line}
          alt="Filming a hit from the ridge"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 140" aria-hidden="true">
          <path
            d="M30 18 C 48 40, 36 62, 58 88 C 72 104, 64 122, 80 140"
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M38 12 C 70 36, 78 28, 90 70 C 96 96, 70 110, 84 140"
            className="trail-dash"
            fill="none"
            stroke="var(--color-lime)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M18 28 C 34 48, 30 70, 46 92"
            fill="none"
            stroke="var(--color-pink)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="absolute top-3 right-3 left-3 flex items-center gap-3 rounded-2xl bg-snow p-2">
          <img src={PHOTOS.line} alt="" className="size-14 rounded-xl object-cover" />
          <div>
            <p className="font-semibold">Filming a hit</p>
            <p className="text-sm font-medium text-pink">Live clip · phone capture</p>
          </div>
        </div>
        <Pin x="28%" y="42%" label="Hit clip" tone="pink" />
        <Pin x="70%" y="62%" label="Stash · North trees" tone="teal" />
      </div>
      <section className="rounded-3xl bg-snow p-4 ring-1 ring-line">
        <h1 className="font-display text-4xl tracking-wide">Pin a hit clip</h1>
        <p className="mt-1 text-sm text-pretty text-muted">
          The clip sticks to this line. Crew following the stash see the same pin.
        </p>
        {featured ? (
          <div className="mt-4 flex gap-3 rounded-2xl bg-paper p-3">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl">
              <img src={featured.image} alt="" className="h-full w-full object-cover" />
              {featured.seconds > 0 ? (
                <span className="absolute bottom-1 left-1 rounded bg-ink px-1 text-xs text-snow">
                  0:{featured.seconds.toString().padStart(2, "0")}
                </span>
              ) : null}
            </div>
            <div>
              <p className="font-semibold">
                {featured.title} · {featured.place}
              </p>
              <p className="mt-1 text-sm text-pretty text-muted">
                Drop it on the stash pin or the pink trail ribbon.
              </p>
            </div>
          </div>
        ) : null}
        <label className="mt-3 block text-sm text-muted">
          Clip name
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 h-12 w-full rounded-2xl bg-paper px-4 text-ink outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-pink"
          />
        </label>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={capture}
            className="h-12 flex-1 rounded-full bg-pink font-semibold text-snow"
          >
            {recording > 0 ? `Recording ${recording}` : "Record"}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-12 flex-1 rounded-full bg-ink font-semibold text-snow"
          >
            Upload clip
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        {note ? <p className="mt-3 text-sm text-teal">{note}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {gallery.map((clip) => (
            <figure key={clip.id} className="overflow-hidden rounded-2xl">
              <img src={clip.image} alt="" className="h-28 w-full object-cover" />
              <figcaption className="bg-ink px-3 py-2 text-sm font-medium text-snow">{clip.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}

function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 720 / Math.max(image.width, image.height));
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
