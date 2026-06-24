// Local, deterministic "inference" for the query-and-attend feature.
// No LLM, no network, no API key — so there's zero cost and zero abuse surface.
// Three tiers: (1) curated topic answers, expanded with synonym-aware matching;
// (2) a weighted keyword search over the whole record; (3) a smart fallback.
// Citation markers [[clipId]] point at real timeline clips.

import { allClips, clipById } from "./timelineData";

// Synonym map: a query token on the left counts as the canonical term on the
// right, so phrasings we don't literally key on still hit the right topic.
const SYNONYMS = {
  edge: "deploy", production: "deploy", "production-ready": "deploy", ship: "deploy",
  serve: "deploy", serving: "deploy", onnx: "deploy", quantization: "deploy",
  deployed: "deploy", deploying: "deploy", inference: "deploy", embedded: "deploy",
  scaling: "scale", scalable: "scale", throughput: "scale", parallel: "scale",
  distributed: "scale", concurrency: "scale", "large-scale": "scale", big: "scale",
  realtime: "real-time", live: "real-time", latency: "real-time", streaming: "real-time",
  fast: "real-time", interactive: "real-time",
  videos: "video", footage: "video", "long-video": "video", clip: "video",
  understanding: "video", segmentation: "video", retrieval: "video",
  explainability: "explainable", interpretable: "explainable", interpretability: "explainable",
  transparent: "explainable", xai: "explainable",
  pipeline: "systems", pipelines: "systems", backend: "systems", infrastructure: "systems",
  fastapi: "systems", docker: "systems", mlops: "systems", engineering: "systems",
  engineer: "systems", build: "systems",
  paper: "publication", papers: "publication", published: "publication",
  publications: "publication", peer: "publication", "first-author": "first author",
  language: "nlp", summarization: "nlp", summarisation: "nlp", text: "nlp",
  transformer: "nlp", transformers: "nlp", llm: "nlp",
  algorithm: "algorithms", "data-structures": "algorithms", complexity: "algorithms",
  sorting: "algorithms", clustering: "algorithms",
  teach: "teaching", mentor: "teaching", mentoring: "teaching", students: "teaching",
  instructor: "teaching", ta: "teaching",
  opengl: "graphics", webgl: "graphics", rendering: "graphics", render: "graphics",
  tessellation: "graphics", shaders: "graphics",
  medical: "medical", imaging: "medical", surgery: "medical", surgical: "medical",
  rhinoplasty: "medical", clinical: "medical", healthcare: "medical",
  optimizer: "optimization", optimisation: "optimization", adam: "optimization",
  gradient: "optimization", sgd: "optimization", training: "optimization",
  gan: "generative", gans: "generative", generation: "generative", synthesis: "generative",
  diffusion: "generative",
  languages: "programming", coding: "programming", "c++": "programming", fsharp: "programming",
  python: "programming", java: "programming",
  darpa: "darpa", funded: "darpa", grant: "darpa",
  ar: "augmented reality", augmented: "augmented reality", hud: "augmented reality",
  drone: "detection", detection: "detection", "super-resolution": "super-resolution",
  superresolution: "super-resolution", infrared: "super-resolution", covar: "internship",
  internship: "internship", intern: "internship", industry: "internship",
  hire: "hiring", hiring: "hiring", "hire-readiness": "hiring", candidate: "hiring",
  strengths: "hiring", "why-you": "hiring",
  available: "availability", availability: "availability", remote: "availability",
  relocate: "availability", "open-to-work": "availability", start: "availability",
  data: "datascience", numpy: "datascience", pandas: "datascience", analysis: "datascience",
  reviewer: "service", review: "service", "peer-review": "service", chair: "service",
};

