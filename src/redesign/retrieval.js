// Local, deterministic "inference" for the query-and-attend feature.
// No LLM, no network, no API key — so there's zero cost and zero abuse surface.
// Three tiers: (1) curated topic answers, with synonym expansion and typo
// correction; (2) BM25 over a word-boundary stemmed index of the whole record,
// composed into a prose answer that adapts to the question's shape; (3) an
// honest fallback. Citation markers [[clipId]] point at real timeline clips.

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
  engineer: "systems",
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
  ai: "machine learning", ml: "machine learning", pytorch: "machine learning",
  tensorflow: "machine learning", keras: "machine learning", huggingface: "machine learning",
  neural: "machine learning", cnn: "machine learning", cnns: "machine learning",
  deep: "machine learning", vision: "machine learning", artificial: "machine learning",
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
    keys: ["machine learning", "computer vision", "deep learning"],
    answer:
      "AI is my day job — I'm a computer-vision / ML researcher and engineer. Flagship: CReLeRI, my first-author explainable video-understanding system at ACM Multimedia 2025 [[r-creleri]]. On the applied side, real-time drone detection and infrared super-resolution at CoVar (MSS 2026) [[e-covar]], and daily PyTorch across two DARPA-funded programs [[e-ruiz]].",
    attend: ["r-creleri", "e-covar", "e-ruiz"],
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
      "You'd get someone who pairs publishable research with the engineering to put it to work — I prototype the model and build the pipeline around it. That range shows up as a first-author paper at ACM Multimedia 2025 [[r-creleri]], published infrared video super-resolution work from my CoVar internship [[e-covar]], and a distributed simulator whose convergence I verified past 2,000,000 nodes [[p-gossip]] — research velocity backed by real engineering discipline.",
    attend: ["r-creleri", "e-covar", "p-gossip"],
  },
  {
    keys: ["availability", "graduate", "when", "start", "relocate"],
    answer:
      "I'm a PhD candidate at UF, available to start full-time on August 10, 2026 — open to ML / AI Engineer roles on-site, hybrid, or remote, and happy to relocate. Reach me via the Contact section to talk timelines [[r-creleri]].",
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

const STOP = new Set(
  "do you know can are is the a an of what about your you're with and to me my our show tell have has had any in on for im how does did would could should will give get list some good at use used using familiar done worked ever".split(/\s+/)
);
const SHORT_OK = new Set(["ml", "ai", "ar", "cv", "ros", "gan", "hpc", "nlp", "3d", "c++", "f#", "c#", "go"]);
const stem = (w) => w.replace(/(ing|ers|er|ed|s)$/i, "");

// Word-boundary tokens (stemmed, stopworded) — never substrings, so a short
// query like "ai" can't match the inside of "training".
function toks(s) {
  return String(s)
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean)
    .filter((w) => !STOP.has(w) && (w.length >= 3 || SHORT_OK.has(w)))
    .map(stem);
}

// --- BM25 index over every clip, with field weighting (title > tags > rest) ---
const DOCS = allClips.map((c) => {
  const tf = new Map();
  const add = (text, w) => toks(text).forEach((t) => tf.set(t, (tf.get(t) || 0) + w));
  add(c.title || "", 3);
  add([(c.tags || []).join(" "), c.tag, c.kind].filter(Boolean).join(" "), 2);
  add(
    [c.venue, c.note, c.authors, c.sub, c.details, c.company, c.position, c.track, c.year, AUGMENT[c.id] || ""]
      .filter(Boolean)
      .join(" "),
    1
  );
  let len = 0;
  tf.forEach((v) => (len += v));
  const yr = parseInt(String(c.year || "").slice(0, 4), 10) || 0;
  return { id: c.id, track: c.track, lead: !!c.lead, year: yr, tf, len };
});
const AVGLEN = DOCS.reduce((a, d) => a + d.len, 0) / DOCS.length;
const DF = new Map();
DOCS.forEach((d) => d.tf.forEach((_, t) => DF.set(t, (DF.get(t) || 0) + 1)));
const VOCAB = [...DF.keys()];
const idf = (t) => {
  const df = DF.get(t) || 0;
  return df ? Math.log(1 + (DOCS.length - df + 0.5) / (df + 0.5)) : 0;
};

// --- typo tolerance: nearest known term within a small edit distance ---
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function nearest(word, candidates) {
  if (word.length < 4 || /^\d+$/.test(word)) return null;
  let best = null;
  // conservative: distance 2 only on long words, or real words get "corrected"
  // into vocabulary (e.g. weaving -> serving)
  let bestD = word.length >= 8 ? 2 : 1;
  for (const c of candidates) {
    const d = editDistance(word, c, bestD);
    if (d <= bestD && (d < bestD || best === null)) {
      bestD = d;
      best = c;
      if (d === 0) break;
    }
  }
  return best;
}

// Vocabulary the topic matcher understands (for typo-correcting the query).
const KEY_VOCAB = [
  ...new Set([
    ...Object.keys(SYNONYMS),
    ...TOPICS.flatMap((t) => t.keys.flatMap((k) => k.split(" "))),
  ]),
];

