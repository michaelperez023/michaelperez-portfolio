import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiChevronUp } from "react-icons/fi";
import { useStore, isPanel } from "./storeCore";
import Monitor from "./Monitor";
import Timeline from "./Timeline";
import TransportBar from "./TransportBar";
import ListView from "./ListView";
import { START, END, sections } from "./timelineData";

const PANEL_KEYS = ["about", "skills", "contact", "intro"];

// Parse the URL hash into a restorable view intent (deep links).
function readHashIntent() {
  const h = (window.location.hash || "").replace(/^#/, "");
  if (!h) return null;
  const slash = h.indexOf("/");
  const head = slash === -1 ? h : h.slice(0, slash);
  const arg = slash === -1 ? "" : decodeURIComponent(h.slice(slash + 1));
  if (head === "tag" && arg) return { type: "tag", value: arg };
  if (head === "q" && arg) return { type: "q", value: arg };
  if (head === "clip" && arg) return { type: "clip", value: arg };
  if (PANEL_KEYS.includes(head)) return { type: "panel", value: head };
  return null;
}

// The shareable hash that represents the current view.
function hashForState(s) {
  if (s.tagFilter) return `#tag/${encodeURIComponent(s.tagFilter.value)}`;
  if (s.mode === "query" && s.answer && s.query) return `#q/${encodeURIComponent(s.query)}`;
  if (isPanel(s.activeId) && s.activeId !== "intro") return `#${s.activeId}`;
  if (s.focusId && !isPanel(s.focusId)) return `#clip/${s.focusId}`;
  return "";
}

export default function TheCut() {
  const { state, actions } = useStore();
  const stateRef = useRef(state);
  stateRef.current = state;
  const timelineWrapRef = useRef(null);

  // first-visit cue: pulse the playhead so the scrub interaction is discoverable
  // (once per browser session)
  const [firstVisit] = useState(() => {
    try {
      return !sessionStorage.getItem("cut-onboarded");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem("cut-onboarded", "1");
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  // Deep links: restore the view from the URL hash on load...
  useEffect(() => {
    const intent = readHashIntent();
    if (!intent) return;
    if (intent.type === "tag") actions.setTagFilter(intent.value);
    else if (intent.type === "q") {
      actions.setQuery(intent.value);
      actions.submitQuery();
    } else if (intent.type === "clip") actions.selectClip(intent.value);
    else if (intent.type === "panel") {
      const s = sections.find((x) => x.key === intent.value);
      if (s) actions.gotoSection(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ...and keep the hash in sync with the current view (debounced; replaceState
  // so scrubbing doesn't spam history). The address bar is always shareable.
  useEffect(() => {
    const id = setTimeout(() => {
      const want = hashForState(stateRef.current);
      const cur = window.location.hash || "";
      if (want !== cur) {
        const url = want || window.location.pathname + window.location.search;
        try {
          window.history.replaceState(null, "", url);
        } catch {
          /* ignore */
        }
      }
    }, 300);
    return () => clearTimeout(id);
  }, [state.tagFilter, state.mode, state.answer, state.activeId, state.focusId, state.query]);

  // resizable timeline height (drag the top handle) — height lives in the store
  const resizing = useRef(null);
  const userResizedTl = useRef(false);
  const onResizeDown = (e) => {
    userResizedTl.current = true; // stop auto-sizing once the user drags
    resizing.current = { startY: e.clientY, startH: stateRef.current.tlHeight };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  // On load (and window resize), size the timeline so the intro sits snugly
  // above it — i.e. the timeline fills everything below the intro hint.
  useLayoutEffect(() => {
    const compute = () => {
      if (userResizedTl.current) return;
      const intro = document.querySelector(".intro");
      const topbar = document.querySelector(".cut-topbar");
      const transport = document.querySelector(".transport");
      const monitor = document.querySelector(".cut-monitor");
      if (!intro || !topbar || !transport || !monitor) return;
      // measure the intro's actual bottom relative to the monitor top — this
      // captures the console + examples + intro content exactly.
      const cs = getComputedStyle(monitor);
      const needed =
        intro.getBoundingClientRect().bottom -
        monitor.getBoundingClientRect().top +
        parseFloat(cs.paddingBottom) +
        6;
      const avail = window.innerHeight - topbar.offsetHeight - transport.offsetHeight - needed;
      const tl = Math.min(Math.round(window.innerHeight * 0.78), Math.max(180, Math.round(avail)));
      if (Math.abs(tl - stateRef.current.tlHeight) > 2) actions.setTlHeight(tl);
    };
    compute();
    window.addEventListener("resize", compute);
    document.fonts?.ready.then(compute);
    return () => window.removeEventListener("resize", compute);
  }, [actions]);
  const onResizeMove = (e) => {
    const r = resizing.current;
    if (!r) return;
    const max = Math.round(window.innerHeight * 0.62);
    const next = Math.min(max, Math.max(168, r.startH + (r.startY - e.clientY)));
    actions.setTlHeight(next);
  };
  const onResizeUp = () => {
    resizing.current = null;
  };

  // global keyboard transport
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (e.key === "Escape") {
        actions.escape();
        el?.blur?.();
        return;
      }
      if (e.key === "/" && !typing) {
        e.preventDefault();
        document.querySelector("[data-query-input]")?.focus();
        return;
      }
      if (typing) return;
      if (e.key === " ") {
        if (el && (el.tagName === "BUTTON" || el.tagName === "A")) return;
        e.preventDefault();
        actions.togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        actions.step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        actions.step(1);
      } else if (e.key === "Home") {
        e.preventDefault();
        actions.edge(-1);
      } else if (e.key === "End") {
        e.preventDefault();
        actions.edge(1);
      } else if (/^[1-7]$/.test(e.key)) {
        const s = sections[parseInt(e.key, 10) - 1];
        if (s) actions.gotoSection(s);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        actions.setZoom(stateRef.current.zoom * 1.5);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        actions.setZoom(stateRef.current.zoom / 1.5);
      } else if (e.key === "0") {
        e.preventDefault();
        actions.setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions]);

  // wheel-to-scrub over the timeline region (native, non-passive)
  useEffect(() => {
    const node = timelineWrapRef.current;
    if (!node) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // pinch / ctrl+wheel => temporal zoom toward the cursor
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        const area = node.querySelector(".tl-area");
        if (area) {
          const rect = area.getBoundingClientRect();
          const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          const span = (END - START) / stateRef.current.zoom;
          const focusTime = stateRef.current.viewStart + frac * span;
          actions.setZoomAt(stateRef.current.zoom * factor, focusTime, frac);
        } else {
          actions.setZoom(stateRef.current.zoom * factor);
        }
        return;
      }
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const step = (END - START) / stateRef.current.zoom / 1600;
      actions.seek(stateRef.current.playhead + delta * step);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [actions]);

  // two-finger pinch-to-zoom on the timeline (mobile/touch)
  useEffect(() => {
    const node = timelineWrapRef.current;
    if (!node) return;
    let pinch = null;
    const dist = (ts) => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
    const onStart = (e) => {
      if (e.touches.length !== 2) return;
      const area = node.querySelector(".tl-area");
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const frac = Math.min(1, Math.max(0, (cx - rect.left) / rect.width));
      const span = (END - START) / stateRef.current.zoom;
      pinch = {
        startDist: dist(e.touches),
        startZoom: stateRef.current.zoom,
        focusTime: stateRef.current.viewStart + frac * span,
        focusFrac: frac,
      };
    };
    const onMove = (e) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const factor = dist(e.touches) / pinch.startDist;
      actions.setZoomAt(pinch.startZoom * factor, pinch.focusTime, pinch.focusFrac);
    };
    const onEnd = (e) => {
      if (e.touches.length < 2) pinch = null;
    };
    node.addEventListener("touchstart", onStart, { passive: false });
    node.addEventListener("touchmove", onMove, { passive: false });
    node.addEventListener("touchend", onEnd);
    node.addEventListener("touchcancel", onEnd);
    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
      node.removeEventListener("touchend", onEnd);
      node.removeEventListener("touchcancel", onEnd);
    };
  }, [actions]);

  // auto-scrub play loop
  useEffect(() => {
    if (!state.playing) return;
    let raf;
    let last = null;
    const frame = (ts) => {
      if (last == null) last = ts;
      const dt = ts - last;
      last = ts;
      // 1x ≈ full span in 20s; speed read live so the chip applies mid-play
      const speed = ((END - START) / 20000) * stateRef.current.playSpeed;
      const next = stateRef.current.playhead + speed * dt;
      if (next >= END) {
        actions.tick(END);
        actions.pause();
        return;
      }
      actions.tick(next);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [state.playing, actions]);

  return (
    <div
      className={`cut-root${firstVisit ? " onboarding" : ""}`}
      style={{ gridTemplateRows: `auto minmax(0, 1fr) ${state.tlCollapsed ? 34 : state.tlHeight}px auto` }}
    >
      <header className="cut-topbar">
        <button className="cut-brand" onClick={() => actions.gotoSection(sections.find((s) => s.key === "intro"))}>
          MICHAEL&nbsp;PÉREZ
        </button>
        <span className="cut-brand-sub">video understanding · in real time</span>
        <nav className="cut-nav">
          {["about", "skills", "contact"].map((k) => {
            const s = sections.find((x) => x.key === k);
            return (
              <button
                key={k}
                className={`cut-nav-link${state.activeId === s.panel ? " on" : ""}`}
                onClick={() => actions.gotoSection(s)}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>
      <main className="cut-monitor">
        <Monitor />
      </main>
      <section
        className={`cut-timeline${state.tlCollapsed ? " collapsed" : ""}`}
        ref={timelineWrapRef}
        aria-label="Career timeline (scrub to explore)"
      >
        {state.tlCollapsed ? (
          <button className="tl-show" onClick={() => actions.toggleTlCollapse()}>
            <FiChevronUp size={15} /> Show timeline
          </button>
        ) : (
          <>
            <div
              className="tl-resize"
              role="separator"
              aria-orientation="horizontal"
              aria-label="Drag to resize the timeline"
              title="Drag to resize"
              onPointerDown={onResizeDown}
              onPointerMove={onResizeMove}
              onPointerUp={onResizeUp}
              onPointerCancel={onResizeUp}
            >
              <span className="tl-resize-grip" />
            </div>
            <div className="tl-zoom" role="group" aria-label="Timeline zoom">
              <button onClick={() => actions.setZoom(state.zoom / 1.5)} disabled={state.zoom <= 1.01} aria-label="Zoom out" title="Zoom out (−)">−</button>
              <button className="tl-zoom-val" onClick={() => actions.setZoom(1)} title="Reset zoom (0)">{state.zoom.toFixed(1)}×</button>
              <button onClick={() => actions.setZoom(state.zoom * 1.5)} aria-label="Zoom in" title="Zoom in (+)">+</button>
            </div>
            <Timeline />
          </>
        )}
      </section>
      <TransportBar />
      {state.listView && <ListView />}
    </div>
  );
}
