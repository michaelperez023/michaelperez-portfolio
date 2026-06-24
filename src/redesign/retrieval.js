// Local, deterministic "inference" for the query-and-attend feature.
// No LLM: a tiny keyword matcher maps a natural-ish query to a curated,
// first-person answer whose citation chips ([[clipId]]) point at real
// timeline clips. Rendering the chips lights those clips on the timeline.

const INTENTS = [
  {
    keys: ["scale", "scaling", "distributed", "throughput", "parallel", "big", "large-scale", "concurrency"],
    answer:
      "Yes. I built a distributed gossip / push-sum simulator whose convergence I verified past 2,000,000 nodes across full, line, 3D and imperfect-3D topologies [[p-gossip]]. At the Ruiz HCI Lab I also build scalable pipelines for processing and indexing large-scale video data [[e-ruiz]].",
    attend: ["p-gossip", "e-ruiz"],
  },
  {
    keys: ["real-time", "real time", "realtime", "latency", "live", "fast", "deploy", "deployment", "edge", "production"],
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
    keys: ["systems", "engineer", "engineering", "pipeline", "backend", "fastapi", "docker", "infrastructure", "build"],
    answer:
      "I ship systems, not just notebooks. The CReLeRI analysis tool has a FastAPI backend serving a long-video front end [[p-creleri-site]], I built offline CV evaluation pipelines at CoVar [[e-covar]], and I work daily in Docker, FastAPI, Linux and HPC/SLURM.",
    attend: ["p-creleri-site", "e-covar"],
  },
  {
    keys: ["first author", "lead", "best", "flagship", "main", "creleri"],
    answer:
      "CReLeRI — my first-author paper at ACM Multimedia 2025: an explainable, concept-centric system for representation, learning, reasoning and interaction over long video [[r-creleri]].",
    attend: ["r-creleri"],
  },
  {
    keys: ["super", "resolution", "infrared", "covar", "detection", "drone"],
    answer:
      "At CoVar I applied infrared video super-resolution to improve long-range object classification (published at MSS 2026) [[r-superres]] and trained lightweight real-time drone detectors for constrained deployment [[e-covar]].",
    attend: ["r-superres", "e-covar"],
  },
];

const FALLBACK = {
  answer:
    "I'm a PhD candidate at UF working on video understanding, computer vision and real-time ML. Flagship: CReLeRI, first-authored at ACM Multimedia 2025 [[r-creleri]]. I ship real systems — CV pipelines at CoVar [[e-covar]] and a distributed simulator verified past 2M nodes [[p-gossip]]. Try asking about real-time, video, scale, or DARPA work.",
  attend: ["r-creleri", "e-covar", "p-gossip"],
};

// Suggested example prompts shown under the query bar.
export const examples = [
  "Can you scale?",
  "Real-time systems?",
  "What about long video?",
  "Show me your DARPA work",
  "Are you production-ready?",
];

export function runQuery(raw) {
  const q = (raw || "").toLowerCase();
  if (!q.trim()) return null;
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
  const hit = best || FALLBACK;
  return { answer: hit.answer, attend: hit.attend, matched: !!best };
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
