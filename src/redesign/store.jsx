import { useMemo, useReducer } from "react";
import { StoreCtx, reducer, initial } from "./storeCore";

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
      submitQuery: () => dispatch({ type: "SUBMIT_QUERY" }),
      attend: (id) => dispatch({ type: "ATTEND", id }),
      escape: () => dispatch({ type: "ESCAPE" }),
      toggleListView: () => dispatch({ type: "TOGGLE_LISTVIEW" }),
    }),
    []
  );
  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
