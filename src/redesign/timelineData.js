// Derived timeline model for "THE CUT".
// Maps every entry in content.js onto a single time axis (2018 -> 2026),
// so the whole portfolio can be scrubbed like footage.
//
// NOTE: papers/jobs carry real years; project dates are best-effort
// placements inferred from coursework/degree timeline and are easy to
// adjust (see PROJECT_DATES below).

import {
  publications,
  workingPapers,
  preprints,
  workingExperience,
  projects,
} from "../data/content";

// --- time axis -------------------------------------------------------------
export const START = 2018.55; // Aug 2018 — B.S. begins
// "now" tracks the real current date so the timeline stays live.
const _today = new Date();
export const NOW =
  _today.getFullYear() + (_today.getMonth() + Math.min(0.999, (_today.getDate() - 1) / 31)) / 12;
// headroom past NOW so the playhead never sits at the edge.
export const END = Math.max(2026.95, NOW + 0.18);

export const pos = (t) => (t - START) / (END - START); // -> 0..1 fraction
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// decimal year -> "YYYY · Mon" timecode label
export function fmtTime(t) {
  const year = Math.floor(t);
  let m = Math.floor((t - year) * 12); // the month the time falls within
  if (m > 11) m = 11;
  if (m < 0) m = 0;
  return `${year} · ${MONTHS[m]}`;
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);

// short label for a clip block (keeps the timeline legible)
const short = (title, n = 22) =>
  title.length > n ? title.slice(0, n - 1).trimEnd() + "…" : title;

// Extra links an entry lists in content.js beyond url/link, githubLink and its
// report, e.g. links: [{ label: "Play in browser", url: "https://…" }]
// (href works in place of url). Returned as [{ label, href }].
export const extraLinks = (item) =>
  Array.isArray(item?.links)
    ? item.links.map((l) => ({ label: l?.label, href: l?.url ?? l?.href })).filter((l) => l.label && l.href)
    : [];

// Content entries are looked up by their id in content.js, never by position,
// so adding or reordering entries there cannot move a clip onto the wrong item.
function entry(list, id, listName) {
  const item = list.find((x) => x.id === id);
  if (!item && import.meta.env.DEV) console.warn(`timelineData: ${listName} has no entry with id ${id}`);
  return item;
}
const pub = (id) => entry(publications, id, "publications");
const working = (id) => entry(workingPapers, id, "workingPapers");
const report = (id) => entry(preprints, id, "preprints");
const job = (id) => entry(workingExperience, id, "workingExperience");

// What each kind of research item is called; the card chip shows it in capitals.
// An entry of the preprints list says what it is in content.js (kind: "preprint"
// or "class-report"); one that does not say gets no chip.
const KIND_NAMES = {
  pub: "Publication",
  working: "Working paper",
  preprint: "Preprint",
  "class-report": "Class report",
};
export const kindName = (kind) => KIND_NAMES[kind] ?? null;
export const kindLabel = (clip) =>
  clip.track === "research" ? kindName(clip.kind)?.toUpperCase() ?? null : null;
const reportKind = (item) =>
  item.kind === "preprint" || item.kind === "class-report" ? item.kind : "report";

// --- research track (publications + working papers + preprints) ------------
// [contentItem, decimalYear, key, extra]  — `key` gives a stable clip id
const RESEARCH = [
  [pub(1), 2025.79, "creleri", { kind: "pub", lead: true, tag: "ACM MM · first author" }],
  [pub(2), 2025.42, "muchex", { kind: "pub", tag: "IEEE CG&A" }],
  [pub(8), 2026.25, "superres", { kind: "pub", tag: "MSS · with CoVar" }],
  // Active manuscripts follow the present so they do not age out of the monitor's time window.
  [working(1), NOW, "enkix", { kind: "working", tag: "in prep" }],
  [working(2), NOW, "temporal", { kind: "working", tag: "in prep" }],
  [working(3), NOW, "thesis", { kind: "working", tag: "Thesis · in prep" }], // renamed; its old id still opens it (CLIP_ALIASES)
  [working(4), NOW, "hai-prep", { kind: "working", tag: "under review", review: true }], // Keep the existing clip ID for shared links.
  // Preprints and class reports take their kind from content.js.
  [report(0), 2023.06, "animal", { tag: "arXiv survey", thumb: "/images/papers/animal.jpg", pdf: "/files/Animal_Behavior_Survey.pdf" }],
  [report(1), 2023.25, "urdu", { tag: "NLP", thumb: "/images/papers/urdu.jpg" }],
  [report(2), 2022.92, "adam", { tag: "Adv. ML", thumb: "/images/papers/adam.jpg" }],
  [report(3), 2022.25, "videogan", { tag: "ML", thumb: "/images/papers/videogan.jpg" }],
  [report(5), 2020.92, "kmeans", { tag: "Algorithms", thumb: "/images/papers/kmeans.jpg" }],
  [pub(3), 2021.42, "rhino-eval", { kind: "pub", tag: "IJCARS" }],
  [pub(4), 2021.25, "rhino-anthro", { kind: "pub", tag: "Aesthetic Surgery J." }],
  [pub(6), 2020.83, "rhino-digit", { kind: "pub", tag: "IJCARS" }],
];

