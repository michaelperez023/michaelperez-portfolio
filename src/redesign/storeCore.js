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
import { runQuery, tokenize } from "./retrieval";

const PANELS = new Set(["intro", "about", "skills", "contact"]);
export const isPanel = (id) => PANELS.has(id);
const seekClamp = (t) => Math.min(END, Math.max(START, t));

export const initial = {
  playhead: NOW, // decimal year of the playhead
  activeId: "intro", // a clip id, or a panel id (intro/about/skills/contact)
  mode: "scrub", // 'scrub' | 'query'
  playing: false, // auto-scrub running
  query: "",
  answer: null, // { tokens, attend } when a query has run
  attended: [], // clip ids currently lit by the active query
  listView: false, // accessible linear fallback
};

export function reducer(state, action) {
  switch (action.type) {
    case "SEEK": {
      const t = seekClamp(action.t);
      const near = nearestClip(t);
      return {
        ...state,
        playhead: t,
        activeId: near ? near.id : state.activeId,
        mode: "scrub",
        answer: null,
        attended: [],
      };
    }
    case "TICK": {
      // like SEEK but used by the auto-scrub RAF loop (keeps `playing`)
      const t = seekClamp(action.t);
      const near = nearestClip(t);
      return { ...state, playhead: t, activeId: near ? near.id : state.activeId };
    }
    case "SELECT_CLIP": {
      const clip = clipById[action.id];
      if (!clip) return state;
      return {
        ...state,
        activeId: clip.id,
        playhead: clipCenter(clip),
        mode: "scrub",
        playing: false,
        answer: null,
        attended: [],
      };
    }
    case "GOTO_SECTION": {
      const s = action.section;
      const playhead = s.clipId ? clipCenter(clipById[s.clipId]) : s.t;
      return {
        ...state,
        activeId: s.panel || s.clipId,
        playhead: seekClamp(playhead),
        mode: "scrub",
        playing: false,
        answer: null,
        attended: [],
      };
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
      return {
        ...state,
        activeId: clip.id,
        playhead: clipCenter(clip),
        mode: "scrub",
        playing: false,
        answer: null,
        attended: [],
      };
    }
    case "EDGE": {
      const clip = action.dir < 0 ? clipsByTime[0] : clipsByTime[clipsByTime.length - 1];
      return { ...state, activeId: clip.id, playhead: clipCenter(clip), mode: "scrub", playing: false, answer: null, attended: [] };
    }
    case "PLAY":
      return { ...state, playing: true, mode: "scrub", answer: null, attended: [] };
    case "PAUSE":
      return { ...state, playing: false };
    case "TOGGLE_PLAY":
      return state.playing
        ? { ...state, playing: false }
        : { ...state, playing: true, mode: "scrub", answer: null, attended: [] };
    case "SET_QUERY":
      return { ...state, query: action.value };
    case "SUBMIT_QUERY": {
      const res = runQuery(state.query);
      if (!res) return state;
      return {
        ...state,
        mode: "query",
        playing: false,
        answer: { tokens: tokenize(res.answer), attend: res.attend, matched: res.matched },
        attended: [],
      };
    }
    case "ATTEND":
      return state.attended.includes(action.id)
        ? state
        : { ...state, attended: [...state.attended, action.id] };
    case "ESCAPE":
      return { ...state, mode: "scrub", playing: false, answer: null, attended: [], query: "" };
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
