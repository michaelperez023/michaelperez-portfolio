import { createContext, useContext } from "react";
import {
  START,
  END,
  NOW,
  nearestClip,
  clipCenter,
  clipById,
  clipsByTime,
} from "./timelineData";
import { tokenize } from "./retrieval";

const PANELS = new Set(["intro", "about", "skills", "contact"]);
export const isPanel = (id) => PANELS.has(id);

const FULL = END - START;
export const MAX_ZOOM = 8;
const seekClamp = (t) => Math.min(END, Math.max(START, t));
const clampViewStart = (vs, zoom) => {
  const span = FULL / zoom;
  return Math.min(END - span, Math.max(START, vs));
};
// Pan the view window just enough to keep the playhead visible (with margin).
function panToShow(viewStart, zoom, playhead) {
  if (zoom <= 1) return START;
  const span = FULL / zoom;
  const lo = viewStart + 0.12 * span;
  const hi = viewStart + 0.88 * span;
  let vs = viewStart;
  if (playhead < lo) vs = playhead - 0.12 * span;
  else if (playhead > hi) vs = playhead - 0.88 * span;
  return clampViewStart(vs, zoom);
}

export const initial = {
  playhead: NOW, // decimal year of the playhead
  activeId: "intro", // anchors the coincident set (timeline selection / nearest on scrub)
  focusId: "intro", // the highlighted clip (timeline + card accent); can differ from activeId
  mode: "scrub", // 'scrub' | 'query'
  playing: false, // auto-scrub running
  query: "",
  pending: false, // a query is resolving (e.g. semantic model still warming)
  answer: null, // { tokens, attend } when a query has run
  attended: [], // clip ids currently lit by the active query
  listView: false, // accessible linear fallback
  zoom: 1, // temporal zoom (1 = whole span)
  viewStart: START, // left edge of the visible time window
  tlHeight: 300, // timeline panel height (px), user-resizable
  tlCollapsed: false, // hide the timeline for a full-screen content view
  playSpeed: 1, // playback speed multiplier (1x ≈ full career in ~20s)
  tagFilter: null, // {type,value} — when set, show all clips with this tag (ignores time)
};

