// Optional semantic layer over the local query engine: a small sentence-
// embedding model (all-MiniLM-L6-v2, ~24MB quantized) running in the VISITOR'S
// browser via transformers.js. Nothing downloads until the visitor shows query
// intent (prewarm on console focus); weights are fetched once and cached by
// the browser. The query itself never leaves the page, there is no API key,
// and nothing runs on any server — so the zero-cost / zero-abuse-surface
// property of the engine is preserved. If the model isn't ready in time (or
// fails to load), callers fall back to the BM25 path.
import { topicDocs, clipDocs, composeGeneral } from "./retrieval";
import { clipById } from "./timelineData";

let status = "idle"; // idle | loading | ready | failed
let loadPromise = null;
let embed = null; // (texts: string[]) => Promise<number[][]>, L2-normalized
let topicVecs = null;
let clipVecs = null;

// Thresholds tuned against measured similarities (real matches score ~0.25-0.45
// after person rewriting; unrelated queries stay ≤ ~0.18).
const TOPIC_SIM = 0.32; // close enough to a curated topic to serve its answer
const CLIP_SIM = 0.2; // minimum for a clip to count as related at all
const STRONG_SIM = 0.3; // confident enough for "Yes —" phrasing

// The site's documents all speak in first person; visitors ask in second or
// third person ("do you know…", "has he built…"). Rewriting the query into
// first person measurably tightens the embedding match (0.29 → 0.45 on
// "who has he taught?") without touching unrelated-query scores.
function personify(q) {
  return q
    .replace(/\b(he|she|they|you)\b/gi, "I")
    .replace(/\b(his|her|their|your)\b/gi, "my")
    .replace(/\b(him|them)\b/gi, "me")
    .replace(/\bmichael\b/gi, "I");
}

// vectors are normalized, so cosine similarity is a dot product
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// Kick off the one-time model download + corpus embedding. Idempotent.
export function prewarm() {
  if (status !== "idle") return loadPromise;
  status = "loading";
  loadPromise = (async () => {
    const { pipeline } = await import("@huggingface/transformers");
    const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" });
    embed = async (texts) => (await extractor(texts, { pooling: "mean", normalize: true })).tolist();
    topicVecs = await embed(topicDocs.map((d) => d.text));
    clipVecs = await embed(clipDocs.map((d) => d.text));
    status = "ready";
  })().catch((e) => {
    status = "failed";
    console.warn("semantic layer unavailable, falling back to keyword search:", e?.message || e);
  });
  return loadPromise;
}

export function semanticStatus() {
  return status;
}
if (typeof window !== "undefined") {
  window.__semStatus = semanticStatus;
  // dev aid: inspect raw similarities to tune thresholds
  window.__semDebug = async (q) => {
    if (status !== "ready") return status;
    const [qv] = await embed([personify(q)]);
    const topics = topicVecs
      .map((v, i) => ({ topic: topicDocs[i].text.slice(0, 40), s: +dot(qv, v).toFixed(3) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 4);
    const clips = clipVecs
      .map((v, i) => ({ id: clipDocs[i].id, s: +dot(qv, v).toFixed(3) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 5);
    return { topics, clips };
  };
}

// Resolve a query semantically. Returns a full answer object (same shape as
// runQuery's) or null — null means "not ready in time / failed / nothing close
// enough", and the caller should fall back to the lexical path.
export async function semanticQuery(raw, waitMs = 2500) {
  if (status === "failed") return null;
  if (status !== "ready") {
    prewarm();
    await Promise.race([loadPromise, new Promise((r) => setTimeout(r, waitMs))]);
    if (status !== "ready") return null;
  }
  const [qv] = await embed([personify(raw)]);

  // 1) route to the best-written answer if the question means a curated topic
  let bestTopic = -1;
  let bestTopicSim = 0;
  topicVecs.forEach((v, i) => {
    const s = dot(qv, v);
    if (s > bestTopicSim) {
      bestTopicSim = s;
      bestTopic = i;
    }
  });
  if (bestTopic >= 0 && bestTopicSim >= TOPIC_SIM) {
    const t = topicDocs[bestTopic];
    return { answer: t.answer, attend: t.attend, matched: true, tier: "semantic" };
  }

  // 2) otherwise compose from the semantically nearest clips
  const scored = clipVecs
    .map((v, i) => ({ id: clipDocs[i].id, s: dot(qv, v) }))
    .filter((x) => x.s >= CLIP_SIM && clipById[x.id])
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
  if (!scored.length) return null;
  const ids = scored.map((x) => x.id);
  const res = composeGeneral(raw, ids, scored[0].s >= STRONG_SIM ? 1 : 0.6);
  return { ...res, tier: "semantic" };
}