const researchClips = RESEARCH.filter(([item]) => item).map(([item, t, key, extra]) => ({
  id: `r-${key}`,
  track: "research",
  t0: t,
  t1: t,
  point: true,
  label: short(item.title),
  title: item.title,
  venue: item.venue || null,
  authors: item.authors || null,
  note: item.note || null,
  summary: item.summary || null,
  demo: item.demo || false,
  year: item.year,
  link: item.link || null,
  file: item.file || null,
  githubLink: item.githubLink || null,
  links: extraLinks(item),
  kind: reportKind(item),
  ...extra,
}));

// --- experience track (real date ranges) -----------------------------------
const COVAR_RANGE = [2025.33, 2025.62]; // CoVar internship — UF roles paused here
const GRAD = 2026.6; // Ph.D. completed August 7, 2026 — UF roles end here
const RAFT_END = 2026 + (10 + 1 / 31) / 12; // November 2, 2026; same decimal-year convention as NOW
const EXP = [
  [job(6), 2026.61, RAFT_END, "raft", { tag: "Industry" }], // Raft — Aug 10 to Nov 2, 2026
  [job(1), COVAR_RANGE[0], COVAR_RANGE[1], "covar", { tag: "Internship" }],
  [job(2), 2023.0, GRAD, "ruiz", { tag: "DARPA", hub: true, pauses: [COVAR_RANGE] }],
  [job(3), 2020.6, GRAD, "ta", { tag: "Teaching", pauses: [COVAR_RANGE] }],
  [job(4), 2020.6, 2023.0, "gilm", { tag: "NSF · GILM Lab" }],
  [job(5), 2019.0, 2020.5, "rhino-ra", { tag: "Florida Poly" }],
];

const experienceClips = EXP.filter(([item]) => item).map(([item, t0, t1, key, extra]) => ({
  id: `e-${key}`,
  track: "experience",
  t0,
  t1,
  point: false,
  label: item.position,
  title: item.position,
  company: item.company,
  location: item.location,
  details: item.details,
  highlights: item.highlights,
  year: item.year,
  ...extra,
}));

// --- projects track (approximate placements — easy to edit) ----------------
// keyed by project id: [decimalYear, stableKey]
const PROJECT_META = {
  1: [2025.3, "creleri-site"], // CReLeRI Video Analysis System
  11: [2021.75, "gossip", true], // Gossip & Push-Sum Simulator — Oct 2021
  2: [2020.33, "mario", true], // Escape the Maze — May 2020
  3: [2021.25, "audio3d", true], // From Here to There: 3D Audio — April 2021
  4: [2021.92, "twitter", true], // Twitter Clone — Dec 2021
  5: [2021.83, "graphics", true], // Advanced Graphics Scene — Nov 2021
  6: [2020.25, "hermes", true], // Hermes Tracker — April 2020
  7: [2019.25, "gamead", true], // Game Advertisement Video — April 2019
  8: [2023.5, "villas", true], // DR Villas Booking — Summer 2023
  9: [2020.75, "surgery", true], // Surgery Tool Simulator — Oct 2020
  10: [2026.5, "portfolio"], // This Portfolio
  12: [2026.53, "brisal", true], // Brisal Mountain Retreat — July 2026
};

const projectClips = projects.map((p) => {
  const [t, key, exact] = PROJECT_META[p.id] ?? [2022, slug(p.title)];
  return {
    id: `p-${key}`,
    track: "projects",
    t0: t,
    t1: t,
    point: true,
    label: short(p.title, 18),
    title: p.title,
    sub: p.subtitle,
    image: p.image,
    url: p.url || null,
    link: p.url || null,
    githubLink: p.githubLink || null,
    file: p.report || null,
    links: extraLinks(p),
    tags: p.tags || [],
    approx: !exact,
  };
});

// --- education era bands (background context on the ruler) ------------------
// Greedy row-packing so overlapping degrees (M.S. + Ph.D. both start 2020)
// never render their labels on top of each other.
const eraDefs = [
  { label: "B.S. · Florida Poly", t0: START, t1: 2020.4 },
  { label: "M.S. · UF", t0: 2020.6, t1: 2023.4 },
  { label: "Ph.D. · UF", t0: 2020.6, t1: 2026.6 }, // completed Aug 2026
];
const eraRowEnds = [];
export const eras = eraDefs.map((e) => {
  let row = eraRowEnds.findIndex((end) => end <= e.t0 + 0.01);
  if (row === -1) {
    row = eraRowEnds.length;
    eraRowEnds.push(e.t1);
  } else {
    eraRowEnds[row] = e.t1;
  }
  return { ...e, row };
});
export const eraRowCount = eraRowEnds.length;

// --- assembled tracks ------------------------------------------------------
export const tracks = [
  { key: "experience", label: "EXPERIENCE", clips: experienceClips },
  { key: "research", label: "RESEARCH", clips: researchClips },
  { key: "projects", label: "PROJECTS", clips: projectClips },
];

