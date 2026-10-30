export type Band = "beginner" | "intermediate" | "advanced";

export type LibraryTrick = {
  id: string;
  name: string;
  band: Band;
  feature: string;
  kind: string;
  aliases: string[];
  takeoff: string;
  air: string;
  landing: string;
  detail: string;
};

export type TrickCard = {
  id: string;
  name: string;
  band: Band;
  feature: string;
  kind: string;
  takeoff: string;
  air: string;
  landing: string;
  detail: string;
  known: boolean;
};

export const BANDS: Band[] = ["beginner", "intermediate", "advanced"];

export const BAND_LABEL: Record<Band, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const BAND_BLURB: Record<Band, string> = {
  beginner: "Flat ground, the small kicker, and the first half-turns.",
  intermediate: "Full spins, grabs, and tricks that leave the box.",
  advanced: "540s, corks, flips, and the top of the park.",
};

function trick(
  id: string,
  name: string,
  band: Band,
  feature: string,
  kind: string,
  takeoff: string,
  air: string,
  landing: string,
  detail: string,
  aliases: string[] = [],
): LibraryTrick {
  return { id, name, band, feature, kind, aliases, takeoff, air, landing, detail };
}

export const LIBRARY: LibraryTrick[] = [
  trick("180", "180", "beginner", "S kicker", "Spin", "Pop, then look over the shoulder you want to turn.", "A half turn. The board comes with your head.", "Land switch and ride it out.", "A half turn. Look where you’re going to land.", ["half", "one eighty"]),
  trick("fs180", "Frontside 180", "beginner", "S kicker", "Spin", "Open the shoulders toward the nose.", "You can see the landing the whole way.", "Land switch, eyes downhill.", "Open the shoulders. The landing stays in sight.", ["frontside 180", "fs 180", "front 180"]),
  trick("bs180", "Backside 180", "beginner", "S hip", "Spin", "Wind up blind. Commit off the lip.", "Spot the snow late. Don’t peek early.", "Unwind onto the new edge and ride away switch.", "Blind takeoff. Spot the snow late and commit.", ["backside 180", "bs 180", "back 180"]),
  trick("straight-air", "Straight air", "beginner", "S kicker", "Jump", "Ride in square. Pop off both feet at the lip.", "Stay over the board. No spin, no grab required.", "Spot the landing and set it down flat.", "The first jump. Leave the snow, come back the same way.", ["straight", "air"]),
  trick("ollie", "Ollie", "beginner", "Flat", "Pop", "Load the tail, then jump.", "The nose lifts. Level the board under you.", "Land both feet, riding away the way you came.", "A jump with no kicker. The tail does the work.", ["ollie"]),
  trick("nollie", "Nollie", "beginner", "Flat", "Pop", "Pop the nose instead of the tail.", "The tail lifts. Keep your weight centered.", "Land in the same direction.", "The ollie’s opposite. Nose first.", ["nollie"]),
  trick("sw180", "Switch 180", "beginner", "S kicker", "Spin", "Take off riding switch.", "Half turn back toward your normal stance.", "Land regular.", "Start switch, finish the way you normally ride.", ["switch 180"]),
  trick("fifty", "50-50", "beginner", "Flat box", "Jib", "Roll on straight, board in line with the feature.", "Both feet stay over the box. Don’t spin it.", "Pop off the end, forward.", "The starter jib. On, across, off.", ["50 50", "5050", "fifty fifty"]),
  trick("boardslide", "Boardslide", "beginner", "Flat box", "Jib", "A small ollie, then turn the board sideways.", "The board sits across the box. Stay tall.", "Turn back downhill before the end.", "Sideways on the box. The first real jib.", ["board slide"]),
  trick("tail-press", "Tail press", "beginner", "Flat", "Press", "Weight the tail while you roll.", "The nose stays up. Bend the back knee.", "Bring the nose down and ride out.", "A nose-up press. Balance, don’t hop.", ["tailpress"]),
  trick("nose-press", "Nose press", "beginner", "Flat", "Press", "Weight the nose.", "The tail stays up. Arms quiet.", "Set the tail down.", "A tail-up press. The other end of a butter.", ["nosepress", "nose press"]),
  trick("butter", "Butter", "beginner", "Flat", "Press", "Press the tail and start a slow pivot.", "The nose draws an arc on the snow.", "Finish the arc and stand up.", "A press that turns. Flat-ground style.", ["nose butter"]),

  trick("360", "360", "intermediate", "M kicker", "Spin", "Wind up on the inrun. Pop and lead with the head.", "One full turn. Find the landing before you open.", "Land the way you took off.", "All the way around. Spot it, then open.", ["three sixty", "3"]),
  trick("fs360", "Frontside 360", "intermediate", "M kicker", "Spin", "Spin toward the nose. Shoulders open first.", "Keep the board quiet under you.", "Land regular, or switch if you took off switch.", "Spin toward the nose. Keep the board quiet.", ["frontside 360", "fs 360", "front 360"]),
  trick("bs360", "Backside 360", "intermediate", "M hip", "Spin", "Set the backside edge and spin blind.", "The classic full turn. Don’t open early.", "Stomp it in the same stance you left in.", "Spin blind. The classic. Stomp it like you meant it.", ["backside 360", "bs 360", "back 360"]),
  trick("cab180", "Cab 180", "intermediate", "M kicker", "Spin", "Take off switch.", "Half turn, frontside relative to switch.", "Land regular.", "Switch takeoff, regular landing. A cab is a switch frontside.", ["cab 180"]),
  trick("cab360", "Cab 360", "intermediate", "M kicker", "Spin", "Take off switch and spin frontside.", "A full cab. Spot over the front shoulder.", "Land switch.", "Switch into a frontside 360.", ["cab 360"]),
  trick("indy", "Indy grab", "intermediate", "M kicker", "Grab", "Pop straight.", "Back hand grabs the toe edge between the bindings.", "Let go before the landing.", "The grab people learn first.", ["indy"]),
  trick("mute", "Mute grab", "intermediate", "M kicker", "Grab", "Pop and reach the front hand through.", "Front hand, toe edge, between the bindings.", "Release and stand tall.", "Front hand between the bindings.", ["mute"]),
  trick("melon", "Melon grab", "intermediate", "M kicker", "Grab", "Pop and reach the front hand behind.", "Front hand, heel edge.", "Let it go and land flat.", "A method’s simpler cousin. Heel edge, front hand.", ["melon", "method"]),
  trick("stalefish", "Stalefish", "intermediate", "M kicker", "Grab", "Pop and reach back.", "Back hand, heel edge, between the bindings.", "Release early.", "The blind-side grab. Back hand, heel edge.", ["stale", "stale fish"]),
  trick("indy360", "Indy 360", "intermediate", "L kicker", "Grab", "Wind a full spin.", "Back hand, toe edge, while you come around.", "Let go, then stomp.", "Back hand, toe edge, full spin.", ["indy 360"]),
  trick("mute360", "Mute 360", "intermediate", "L kicker", "Grab", "Spin and reach the front hand through.", "Front hand between the bindings for the 360.", "Release and land.", "Front hand between the bindings, with a 360.", ["mute 360"]),
  trick("melon360", "Backside melon 360", "intermediate", "Step-down", "Grab", "Backside spin, front hand to the heel edge.", "Hold the melon until you see the landing.", "Stomp backside.", "Front hand, heel edge, backside spin.", ["backside melon", "melon 360", "bs melon"]),
  trick("shifty", "Shifty", "intermediate", "M kicker", "Style", "Pop straight.", "Twist the board one way and your shoulders the other, then back.", "Land straight. It is not a spun trick.", "A fake spin. The board yaws and comes home.", ["shifty"]),
  trick("frontboard", "Front board", "intermediate", "Down-flat", "Jib", "Ollie on with the nose pointing downhill.", "The board sits across the feature. Weight stays over the front foot.", "Turn off the end and ride away.", "A boardslide with the nose on the downhill side.", ["front board", "frontside boardslide"]),
  trick("lipslide", "Lipslide", "intermediate", "Down rail", "Jib", "Come at the feature from the opposite side of a boardslide.", "The downhill edge is the one that was uphill. Stay centered.", "Hop off before it runs out.", "The boardslide’s mirror. Approach from the other side.", ["lip slide"]),

  trick("540", "540", "advanced", "XL kicker", "Spin", "A bigger wind-up. Pop hard at the lip.", "One and a half turns. Spot, then spot again.", "Land switch.", "One and a half. Wind up on the lip.", ["five forty", "540"]),
  trick("fs540", "Frontside 540", "advanced", "XL kicker", "Spin", "Open hard toward the nose.", "A frontside one-and-a-half.", "Land switch.", "Frontside, one and a half, land switch.", ["frontside 540", "fs 540"]),
  trick("bs540", "Backside 540", "advanced", "XL hip", "Spin", "Commit blind. The backside edge sets the spin.", "Don’t peek on the first half.", "Land switch, on the new edge.", "The blind one-and-a-half. Don’t peek early.", ["backside 540", "bs 540"]),
  trick("cab540", "Cab 540", "advanced", "XL kicker", "Spin", "Take off switch.", "Frontside one-and-a-half from switch.", "Land regular.", "Take off switch. Land regular.", ["cab 540"]),
  trick("720", "720", "advanced", "XL kicker", "Spin", "Two full winds. You need a bigger jump.", "Two turns. Hands stay in until the second spot.", "Land the way you took off.", "Two full turns. Speed and a real kicker.", ["seven twenty", "720"]),
  trick("cork540", "Cork 540", "advanced", "Championship kicker", "Cork", "Throw the shoulder off axis, not flat.", "An inverted 540. The head goes down, the board stays above.", "Bring it back and land on your feet.", "Tip the shoulders. Come down on your feet.", ["cork 540", "front cork"]),
  trick("cork720", "Backside cork 720", "advanced", "The big send", "Cork", "Backside, off axis, two turns.", "Inverted through the 720. Spot late.", "Stomp it. This is the send.", "Two turns, inverted. The send.", ["cork 720", "bs cork 720", "backside cork"]),
  trick("doublecork", "Double cork 1080", "advanced", "The big send", "Cork", "Three turns, off axis twice.", "Two inversions. Only throw it when the 720 is boring.", "Land it or don’t leave the lip.", "The last goal. Three turns, twice off axis.", ["double cork", "1080", "double cork 1080"]),
  trick("rodeo", "Rodeo 540", "advanced", "XL hip", "Flip", "A backflip that spins sideways.", "Off-axis flip plus a 540.", "Land switch, riding away.", "A flipped 540. The hip is the friendly place to learn it.", ["rodeo 540", "rodeo"]),
  trick("backflip", "Backflip", "advanced", "Step-up", "Flip", "Pop and look back, not spin flat.", "One backward flip. Tuck.", "Land in the same stance.", "Straight over backward. A flip, not a cork.", ["back flip"]),
  trick("frontflip", "Frontflip", "advanced", "Step-up", "Flip", "Pop and tuck forward.", "One forward flip. Spot the snow early.", "Land riding the same way.", "Over the nose. Smaller than it looks if you commit.", ["front flip"]),
  trick("wildcat", "Wildcat", "advanced", "XL kicker", "Flip", "A backflip on a sideways axis.", "The board stays across the fall line while you flip.", "Land with the board pointed downhill.", "A sideways backflip. No spin mixed in.", ["wild cat"]),
  trick("900", "900", "advanced", "Championship kicker", "Spin", "Two and a half turns. Huge wind-up.", "Spot twice. The last half is the landing.", "Land switch.", "Two and a half. The park has to be big.", ["nine hundred", "900"]),
  trick("cab720", "Cab 720", "advanced", "Championship kicker", "Spin", "Switch takeoff, two frontside turns.", "Keep the spin flat unless you mean to cork it.", "Land switch.", "A 720 that starts switch.", ["cab 720"]),
];

