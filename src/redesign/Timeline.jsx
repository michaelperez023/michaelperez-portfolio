import { useRef } from "react";
import { useStore } from "./storeCore";
import {
  START,
  END,
  NOW,
  clamp,
  tracks,
  eras,
  eraRowCount,
  honorMarks,
  sections,
  yearTicks,
  fmtTime,
} from "./timelineData";

const FULL = END - START;
const ASSUMED_W = 1312; // assumed timeline width (px) for label-width estimates

export default function Timeline() {
  const { state, actions } = useStore();
  const areaRef = useRef(null);
  const dragging = useRef(false);

  // visible time window (zoom + pan)
  const viewSpan = FULL / state.zoom;
  const viewStart = state.viewStart;
  const vpos = (t) => (t - viewStart) / viewSpan; // -> 0..1 across the viewport

  const timeFromX = (clientX) => {
    const rect = areaRef.current.getBoundingClientRect();
    const f = clamp((clientX - rect.left) / rect.width, 0, 1);
    return viewStart + f * viewSpan;
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
    const STEP = viewSpan / 96;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      actions.seek(state.playhead - STEP);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      actions.seek(state.playhead + STEP);
    }
  };

  const phPct = vpos(state.playhead) * 100;
  const lit = new Set(state.attended);
  const aboutSection = sections.find((s) => s.panel === "about");

  // A clip's horizontal footprint [leftX, rightX] in viewport fractions.
  const footprint = (c) => {
    if (c.point) {
      const px = c.label.length * 6.9 + 34;
      const w = Math.min(0.13, px / ASSUMED_W);
      const center = vpos(c.t0);
      return [center - w / 2, center + w / 2];
    }
    const labelW = Math.min(0.18, (c.label.length * 6.9 + 22) / ASSUMED_W);
    return [vpos(c.t0), Math.max(vpos(c.t1), vpos(c.t0) + labelW) + 0.012];
  };

  // Pack the visible clips of a track into sub-rows (greedy, no overlap).
  const layoutTrack = (clips) => {
    const visible = clips.filter((c) => {
      const [l, r] = footprint(c);
      return r >= -0.15 && l <= 1.15;
    });
    const sorted = [...visible].sort((a, b) => a.t0 - b.t0 || a.t1 - b.t1);
    const rowRight = [];
    const byRow = [];
    for (const c of sorted) {
      const [leftX, rightX] = footprint(c);
      let row = rowRight.findIndex((end) => end <= leftX - 0.004);
      if (row === -1) {
        row = rowRight.length;
        rowRight.push(rightX);
        byRow.push([]);
      } else {
        rowRight[row] = rightX;
      }
      byRow[row].push(c);
    }
    return { byRow, rows: Math.max(1, byRow.length) };
  };

  const renderClip = (c) => {
    const left = vpos(c.t0) * 100;
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
    const leftPct = Math.max(0, vpos(c.t0) * 100);
    const rightPct = Math.min(100, vpos(c.t1) * 100);
    return (
      <button
        key={c.id}
        className={`tl-bar${isActive ? " active" : ""}${isLit ? " lit" : ""}${c.hub ? " hub" : ""}`}
        style={{ left: `${leftPct}%`, width: `${Math.max(1, rightPct - leftPct)}%` }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => actions.selectClip(c.id)}
        title={`${c.title} — ${c.company}`}
      >
        <span className="tl-bar-label">{c.label}</span>
      </button>
    );
  };

  const inView = (t, m = 0.02) => vpos(t) >= -m && vpos(t) <= 1 + m;

  return (
    <div className="tl">
      {/* ruler: years + section flags + honors + NOW */}
      <div className="tl-ruler">
        {yearTicks.filter((y) => inView(y)).map((y) => (
          <span key={y} className="tl-year" style={{ left: `${vpos(y) * 100}%` }}>
            {String(y).slice(2)}
          </span>
        ))}
        {honorMarks.filter((h) => inView(h.t)).map((h) => (
          <button
            key={h.id}
            className="tl-honor"
            style={{ left: `${vpos(h.t) * 100}%` }}
            title={`★ Honor — ${h.title} (${h.year})`}
            aria-label={`Honor: ${h.title}`}
            onClick={() => actions.gotoSection(aboutSection)}
          />
        ))}
        {inView(NOW) && (
          <span className="tl-now-flag" style={{ left: `${vpos(NOW) * 100}%` }}>
            NOW
          </span>
        )}
        <div className="tl-sections">
          {sections.filter((s) => inView(s.t)).map((s) => (
            <button
              key={s.key}
              className={`tl-flag${state.activeId === (s.panel || s.clipId) ? " on" : ""}`}
              style={{ left: `${vpos(s.t) * 100}%` }}
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
          {eras
            .filter((era) => vpos(era.t1) >= 0 && vpos(era.t0) <= 1)
            .map((era) => {
              const l = Math.max(0, vpos(era.t0) * 100);
              const r = Math.min(100, vpos(era.t1) * 100);
              return (
                <span
                  key={era.label}
                  className="tl-era"
                  style={{ left: `${l}%`, width: `${r - l}%`, top: `${era.row * 16}px` }}
                >
                  {era.label}
                </span>
              );
            })}
        </div>

        {tracks.map((track) => {
          const { byRow, rows } = layoutTrack(track.clips);
          return (
            <div
              className={`tl-track tl-track-${track.key}`}
              key={track.key}
              style={{ flexGrow: rows }}
            >
              <span className="tl-track-label">{track.label}</span>
              <div className="tl-lane">
                {byRow.map((clips, ri) => (
                  <div className="tl-sublane" key={ri}>
                    {clips.map((c) => renderClip(c))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

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