const TOPICS = [
  {
    keys: ["scale"],
    answer:
      "Yes. I built a distributed gossip / push-sum simulator whose convergence I verified past 2,000,000 nodes across full, line, 3D and imperfect-3D topologies [[p-gossip]]. At the Ruiz HCI Lab I also build scalable pipelines for processing and indexing large-scale video data [[e-ruiz]].",
    attend: ["p-gossip", "e-ruiz"],
  },
  {
    keys: ["real-time"],
    answer:
      "Real-time is the core of my work. ENKIx is a cognitive-load-adaptive AR task-guidance system that runs live and reached 34% F1 in a multi-team DARPA evaluation [[r-enkix]]. At CoVar I trained lightweight RGB detectors for real-time drone detection under resource-constrained deployment [[e-covar]].",
    attend: ["r-enkix", "e-covar"],
  },
  {
    keys: ["deploy"],
    answer:
      "I ship models, not just notebooks. At CoVar I trained lightweight RGB detectors for real-time drone detection under resource-constrained deployment, and built offline CV evaluation pipelines end to end [[e-covar]]. ENKIx runs live on AR hardware [[r-enkix]], and the CReLeRI tool is served from a FastAPI backend [[p-creleri-site]]. I work daily in Docker, FastAPI, Linux and HPC/SLURM.",
    attend: ["e-covar", "r-enkix", "p-creleri-site"],
  },
  {
    keys: ["video"],
    answer:
      "Video understanding is my thesis area. CReLeRI is an explainable, concept-centric long-video analysis system I first-authored at ACM Multimedia 2025 [[r-creleri]]. I also study temporal granularity as a design variable for zero-shot video retrieval [[r-temporal]], and built MuCHEx for interactive visual exploration of hierarchical classification [[r-muchex]].",
    attend: ["r-creleri", "r-temporal", "r-muchex"],
  },
  {
    keys: ["darpa"],
    answer:
      "Two DARPA-funded programs at the Ruiz HCI Lab [[e-ruiz]]: CReLeRI, an explainable long-video analysis system published at ACM Multimedia 2025 [[r-creleri]], and ENKIx, a real-time AR task-guidance system [[r-enkix]].",
    attend: ["e-ruiz", "r-creleri", "r-enkix"],
  },
  {
    keys: ["explainable"],
    answer:
      "I build systems people can actually inspect. CReLeRI is concept-centric and explainable end to end [[r-creleri]], and MuCHEx is a conversational debugging tool for visually exploring why a hierarchical classifier decides what it does [[r-muchex]].",
    attend: ["r-creleri", "r-muchex"],
  },
  {
    keys: ["systems"],
    answer:
      "I'm a systems-minded ML engineer. The CReLeRI analysis tool has a FastAPI backend serving a long-video front end [[p-creleri-site]], I built offline CV evaluation pipelines at CoVar [[e-covar]], and a distributed simulator scaling past 2M nodes [[p-gossip]] — Docker, FastAPI, Linux, HPC/SLURM day to day.",
    attend: ["p-creleri-site", "e-covar", "p-gossip"],
  },
  {
    keys: ["first author", "flagship", "creleri", "best work"],
    answer:
      "CReLeRI — my first-author paper at ACM Multimedia 2025: an explainable, concept-centric system for representation, learning, reasoning and interaction over long video [[r-creleri]].",
    attend: ["r-creleri"],
  },
  {
    keys: ["super-resolution", "detection"],
    answer:
      "At CoVar I applied infrared video super-resolution to improve long-range object classification (published at MSS 2026) [[r-superres]] and trained lightweight real-time drone detectors for constrained deployment [[e-covar]].",
    attend: ["r-superres", "e-covar"],
  },
  {
    keys: ["algorithms"],
    answer:
      "Strongly — my CS training is algorithms-heavy. I've TA'd Analysis of Algorithms and Advanced Data Structures and built automated grading tools for 100+ students [[e-ta]], and wrote a survey of the k-means clustering problem for an algorithms course [[r-kmeans]].",
    attend: ["e-ta", "r-kmeans"],
  },
  {
    keys: ["teaching"],
    answer:
      "I've been a graduate teaching assistant since 2020 across algorithms, data structures, operating systems, Python and deep-learning-for-graphics courses — building automated grading tools and supporting 100+ students [[e-ta]].",
    attend: ["e-ta"],
  },
  {
    keys: ["nlp"],
    answer:
      "On the NLP side I built abstractive summarization for a Urdu news-article dataset [[r-urdu]], and I work with Transformers and Hugging Face in my video-language research [[r-creleri]].",
    attend: ["r-urdu", "r-creleri"],
  },
  {
    keys: ["graphics"],
    answer:
      "Plenty of graphics and real-time rendering: a 2.5D WebGL game [[p-mario]], an OpenGL tessellation scene [[p-graphics]], and a 2D-visual / 3D-audio experience in OpenGL + OpenAL [[p-audio3d]]. I've also TA'd graphics courses.",
    attend: ["p-mario", "p-graphics", "p-audio3d"],
  },
  {
    keys: ["medical"],
    answer:
      "Early on I worked on medical imaging for rhinoplasty — web-based 3D facial analysis and anthropometric measurement tools, published in IJCARS and the Aesthetic Surgery Journal [[r-rhino-eval]], [[r-rhino-digit]].",
    attend: ["r-rhino-eval", "r-rhino-digit"],
  },
  {
    keys: ["optimization"],
    answer:
      "I dug into optimization directly — a study of ADAM, the stochastic optimization method, for an advanced ML course [[r-adam]] — and I train CV models day to day [[r-creleri]].",
    attend: ["r-adam", "r-creleri"],
  },
  {
    keys: ["generative"],
    answer:
      "Yes — I investigated VideoGAN for video generation and recognition [[r-videogan]], alongside my broader video-understanding work [[r-creleri]].",
    attend: ["r-videogan", "r-creleri"],
  },
  {
    keys: ["programming", "stack", "tools"],
    answer:
      "I've shipped in Python, C++, F#, Java, C, C#, SQL and Julia. A few examples: a 2M-node distributed simulator in F# with Akka.NET [[p-gossip]], my CV/ML research in Python [[r-creleri]], and graphics work in C++/OpenGL [[p-graphics]].",
    attend: ["p-gossip", "r-creleri", "p-graphics"],
  },
  {
    keys: ["augmented reality"],
    answer:
      "ENKIx is my AR work — an intelligent AR task-guidance system with cognitive-load-adaptive HUD behavior, running in real time; it reached 34% F1 in a multi-team DARPA evaluation [[r-enkix]].",
    attend: ["r-enkix"],
  },
  {
    keys: ["internship"],
    answer:
      "I interned at CoVar (summer 2025) as an ML Engineer: infrared video super-resolution for long-range classification (MSS 2026) [[r-superres]], real-time drone detection under deployment constraints, and offline CV evaluation pipelines [[e-covar]].",
    attend: ["e-covar", "r-superres"],
  },
  {
    keys: ["datascience"],
    answer:
      "Day to day I work in NumPy, pandas, SciPy, MATLAB and Jupyter, building evaluation pipelines and analysis for my CV/ML research [[e-ruiz]], and I did offline CV metric analysis at CoVar [[e-covar]].",
    attend: ["e-ruiz", "e-covar"],
  },
  {
    keys: ["service", "peer review"],
    answer:
      "I serve the community as a peer reviewer for ACM Multimedia 2025 and ACM ICMR 2026, co-chaired UF's Human-Centered Data Science Seminar, and reviewed for IEEE VR 2024 [[r-creleri]].",
    attend: ["r-creleri"],
  },
  {
    keys: ["hiring", "why hire", "strengths", "good fit", "stand out"],
    answer:
      "I pair real research with real engineering: first-author at ACM Multimedia 2025 [[r-creleri]], a published CV internship at CoVar [[e-covar]], and systems chops shown by a simulator verified past 2M nodes [[p-gossip]]. I ship end-to-end — research, pipelines, and deployment.",
    attend: ["r-creleri", "e-covar", "p-gossip"],
  },
  {
    keys: ["availability", "graduate", "when"],
    answer:
      "I'm a PhD candidate at UF graduating around August 2026 and open to full-time ML / AI Engineer roles. Reach me via the Contact section — happy to talk timelines.",
    attend: ["r-creleri"],
  },
];