// Build a state update that sets the playhead and pans the window to it.
function moved(state, playhead, extra) {
  const ph = seekClamp(playhead);
  return {
    ...state,
    playhead: ph,
    viewStart: panToShow(state.viewStart, state.zoom, ph),
    focusId: extra.activeId ?? state.focusId, // focus follows selection/scrub
    tagFilter: null, // any playhead move exits the tag filter
    pending: false, // and abandons any in-flight query
    ...extra,
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case "SEEK": {
      const near = nearestClip(seekClamp(action.t));
      return moved(state, action.t, {
        activeId: near ? near.id : state.activeId,
        mode: "scrub",
        answer: null,
        attended: [],
      });
    }
    case "TICK": {
      // like SEEK but used by the auto-scrub RAF loop (keeps `playing`)
      const near = nearestClip(seekClamp(action.t));
      return moved(state, action.t, { activeId: near ? near.id : state.activeId });
    }
    case "SELECT_CLIP": {
      const clip = clipById[action.id];
      if (!clip) return state;
      return moved(state, clipCenter(clip), {
        activeId: clip.id,
        mode: "scrub",
        playing: false,
        answer: null,
        attended: [],
      });
    }
    case "GOTO_SECTION": {
      const s = action.section;
      const playhead = s.clipId ? clipCenter(clipById[s.clipId]) : s.t;
      return moved(state, playhead, {
        activeId: s.panel || s.clipId,
        mode: "scrub",
        playing: false,
        answer: null,
        attended: [],
      });
    }
    case "STEP": {
      const order = clipsByTime;
      let idx = order.findIndex((c) => c.id === state.activeId);
      if (idx === -1) {
        let bestD = Infinity;
        order.forEach((c, i) => {
          const d = Math.abs(clipCenter(c) - state.playhead);
          if (d < bestD) {
            bestD = d;
            idx = i;
          }
        });
      }
      const next = Math.min(order.length - 1, Math.max(0, idx + action.dir));
      const clip = order[next];
      return moved(state, clipCenter(clip), {
        activeId: clip.id,
        mode: "scrub",
        playing: false,
        answer: null,
        attended: [],
      });
    }
    case "EDGE": {
      const clip = action.dir < 0 ? clipsByTime[0] : clipsByTime[clipsByTime.length - 1];
      return moved(state, clipCenter(clip), {
        activeId: clip.id,
        mode: "scrub",
        playing: false,
        answer: null,
        attended: [],
      });
    }
    case "SET_ZOOM": {
      const zoom = Math.min(MAX_ZOOM, Math.max(1, action.zoom));
      const span = FULL / zoom;
      // keep the playhead centered in the new window
      const vs = clampViewStart(state.playhead - span / 2, zoom);
      return { ...state, zoom, viewStart: zoom === 1 ? START : vs };
    }
    case "SET_ZOOM_AT": {
      // zoom toward the cursor (keep the time under the pointer fixed);
      // pin the playhead to the nearest visible edge if it would leave view.
      const zoom = Math.min(MAX_ZOOM, Math.max(1, action.zoom));
      const span = FULL / zoom;
      const vs = zoom === 1 ? START : clampViewStart(action.focusTime - action.focusFrac * span, zoom);
      let playhead = state.playhead;
      if (playhead < vs) playhead = vs;
      else if (playhead > vs + span) playhead = vs + span;
      return { ...state, zoom, viewStart: vs, playhead };
    }
    case "SET_TL_HEIGHT":
      return { ...state, tlHeight: action.value };
    case "TOGGLE_TL_COLLAPSE":
      return { ...state, tlCollapsed: !state.tlCollapsed };
    case "CYCLE_PLAY_SPEED": {
      const SPEEDS = [1, 1.5, 2, 0.5];
      const i = SPEEDS.indexOf(state.playSpeed);
      return { ...state, playSpeed: SPEEDS[(i + 1) % SPEEDS.length] };
    }
    case "SET_TAG_FILTER":
      return action.value
        ? { ...state, tagFilter: { value: action.value }, mode: "scrub", answer: null, attended: [] }
        : { ...state, tagFilter: null };
    case "FOCUS_CLIP":
      // highlight a clip (timeline + card) without moving the playhead or
      // changing which clips are shown — used by clicking a coincident card.
      return { ...state, focusId: action.id };
    case "PLAY":
      return { ...state, playing: true, mode: "scrub", answer: null, attended: [], pending: false };
    case "PAUSE":
      return { ...state, playing: false };
    case "TOGGLE_PLAY":
      return state.playing
        ? { ...state, playing: false }
        : { ...state, playing: true, mode: "scrub", answer: null, attended: [], pending: false };
    case "SET_QUERY":
      return { ...state, query: action.value };
    case "QUERY_PENDING":
      return { ...state, mode: "query", playing: false, pending: true, answer: null, attended: [], tagFilter: null };
    case "QUERY_RESULT": {
      if (!state.pending) return state; // user scrubbed away while resolving
      const res = action.res;
      return {
        ...state,
        mode: "query",
        pending: false,
        answer: {
          tokens: tokenize(res.answer),
          attend: res.attend,
          matched: res.matched,
          tier: res.tier,
          latency: action.latency, // real, measured (includes any model wait)
        },
        attended: [],
        tagFilter: null,
      };
    }
    case "ATTEND":
      return state.attended.includes(action.id)
        ? state
        : { ...state, attended: [...state.attended, action.id] };
    case "ESCAPE":
      return { ...state, mode: "scrub", playing: false, answer: null, attended: [], query: "", tagFilter: null, pending: false };
    case "TOGGLE_LISTVIEW":
      return { ...state, listView: !state.listView, playing: false };
    default:
      return state;
  }
}

export const StoreCtx = createContext(null);

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