export function bandOf(id: string): Band | null {
  return LIBRARY.find((trick) => trick.id === id)?.band ?? null;
}

export function tricksFor(band: Band): LibraryTrick[] {
  return LIBRARY.filter((trick) => trick.band === band);
}

export function trickById(id: string): LibraryTrick | undefined {
  return LIBRARY.find((trick) => trick.id === id);
}

function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreTrick(query: string, trick: LibraryTrick): number {
  const name = norm(trick.name);
  if (query === name) return 100;
  if (trick.aliases.some((alias) => norm(alias) === query)) return 92;
  const queryTokens = query.split(" ").filter(Boolean);
  const nameTokens = name.split(" ").filter(Boolean);
  if (name.includes(query) && queryTokens.length > 0 && nameTokens.length >= queryTokens.length) return 74;
  if (nameTokens.length > 0 && nameTokens.every((token) => queryTokens.includes(token))) {
    return queryTokens.length === nameTokens.length ? 80 : 40;
  }
  const words = new Set(queryTokens);
  const nameHits = nameTokens.filter((word) => words.has(word)).length;
  const aliasHits = Math.max(
    0,
    ...trick.aliases.map((alias) => norm(alias).split(" ").filter((word) => words.has(word)).length),
  );
  return Math.max(nameHits, aliasHits);
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function cardFrom(trick: LibraryTrick, known: boolean): TrickCard {
  return {
    id: trick.id,
    name: trick.name,
    band: trick.band,
    feature: trick.feature,
    kind: trick.kind,
    takeoff: trick.takeoff,
    air: trick.air,
    landing: trick.landing,
    detail: trick.detail,
    known,
  };
}

function compose(raw: string, query: string): TrickCard {
  const degrees = query.match(/\b\d{3,4}\b/)?.[0] ?? "";
  const cork = query.includes("double cork") ? "double" : query.includes("cork") ? "cork" : "";
  const flip = query.includes("backflip")
    ? "backflip"
    : query.includes("frontflip")
      ? "frontflip"
      : query.includes("wildcat")
        ? "wildcat"
        : "";
  const grab = ["method", "mute", "indy", "melon", "stalefish", "japan", "tail grab", "nose grab"].find((name) =>
    query.includes(name),
  );
  const backside = query.includes("backside") || query.startsWith("bs ") || query.includes(" bs ");
  const frontside = query.includes("frontside") || query.startsWith("fs ") || query.includes(" fs ");
  const cab = query.includes("cab");
  const switched = query.includes("switch") || cab;
  const n = Number(degrees);
  const odd = Number.isFinite(n) && n % 360 === 180;
  const band: Band =
    cork || flip || n >= 720 ? "advanced" : n >= 360 || grab || cab ? "intermediate" : "beginner";
  const direction = backside ? "Backside" : frontside || cab ? "Frontside" : "Straight";
  const takeoff = switched
    ? "Take off switch. Wind up before the lip, not after."
    : backside
      ? "Set the backside edge and commit blind."
      : "Pop off the lip and lead with the head.";
  const air = cork
    ? "Throw it off axis. The board goes over you, not flat around you."
    : flip
      ? "Tuck the flip and spot the snow before you open."
      : grab
        ? `Hold the ${grab}. Let it go before the landing.`
        : degrees
          ? `${direction} ${degrees}. Spot the landing once per turn.`
          : "Keep the board under you and finish what you started.";
  const landing = odd || (cab && n === 540) ? "Land switch and ride away." : "Land in control, board pointed downhill.";
  const feature = band === "advanced" ? "XL kicker" : band === "intermediate" ? "M kicker" : "S kicker";
  const kind = cork ? "Cork" : flip ? "Flip" : grab ? "Grab" : degrees ? "Spin" : "Trick";
  const name = titleCase(raw);
  return {
    id: `ask-${norm(name).replace(/ /g, "-")}`,
    name,
    band,
    feature,
    kind,
    takeoff,
    air,
    landing,
    detail: `${name} isn’t pinned to one line in the book, so this is built from the trick you named. ${takeoff} ${air} ${landing}`,
    known: false,
  };
}

export function describeTrick(prompt: string): TrickCard | null {
  const query = norm(prompt);
  if (!query) return null;
  const ranked = LIBRARY.map((trick) => ({ trick, score: scoreTrick(query, trick) })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (best && best.score >= 50) return cardFrom(best.trick, true);
  return compose(prompt, query);
}