// Per-clip search keywords beyond the clip's own text.
const AUGMENT = {
  "e-ta": "teaching mentor students algorithms data structures operating systems python grading",
  "r-kmeans": "algorithms clustering unsupervised complexity survey",
  "p-gossip": "distributed concurrency actor parallel scale convergence fsharp akka",
  "r-urdu": "nlp natural language summarization text news",
  "r-videogan": "generative gan video generation synthesis",
  "r-adam": "optimization optimizer gradient descent training stochastic",
  "p-mario": "graphics opengl webgl rendering game",
  "p-graphics": "graphics opengl tessellation rendering scene",
  "p-audio3d": "graphics opengl openal audio spatial sound 3d",
  "p-surgery": "graphics opengl simulation medical surgery",
  "p-twitter": "distributed actor akka fsharp concurrency",
  "r-rhino-eval": "medical imaging surgery facial rhinoplasty healthcare clinical 3d",
  "r-rhino-anthro": "medical imaging surgery facial rhinoplasty anthropometric",
  "r-rhino-digit": "medical imaging surgery facial rhinoplasty 3d web",
  "e-covar": "internship industry detection real-time super resolution infrared evaluation deploy",
  "r-creleri": "video understanding explainable multimodal transformer language reasoning",
  "r-superres": "super resolution infrared detection classification standoff",
  "r-enkix": "augmented reality ar real-time cognitive load guidance hud",
  "p-hermes": "flutter mobile dart app tracking",
  "r-temporal": "video retrieval zero-shot temporal granularity",
};

const CORPUS = allClips.map((c) => {
  const parts = [
    c.title, c.venue, c.note, c.tag, c.authors, c.sub, c.details,
    c.company, c.position, (c.tags || []).join(" "), c.kind, c.track, c.year,
    AUGMENT[c.id] || "",
  ];
  const yr = parseInt(String(c.year || "").slice(0, 4), 10) || 0;
  return { id: c.id, track: c.track, lead: !!c.lead, year: yr, title: (c.title || "").toLowerCase(), blob: parts.filter(Boolean).join(" ").toLowerCase() };
});

