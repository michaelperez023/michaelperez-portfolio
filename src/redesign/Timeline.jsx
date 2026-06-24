import { useRef } from "react";
import { useStore } from "./storeCore";
import {
  START,
  END,
  NOW,
  pos,
  clamp,
  tracks,
  eras,
  eraRowCount,
  honorMarks,
  sections,
  yearTicks,
  fmtTime,
} from "./timelineData";

export default function Timeline() {
  const { state, actions } = useStore();
  const areaRef = useRef(null);
  const dragging = useRef(false);

  const timeFromX = (clientX) => {
    const rect = areaRef.current.getBoundingClientRect();
    const f = clamp((clientX - rect.left) / rect.width, 0, 1);
    return START + f * (END - START);
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    actions.seek(timeFromX(e.clientX));
  };
  const onPointerMove = (e) => {
    if (dragging.current) actions.seek(timeFromX(e.clientX));
  };
  const endDrag = () => {
    dragging.current = false;
  };

  const onHandleKey = (e) => {
    const STEP = (END - START) / 96;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      actions.seek(state.playhead - STEP);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      actions.seek(state.playhead + STEP);
    }
  };

  const phPct = pos(state.playhead) * 100;
  const lit = new Set(state.attended);

  return (
    <div className="tl">
      {/* ruler: years + section flags + honors + NOW */}
      <div className="tl-ruler">
        {yearTicks.map((y) => (
          <span key={y} className="tl-year" style={{ left: `${pos(y) * 100}%` }}>
            {String(y).slice(2)}
          </span>
        ))}
        {honorMarks.map((h) => (
          <span
            key={h.id}
            className="tl-honor"
            style={{ left: `${pos(h.t) * 100}%` }}
            title={`★ ${h.title}`}
            aria-hidden="true"
          />
        ))}
        <span className="tl-now-flag" style={{ left: `${pos(NOW) * 100}%` }}>
          NOW
        </span>
        <div className="tl-sections">
          {sections.map((s) => (
            <button
              key={s.key}
              className={`tl-flag${state.activeId === (s.panel || s.clipId) ? " on" : ""}`}
              style={{ left: `${pos(s.t) * 100}%` }}
              onClick={() => actions.gotoSection(s)}
              title={`${s.num} · ${s.label}`}
            >
              <span className="tl-flag-num">{s.num}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* scrub surface: era bands + tracks + playhead */}
      <div
        className="tl-area"
        ref={areaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* education era bands (context) */}
        <div className="tl-eras" aria-hidden="true" style={{ height: `${eraRowCount * 16}px` }}>
          {eras.map((era) => (
            <span
              key={era.label}
              className="tl-era"
              style={{
                left: `${pos(era.t0) * 100}%`,
                width: `${(pos(era.t1) - pos(era.t0)) * 100}%`,
                top: `${era.row * 16}px`,
              }}
            >
              {era.label}
            </span>
          ))}
        </div>

        {tracks.map((track) => (
          <div className={`tl-track tl-track-${track.key}`} key={track.key}>
            <span className="tl-track-label">{track.label}</span>
            <div className="tl-lane">
              {track.clips.map((c) => {
                const left = pos(c.t0) * 100;
                const isActive = state.activeId === c.id;
                const isLit = lit.has(c.id);
                if (c.point) {
                  const frac = left / 100;
                  const anchor = frac > 0.82 ? " edge-r" : frac < 0.06 ? " edge-l" : "";
                  return (
                    <button
                      key={c.id}
                      className={`tl-clip${isActive ? " active" : ""}${isLit ? " lit" : ""} k-${c.kind || "project"}${c.upcoming ? " upcoming" : ""}${anchor}`}
                      style={{ left: `${left}%` }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => actions.selectClip(c.id)}
                      title={c.title}
                    >
                      <span className="tl-clip-dot" />
                      <span className="tl-clip-label">{c.label}</span>
                    </button>
                  );
                }
                const width = (pos(c.t1) - pos(c.t0)) * 100;
                return (
                  <button
                    key={c.id}
                    className={`tl-bar${isActive ? " active" : ""}${isLit ? " lit" : ""}${c.hub ? " hub" : ""}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => actions.selectClip(c.id)}
                    title={`${c.title} — ${c.company}`}
                  >
                    <span className="tl-bar-label">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* playhead */}
        <div className="tl-playhead" style={{ left: `${phPct}%` }} aria-hidden="true">
          <span className="tl-playhead-line" />
        </div>
        <div
          className="tl-playhead-handle"
          style={{ left: `${phPct}%` }}
          role="slider"
          tabIndex={0}
          aria-label="Career playhead"
          aria-valuemin={Math.round(START)}
          aria-valuemax={Math.round(END)}
          aria-valuenow={Math.round(state.playhead)}
          aria-valuetext={fmtTime(state.playhead)}
          onKeyDown={onHandleKey}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragging.current = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => dragging.current && actions.seek(timeFromX(e.clientX))}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
    </div>
  );
}