// Assign each clip a FIXED sub-row, packed once over the full span, so a clip
// never jumps rows when you zoom (the timeline just renders visible clips in
// their fixed rows). Point clips use an estimated label footprint; bars use
// their real time extent.
const ASSUMED_W = 1312;
function clipFootprint(c) {
  if (c.point) {
    const px = c.label.length * 6.9 + 34;
    const w = Math.min(0.13, px / ASSUMED_W);
    const center = pos(c.t0);
    return [center - w / 2, center + w / 2];
  }
  const labelW = Math.min(0.18, (c.label.length * 6.9 + 22) / ASSUMED_W);
  return [pos(c.t0), Math.max(pos(c.t1), pos(c.t0) + labelW) + 0.012];
}
function packTrack(clips) {
  const sorted = [...clips].sort((a, b) => a.t0 - b.t0 || a.t1 - b.t1);
  const rowRight = [];
  for (const c of sorted) {
    const [leftX, rightX] = clipFootprint(c);
    let row = rowRight.findIndex((end) => end <= leftX - 0.004);
    if (row === -1) {
      row = rowRight.length;
      rowRight.push(rightX);
    } else {
      rowRight[row] = rightX;
    }
    c._row = row;
  }
}
tracks.forEach((t) => packTrack(t.clips));

export const allClips = tracks.flatMap((t) => t.clips);
// No prototype, so an id taken from a URL (e.g. #clip/constructor) finds nothing.
export const clipById = Object.assign(
  Object.create(null),
  Object.fromEntries(allClips.map((c) => [c.id, c]))
);

// Clip ids that were renamed, mapped to their current id, so links that were
// already shared (#clip/<old id>) still open the clip.
const CLIP_ALIASES = new Map([
  ["r-wacv", "r-thesis"],
]);
export const resolveClipId = (id) => (clipById[id] ? id : CLIP_ALIASES.get(id) ?? id);

// Tag/skill chips associated with a clip — powers the click-a-tag-to-filter feature.
export function clipTags(clip) {
  const out = new Set();
  if (clip.track === "research") {
    const kind = kindLabel(clip);
    if (kind) out.add(kind);
  } else if (clip.track === "experience") {
    out.add("EXPERIENCE");
  } else if (clip.track === "projects") {
    out.add("PROJECT");
  }
  if (clip.lead) out.add("FIRST AUTHOR");
  if (clip.review) out.add("UNDER REVIEW");
  if (clip.demo) out.add("DEMO");
  if (clip.tag) out.add(clip.tag);
  (clip.tags || []).forEach((t) => out.add(t));
  return out;
}

export function clipsMatchingTag(value) {
  const v = (value || "").toLowerCase();
  return allClips
    .filter((c) => [...clipTags(c)].some((t) => t.toLowerCase() === v))
    .map((c) => c.id);
}

// center time of a clip (for nearest-clip selection + click-to-seek)
export const clipCenter = (c) => (c.t0 + c.t1) / 2;

// Is a span clip active at time t? (false inside any paused range, e.g. a role
// paused for a summer internship.)
export function barActiveAt(c, t) {
  if (c.point || t < c.t0 || t > c.t1) return false;
  if (c.pauses) for (const [ps, pe] of c.pauses) if (t >= ps && t <= pe) return false;
  return true;
}

// Nearest clip to a playhead time. Point clips (papers/projects) are the salient
// "events"; a long background role bar only wins if no point clip is reasonably
// near (containing bars get a distance just above the coincidence window).
export function nearestClip(t) {
  let best = null;
  let bestD = Infinity;
  for (const c of allClips) {
    const d = barActiveAt(c, t) ? 0.26 : Math.abs(clipCenter(c) - t);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

// clips ordered along time (for arrow-key stepping)
export const clipsByTime = [...allClips].sort(
  (a, b) => clipCenter(a) - clipCenter(b)
);

// --- sections: the nav panels and the keyboard chapters 1..7 ----------------
// A chapter opens a panel at the present, or a clip named by its id.
export const sections = [
  { key: "intro", label: "Intro", t: NOW, panel: "intro", num: 1 },
  { key: "about", label: "About", t: NOW, panel: "about", num: 2 },
  { key: "research", label: "Research", clipId: "r-creleri", num: 3 }, // the CReLeRI demo (ACM MM 2025)
  { key: "experience", label: "Experience", clipId: "e-ruiz", num: 4 }, // the Ruiz-lab research role
  { key: "projects", label: "Projects", clipId: "p-creleri-site", num: 5 }, // the CReLeRI video analysis system
  { key: "skills", label: "Skills", t: NOW, panel: "skills", num: 6 },
  { key: "contact", label: "Contact", t: NOW, panel: "contact", num: 7 },
];
if (import.meta.env.DEV) {
  for (const s of sections) {
    if (s.clipId && !clipById[s.clipId]) console.warn(`timelineData: chapter ${s.num} names a missing clip, ${s.clipId}`);
  }
}
