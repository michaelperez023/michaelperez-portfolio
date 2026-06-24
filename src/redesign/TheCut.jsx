import { useEffect, useRef, useState } from "react";
import { useStore } from "./storeCore";
import Monitor from "./Monitor";
import Timeline from "./Timeline";
import TransportBar from "./TransportBar";
import ListView from "./ListView";
import { START, END, sections } from "./timelineData";

export default function TheCut() {
  const { state, actions } = useStore();
  const stateRef = useRef(state);
  stateRef.current = state;
  const timelineWrapRef = useRef(null);

  // resizable timeline height (drag the top handle)
  const [tlHeight, setTlHeight] = useState(224);
  const resizing = useRef(null);
  const onResizeDown = (e) => {
    resizing.current = { startY: e.clientY, startH: tlHeight };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onResizeMove = (e) => {
    const r = resizing.current;
    if (!r) return;
    const max = Math.round(window.innerHeight * 0.62);
    const next = Math.min(max, Math.max(168, r.startH + (r.startY - e.clientY)));
    setTlHeight(next);
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
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const step = (END - START) / 1600;
      actions.seek(stateRef.current.playhead + delta * step);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [actions]);

  // auto-scrub play loop
  useEffect(() => {
    if (!state.playing) return;
    let raf;
    let last = null;
    const speed = (END - START) / 15000; // full span in ~15s
    const frame = (ts) => {
      if (last == null) last = ts;
      const dt = ts - last;
      last = ts;
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
      className="cut-root"
      style={{ gridTemplateRows: `auto minmax(0, 1fr) ${tlHeight}px auto` }}
    >
      <header className="cut-topbar">
        <span className="cut-brand">MICHAEL&nbsp;PÉREZ</span>
        <span className="cut-brand-sub">video understanding · in real time</span>
      </header>
      <main className="cut-monitor">
        <Monitor />
      </main>
      <section className="cut-timeline" ref={timelineWrapRef} aria-label="Career timeline (scrub to explore)">
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
        <Timeline />
      </section>
      <TransportBar />
      {state.listView && <ListView />}
    </div>
  );
}
