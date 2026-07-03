import { useMemo, useReducer } from "react";
import { StoreCtx, reducer, initial } from "./storeCore";
import { runQuery } from "./retrieval";
import { semanticQuery } from "./semantic";

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const actions = useMemo(
    () => ({
      seek: (t) => dispatch({ type: "SEEK", t }),
      tick: (t) => dispatch({ type: "TICK", t }),
      selectClip: (id) => dispatch({ type: "SELECT_CLIP", id }),
      gotoSection: (section) => dispatch({ type: "GOTO_SECTION", section }),
      step: (dir) => dispatch({ type: "STEP", dir }),
      edge: (dir) => dispatch({ type: "EDGE", dir }),
      play: () => dispatch({ type: "PLAY" }),
      pause: () => dispatch({ type: "PAUSE" }),
      togglePlay: () => dispatch({ type: "TOGGLE_PLAY" }),
      setQuery: (value) => dispatch({ type: "SET_QUERY", value }),
      // Resolve a query: curated (sync) wins; otherwise try the in-browser
      // semantic layer (bounded wait), falling back to BM25 / overview.
      submitQuery: async (q) => {
        const query = (q ?? "").trim();
        if (!query) return;
        dispatch({ type: "QUERY_PENDING" });
        const t0 = performance.now();
        let res = runQuery(query);
        if (res.tier !== "curated") {
          const sem = await semanticQuery(query).catch(() => null);
          if (sem) res = sem;
        }
        dispatch({ type: "QUERY_RESULT", res, latency: performance.now() - t0 });
      },
      attend: (id) => dispatch({ type: "ATTEND", id }),
      escape: () => dispatch({ type: "ESCAPE" }),
      toggleListView: () => dispatch({ type: "TOGGLE_LISTVIEW" }),
      focusClip: (id) => dispatch({ type: "FOCUS_CLIP", id }),
      setZoom: (zoom) => dispatch({ type: "SET_ZOOM", zoom }),
      setZoomAt: (zoom, focusTime, focusFrac) =>
        dispatch({ type: "SET_ZOOM_AT", zoom, focusTime, focusFrac }),
      setTlHeight: (value) => dispatch({ type: "SET_TL_HEIGHT", value }),
      toggleTlCollapse: () => dispatch({ type: "TOGGLE_TL_COLLAPSE" }),
      cyclePlaySpeed: () => dispatch({ type: "CYCLE_PLAY_SPEED" }),
      setTagFilter: (value) => dispatch({ type: "SET_TAG_FILTER", value }),
    }),
    []
  );
  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
