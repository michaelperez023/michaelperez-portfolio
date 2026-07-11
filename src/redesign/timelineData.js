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
// include the Nov 2026 HAI conference, plus headroom so NOW never hits the edge.
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

// --- research track (publications + working papers + preprints) ------------
// [contentItem, decimalYear, key, extra]  — `key` gives a stable clip id
const RESEARCH = [
  [publications[0], 2025.79, "creleri", { kind: "pub", lead: true, tag: "ACM MM · first author" }],
  [publications[3], 2025.42, "muchex", { kind: "pub", tag: "IEEE CG&A" }],
  [publications[2], 2026.25, "superres", { kind: "pub", tag: "MSS · with CoVar" }],
  [workingPapers[0], 2026.5, "enkix", { kind: "working", tag: "in prep" }],
  [workingPapers[1], NOW, "temporal", { kind: "working", tag: "in prep" }],
  [publications[1], 2026.83, "hai", { kind: "pub", upcoming: true, tag: "HAI 2026 · accepted" }],
  [preprints[0], 2023.06, "animal", { kind: "preprint", tag: "arXiv survey", thumb: "/images/papers/animal.jpg", pdf: "/files/Animal_Behavior_Survey.pdf" }],
  [preprints[1], 2023.25, "urdu", { kind: "preprint", tag: "NLP", thumb: "/images/papers/urdu.jpg" }],
  [preprints[2], 2022.92, "adam", { kind: "preprint", tag: "Adv. ML", thumb: "/images/papers/adam.jpg" }],
  [preprints[3], 2022.25, "videogan", { kind: "preprint", tag: "ML", thumb: "/images/papers/videogan.jpg" }],
  [preprints[4], 2020.92, "kmeans", { kind: "preprint", tag: "Algorithms", thumb: "/images/papers/kmeans.jpg" }],
  [publications[4], 2021.42, "rhino-eval", { kind: "pub", tag: "IJCARS" }],
  [publications[5], 2021.25, "rhino-anthro", { kind: "pub", tag: "Aesthetic Surgery J." }],
  [publications[6], 2020.83, "rhino-digit", { kind: "pub", tag: "IJCARS" }],
];

const researchClips = RESEARCH.map(([item, t, key, extra]) => ({
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
  year: item.year,
  link: item.link || null,
  file: item.file || null,
  githubLink: item.githubLink || null,
  ...extra,
}));

// --- experience track (real date ranges) -----------------------------------
const COVAR_RANGE = [2025.33, 2025.62]; // CoVar internship — UF roles paused here
const EXP = [
  [workingExperience[0], COVAR_RANGE[0], COVAR_RANGE[1], "covar", { tag: "Internship" }],
  [workingExperience[1], 2023.0, NOW, "ruiz", { tag: "DARPA", hub: true, pauses: [COVAR_RANGE] }],
  [workingExperience[2], 2020.6, NOW, "ta", { tag: "Teaching", pauses: [COVAR_RANGE] }],
  [workingExperience[3], 2020.6, 2023.0, "gilm", { tag: "NSF · GILM Lab" }],
  [workingExperience[4], 2019.0, 2020.5, "rhino-ra", { tag: "Florida Poly" }],
];

const experienceClips = EXP.map(([item, t0, t1, key, extra]) => ({
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
  year: item.year,
  ...extra,
}));

// --- projects track (approximate placements — easy to edit) ----------------
// keyed by project id: [decimalYear, stableKey]
const PROJECT_META = {
  1: [2025.3, "creleri-site"], // Video Analysis Website (CReLeRI)
  11: [2021.75, "gossip", true], // Gossip & Push-Sum Simulator — Oct 2021
  2: [2020.33, "mario", true], // Mario Graphics Game — May 2020
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
  { label: "Ph.D. · UF", t0: 2020.6, t1: NOW },
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
export const clipById = Object.fromEntries(allClips.map((c) => [c.id, c]));

// Tag/skill chips associated with a clip — powers the click-a-tag-to-filter feature.
export function clipTags(clip) {
  const out = new Set();
  if (clip.track === "research") {
    out.add(clip.kind === "working" ? "WORKING PAPER" : clip.kind === "preprint" ? "PREPRINT" : "PUBLICATION");
  } else if (clip.track === "experience") {
    out.add("EXPERIENCE");
  } else if (clip.track === "projects") {
    out.add("PROJECT");
  }
  if (clip.lead) out.add("FIRST AUTHOR");
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

// --- section markers on the ruler (also the keyboard chapters 1..7) --------
export const sections = [
  { key: "intro", label: "Intro", t: NOW, panel: "intro", num: 1 },
  { key: "about", label: "About", t: NOW, panel: "about", num: 2 },
  { key: "research", label: "Research", t: 2025.79, clipId: researchClips[0].id, num: 3 },
  { key: "experience", label: "Experience", t: 2024.2, clipId: experienceClips[1].id, num: 4 },
  { key: "projects", label: "Projects", t: 2025.3, clipId: projectClips[0].id, num: 5 },
  { key: "skills", label: "Skills", t: NOW, panel: "skills", num: 6 },
  { key: "contact", label: "Contact", t: NOW, panel: "contact", num: 7 },
];

// year ticks for the ruler
export const yearTicks = [];
for (let y = 2019; y <= 2026; y++) yearTicks.push(y);