// Expand a query: fix near-miss typos against known vocabulary, then append
// canonical synonyms so phrasings we don't literally key on still hit topics.
function expand(q) {
  const words = q.toLowerCase().split(/[^a-z0-9+#-]+/).filter(Boolean);
  const extra = [];
  const fixed = words.map((w) => {
    let t = w;
    if (!STOP.has(t) && !SYNONYMS[t] && t.length >= 5 && !DF.has(stem(t))) {
      t = nearest(t, KEY_VOCAB) || nearest(stem(t), VOCAB) || t;
    }
    if (SYNONYMS[t]) extra.push(SYNONYMS[t]);
    return t;
  });
  return `${fixed.join(" ")} ${extra.join(" ")}`.trim();
}

// Match a topic key at word boundaries ("scale" shouldn't fire inside "scaled-up" text randomly).
function hasKey(q, k) {
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(q);
}

const JOB_HINTS = ["job", "role", "work", "intern", "experience", "position", "employ", "ta", "assistant", "career"];

// BM25 over the record. Returns the top ids plus how much of the ORIGINAL
// query the best document actually covered (drives honest answer phrasing).
function generalSearch(raw, expanded) {
  const fix = (t) => (DF.has(t) ? t : nearest(t, VOCAB) || t);
  const origTs = [...new Set(toks(raw).map(fix))];
  const ts = [...new Set([...origTs, ...toks(expanded).map(fix)])];
  if (!ts.length) return null;
  const jobRelevant = JOB_HINTS.some((h) => raw.toLowerCase().includes(h));
  const K1 = 1.4;
  const B = 0.6;
  const scored = DOCS.map((d) => {
    let s = 0;
    let origHits = 0;
    for (const t of ts) {
      const f = d.tf.get(t) || 0;
      if (!f) continue;
      if (origTs.includes(t)) origHits++;
      s += idf(t) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / AVGLEN)));
    }
    if (d.track === "experience" && !jobRelevant) s *= 0.35; // don't surface jobs for topical queries
    if (s > 0) {
      if (d.lead) s *= 1.5; // surface first-author work
      if (d.year >= 2024) s *= 1.25; // and recent work over older papers
    }
    return { id: d.id, s, origHits };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  if (!scored.length) return null;
  return {
    ids: scored.slice(0, 3).map((x) => x.id),
    coverage: origTs.length ? scored[0].origHits / origTs.length : 0,
  };
}

// One line of grounding context for a cited clip in a composed answer.
function clipContext(c) {
  if (c.track === "research") return [c.venue || c.note, c.year].filter(Boolean).join(", ");
  if (c.track === "experience") return [c.company, c.year].filter(Boolean).join(", ");
  return [(c.tags || [])[0], c.year].filter(Boolean).join(", ");
}

// "do you know X / experience with X / what about X" → capture X so the answer
// can respond to the question instead of echoing it.
const ASK_RE =
  /^(?:do (?:you|u) (?:know|have|use)|have you (?:used|worked with|done|tried)|any experience (?:with|in)|experience (?:with|in)|what about|how about|familiar with|worked with|know|used?)\s+(.+?)[?.!]*$/i;

function composeGeneral(raw, ids, coverage) {
  const frags = ids.map((id) => {
    const ctx = clipContext(clipById[id]);
    return `[[${id}]]${ctx ? ` (${ctx})` : ""}`;
  });
  const list = frags.length > 1 ? `${frags.slice(0, -1).join("; ")}; and ${frags[frags.length - 1]}` : frags[0];
  const m = raw.trim().match(ASK_RE);
  const subject = m ? m[1].trim() : null;
  const strong = coverage >= 0.99;
  let opener;
  if (subject && strong) opener = `Yes — ${subject} shows up directly in my work:`;
  else if (subject) opener = `${subject} isn't a headline topic of mine, but the closest work I have:`;
  else if (strong) opener = `Here's where that shows up in my work:`;
  else opener = `Closest matches in my work for “${raw.trim()}”:`;
  return { answer: `${opener} ${list}.`, attend: ids, matched: strong };
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

// tier reports which retrieval path actually answered — shown honestly in the
// HUD (no simulated metrics): "curated" | "keyword" | "overview".
export function runQuery(raw) {
  if (!raw || !raw.trim()) return null;
  const q = expand(raw); // typo-corrected + synonym-expanded

  // 1) curated topics, matched at word boundaries
  let best = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    let score = 0;
    for (const k of topic.keys) if (hasKey(q, k)) score += k.length;
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }
  if (best) return { answer: best.answer, attend: best.attend, matched: true, tier: "curated" };

  // 2) BM25 over the whole record, composed into a question-aware answer
  const hit = generalSearch(raw, q);
  if (hit) {
    const ids = hit.ids.filter((id) => clipById[id]);
    if (ids.length) return { ...composeGeneral(raw, ids, hit.coverage), tier: "keyword" };
  }

  // 3) graceful fallback
  return { answer: FALLBACK.answer, attend: FALLBACK.attend, matched: FALLBACK.matched, tier: "overview" };
}

// --- documents for the optional in-browser semantic layer (semantic.js) ---
const stripCites = (s) => s.replace(/\[\[[^\]]+\]\]/g, "").replace(/\s+/g, " ").trim();
export const topicDocs = TOPICS.map((t) => ({
  answer: t.answer,
  attend: t.attend,
  text: `${t.keys.join(", ")}. ${stripCites(t.answer)}`,
}));
export const clipDocs = allClips.map((c) => ({
  id: c.id,
  text: [
    c.title, c.venue, c.note, c.sub, c.details, c.company, c.position,
    (c.tags || []).join(", "), AUGMENT[c.id] || "",
  ]
    .filter(Boolean)
    .join(". "),
}));
export { composeGeneral };

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
