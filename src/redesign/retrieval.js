// Local, deterministic "inference" for the query-and-attend feature.
// No LLM. Three tiers, in order:
//   1) curated intents  — hand-written, polished first-person answers
//   2) general search   — keyword search over the whole record (any topic)
//   3) fallback         — only for genuinely unrelated questions
// Citation markers [[clipId]] point at real timeline clips; rendering them
// lights those clips on the timeline.

import { allClips, clipById } from "./timelineData";

const INTENTS = [
  {
    keys: ["scale", "scaling", "distributed", "throughput", "parallel", "large-scale", "concurrency", "actor"],
    answer:
      "Yes. I built a distributed gossip / push-sum simulator whose convergence I verified past 2,000,000 nodes across full, line, 3D and imperfect-3D topologies [[p-gossip]]. At the Ruiz HCI Lab I also build scalable pipelines for processing and indexing large-scale video data [[e-ruiz]].",
    attend: ["p-gossip", "e-ruiz"],
  },
  {
    keys: ["real-time", "real time", "realtime", "latency", "live", "deploy", "deployment", "edge", "production", "production-ready"],
    answer:
      "Real-time is the core of my work. ENKIx is a cognitive-load-adaptive AR task-guidance system that runs live and reached 34% F1 in a multi-team DARPA evaluation [[r-enkix]]. At CoVar I trained lightweight RGB detectors for real-time drone detection under resource-constrained deployment [[e-covar]].",
    attend: ["r-enkix", "e-covar"],
  },
  {
    keys: ["video", "long video", "understanding", "retrieval", "segmentation", "action recognition", "temporal"],
    answer:
      "Video understanding is my thesis area. CReLeRI is an explainable, concept-centric long-video analysis system I first-authored at ACM Multimedia 2025 [[r-creleri]]. I also study temporal granularity as a design variable for zero-shot video retrieval [[r-temporal]], and built MuCHEx for interactive visual exploration of hierarchical classification [[r-muchex]].",
    attend: ["r-creleri", "r-temporal", "r-muchex"],
  },
  {
    keys: ["darpa", "funded", "grant", "program"],
    answer:
      "Two DARPA-funded programs at the Ruiz HCI Lab [[e-ruiz]]: CReLeRI, an explainable long-video analysis system published at ACM Multimedia 2025 [[r-creleri]], and ENKIx, a real-time AR task-guidance system [[r-enkix]].",
    attend: ["e-ruiz", "r-creleri", "r-enkix"],
  },
  {
    keys: ["explainable", "explainability", "interpretable", "concept", "reasoning"],
    answer:
      "I build systems people can actually inspect. CReLeRI is concept-centric and explainable end to end [[r-creleri]], and MuCHEx is a conversational debugging tool for visually exploring why a hierarchical classifier decides what it does [[r-muchex]].",
    attend: ["r-creleri", "r-muchex"],
  },
  {
    keys: ["systems", "engineer", "engineering", "pipeline", "backend", "fastapi", "docker", "infrastructure"],
    answer:
      "I ship systems, not just notebooks. The CReLeRI analysis tool has a FastAPI backend serving a long-video front end [[p-creleri-site]], I built offline CV evaluation pipelines at CoVar [[e-covar]], and I work daily in Docker, FastAPI, Linux and HPC/SLURM.",
    attend: ["p-creleri-site", "e-covar"],
  },
  {
    keys: ["first author", "flagship", "creleri"],
    answer:
      "CReLeRI — my first-author paper at ACM Multimedia 2025: an explainable, concept-centric system for representation, learning, reasoning and interaction over long video [[r-creleri]].",
    attend: ["r-creleri"],
  },
  {
    keys: ["super", "resolution", "infrared", "covar", "drone"],
    answer:
      "At CoVar I applied infrared video super-resolution to improve long-range object classification (published at MSS 2026) [[r-superres]] and trained lightweight real-time drone detectors for constrained deployment [[e-covar]].",
    attend: ["r-superres", "e-covar"],
  },
  {
    keys: ["algorithm", "algorithms", "data structure", "data structures", "complexity", "sorting", "clustering", "big-o"],
    answer:
      "Strongly. My CS training is algorithms-heavy — I've TA'd Analysis of Algorithms and Advanced Data Structures and built automated grading tools for 100+ students [[e-ta]], and I wrote a survey of the k-means clustering problem for an algorithms course [[r-kmeans]].",
    attend: ["e-ta", "r-kmeans"],
  },
  {
    keys: ["teach", "teaching", "mentor", "mentoring", "instructor", "student", "students"],
    answer:
      "I've been a graduate teaching assistant since 2020 across algorithms, data structures, operating systems, Python and deep-learning-for-graphics courses — building automated grading tools and supporting 100+ students [[e-ta]].",
    attend: ["e-ta"],
  },
  {
    keys: ["nlp", "language", "summarization", "summarisation", "text", "transformer", "transformers"],
    answer:
      "On the NLP side I built abstractive summarization for a Urdu news-article dataset [[r-urdu]], and I work with Transformers and Hugging Face regularly in my video-language research [[r-creleri]].",
    attend: ["r-urdu", "r-creleri"],
  },
  {
    keys: ["graphics", "opengl", "webgl", "rendering", "render", "tessellation", "game", "3d audio", "openal"],
    answer:
      "Plenty — I've built graphics and real-time rendering projects: a 2.5D WebGL game [[p-mario]], an OpenGL tessellation scene [[p-graphics]], and a 2D-visual / 3D-audio experience in OpenGL + OpenAL [[p-audio3d]]. I've also TA'd graphics courses.",
    attend: ["p-mario", "p-graphics", "p-audio3d"],
  },
  {
    keys: ["medical", "imaging", "surgery", "surgical", "rhinoplasty", "facial", "health", "clinical"],
    answer:
      "Early in my research I worked on medical imaging for rhinoplasty — web-based 3D facial analysis and anthropometric measurement tools, published in IJCARS and the Aesthetic Surgery Journal [[r-rhino-eval]], [[r-rhino-digit]].",
    attend: ["r-rhino-eval", "r-rhino-digit"],
  },
  {
    keys: ["optimization", "optimisation", "adam", "gradient", "training", "sgd", "optimizer"],
    answer:
      "I dug into optimization directly — a study of ADAM, the stochastic optimization method, for an advanced ML course [[r-adam]], and I train CV models day to day across my research [[r-creleri]].",
    attend: ["r-adam", "r-creleri"],
  },
  {
    keys: ["gan", "generative", "generation", "videogan", "synthesis"],
    answer:
      "Yes — I investigated VideoGAN for video generation and recognition [[r-videogan]], alongside my broader video-understanding work [[r-creleri]].",
    attend: ["r-videogan", "r-creleri"],
  },
  {
    keys: ["programming language", "programming languages", "languages", "coding", "what languages", "which languages", "c++", "f#"],
    answer:
      "I've shipped in Python, C++, F#, Java, C, C#, SQL and Julia. A few examples: a 2M-node distributed simulator in F# with Akka.NET [[p-gossip]], my CV/ML research in Python [[r-creleri]], and graphics work in C++/OpenGL [[p-graphics]].",
    attend: ["p-gossip", "r-creleri", "p-graphics"],
  },
];