const STOP = new Set(
  "do you know can are is the a an of what about your you're with and to me my our show tell have has had any in on for im how does did would could should will give get list some good at would your".split(/\s+/)
);
const SHORT_OK = new Set(["ml", "ai", "ar", "cv", "ros", "gan", "hpc", "nlp", "3d", "c++", "f#", "c#", "go"]);
const stem = (w) => w.replace(/(ing|ers|er|ed|s)$/i, "");

function terms(q) {
  return q
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean)
    .filter((w) => !STOP.has(w) && (w.length >= 3 || SHORT_OK.has(w)));
}

// Expand a query with canonical synonyms so more phrasings hit the right topic.
function expand(q) {
  const lo = q.toLowerCase();
  const extra = [];
  for (const t of lo.split(/[^a-z0-9+#-]+/)) {
    if (SYNONYMS[t]) extra.push(SYNONYMS[t]);
  }
  return extra.length ? `${lo} ${extra.join(" ")}` : lo;
}

const JOB_HINTS = ["job", "role", "work", "intern", "experience", "position", "employ", "ta", "assistant", "career"];

function generalSearch(q) {
  const ts = terms(q).map(stem);
  if (!ts.length) return [];
  const jobRelevant = JOB_HINTS.some((h) => q.includes(h));
  const scored = CORPUS.map(({ id, track, lead, year, title, blob }) => {
    let s = 0;
    for (const t of ts) {
      if (title.includes(t)) s += 4;
      else if (blob.includes(t)) s += 1.5;
    }
    if (track === "experience" && !jobRelevant) s *= 0.35; // don't surface jobs for topical queries
    if (s > 0) {
      if (lead) s *= 1.5; // surface first-author work
      if (year >= 2024) s *= 1.25; // and recent work over older papers
    }
    return { id, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, 3).map((x) => x.id);
}

function composeGeneral(raw, ids) {
  const chips = ids.map((id) => `[[${id}]]`).join("  ");
  return { answer: `Closest matches in my work for “${raw.trim()}”: ${chips}.`, attend: ids, matched: true };
}

const FALLBACK = {
  answer:
    "I don't have that exact topic indexed — but here's the shape of my work: video understanding and real-time ML, flagship CReLeRI at ACM Multimedia 2025 [[r-creleri]], CV systems at CoVar [[e-covar]], and a distributed simulator past 2M nodes [[p-gossip]]. Try real-time, deployment, scale, video, algorithms, or DARPA.",
  attend: ["r-creleri", "e-covar", "p-gossip"],
  matched: false,
};

export const examples = [
  "Can you scale?",
  "Do you deploy models?",
  "Do you know algorithms?",
  "What about long video?",
  "Why should we hire you?",
];

// Deterministic per-query seed (so latency/confidence vary by question but stay
// stable for a given question, not flickering).
function seedFrom(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function runQuery(raw) {
  if (!raw || !raw.trim()) return null;
  const q = expand(raw);
  const seed = seedFrom(raw);
  const latency = 19 + (seed % 44); // 19–62 ms, varies per question
  const finish = (res, quality) => ({
    ...res,
    latency,
    // confidence reflects match quality, with slight per-query variation
    confidence: Math.max(
      38,
      Math.round((quality === "curated" ? 95 : quality === "general" ? 82 : 49) - (seed % 6))
    ),
  });

  // 1) curated topics, synonym-aware
  let best = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    let score = 0;
    for (const k of topic.keys) if (q.includes(k)) score += k.length;
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }
  if (best) return finish({ answer: best.answer, attend: best.attend, matched: true }, "curated");

  // 2) weighted keyword search over the whole record
  const ids = generalSearch(q).filter((id) => clipById[id]);
  if (ids.length) return finish(composeGeneral(raw, ids), "general");

  // 3) graceful fallback
  return finish({ answer: FALLBACK.answer, attend: FALLBACK.attend, matched: FALLBACK.matched }, "none");
}

// Split an answer into tokens; [[id]] markers become citation tokens.
export function tokenize(answer) {
  const tokens = [];
  for (const part of answer.split(/(\[\[[^\]]+\]\])/g)) {
    const m = part.match(/^\[\[([^\]]+)\]\]$/);
    if (m) {
      tokens.push({ type: "cite", id: m[1] });
    } else {
      for (const w of part.split(/(\s+)/)) {
        if (w === "") continue;
        tokens.push({ type: "text", text: w });
      }
    }
  }
  return tokens;
}