// Extra search keywords for clips whose own text doesn't spell out a topic.
const AUGMENT = {
  "e-ta": "teaching teach mentor students instructor algorithms data structures operating systems python graphics grading",
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
  "e-covar": "internship industry detection real-time super resolution infrared evaluation",
  "r-creleri": "video understanding explainable multimodal transformer language reasoning",
  "r-superres": "super resolution infrared detection classification standoff",
  "r-enkix": "augmented reality ar real-time cognitive load guidance",
  "p-hermes": "flutter mobile dart app tracking",
  "r-temporal": "video retrieval zero-shot temporal granularity",
};

// Build a lowercase search blob per clip, once.
const CORPUS = allClips.map((c) => {
  const parts = [
    c.title, c.venue, c.note, c.tag, c.authors, c.sub, c.details,
    c.company, c.position, (c.tags || []).join(" "), c.kind, c.track, c.year,
    AUGMENT[c.id] || "",
  ];
  return { id: c.id, title: (c.title || "").toLowerCase(), blob: parts.filter(Boolean).join(" ").toLowerCase() };
});

const STOP = new Set(
  "do you know can are is the a an of what about your you're with and to me my show tell have has had any in on for im how does did would could should will give get list any some".split(/\s+/)
);
const SHORT_OK = new Set(["ml", "ai", "ar", "cv", "ros", "gan", "hpc", "nlp", "3d", "c++", "f#", "c#"]);

function terms(q) {
  return q
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean)
    .filter((w) => !STOP.has(w) && (w.length >= 3 || SHORT_OK.has(w)));
}

function generalSearch(q) {
  const ts = terms(q);
  if (!ts.length) return [];
  const scored = CORPUS.map(({ id, title, blob }) => {
    let s = 0;
    for (const t of ts) {
      if (title.includes(t)) s += 3;
      else if (blob.includes(t)) s += 1;
    }
    return { id, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, 3).map((x) => x.id);
}

function composeGeneral(raw, ids) {
  const chips = ids.map((id) => `[[${id}]]`).join("  ");
  return {
    answer: `That connects to a few things in my record: ${chips}.`,
    attend: ids,
    matched: true,
  };
}

const FALLBACK = {
  answer:
    "I don't have anything indexed on that — but here's the shape of my work: video understanding and real-time ML, flagship CReLeRI at ACM Multimedia 2025 [[r-creleri]], CV systems at CoVar [[e-covar]], and a distributed simulator verified past 2M nodes [[p-gossip]]. Try asking about video, real-time, scale, algorithms, teaching, or DARPA work.",
  attend: ["r-creleri", "e-covar", "p-gossip"],
  matched: false,
};

// Suggested example prompts shown under the query bar.
export const examples = [
  "Can you scale?",
  "Real-time systems?",
  "Do you know algorithms?",
  "What about long video?",
  "Show me your DARPA work",
];

export function runQuery(raw) {
  const q = (raw || "").toLowerCase();
  if (!q.trim()) return null;

  // 1) curated intents
  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const k of intent.keys) if (q.includes(k)) score += k.length;
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  if (best) return { answer: best.answer, attend: best.attend, matched: true };

  // 2) general keyword search over the whole record
  const ids = generalSearch(q).filter((id) => clipById[id]);
  if (ids.length) return composeGeneral(raw, ids);

  // 3) graceful fallback (genuinely unrelated)
  return { answer: FALLBACK.answer, attend: FALLBACK.attend, matched: FALLBACK.matched };
}

// Split an answer string into tokens, where citation markers [[id]] become
// citation tokens. Used by the Monitor to stream + render chips.
export function tokenize(answer) {
  const tokens = [];
  const parts = answer.split(/(\[\[[^\]]+\]\])/g);
  for (const part of parts) {
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
