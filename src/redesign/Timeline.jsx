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
  fmtTime,
} from "./timelineData";

const FULL = END - START;
const ASSUMED_W = 1312; // assumed timeline width (px) for label-width estimates
const CHROME = 168; // approx non-lane vertical overhead in the timeline panel
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Ruler ticks: years when zoomed out, months once the window is short enough.
function rulerTicks(vs, ve, span) {
  const ticks = [];
  if (span > 3.2) {
    for (let y = Math.ceil(vs - 0.001); y <= Math.floor(ve + 0.001); y++) {
      ticks.push({ key: `y${y}`, t: y, label: `'${String(y).slice(2)}`, major: true });
    }
  } else {
    const labelEvery = span <= 1.4 ? 1 : 3; // months between labels
    for (let y = Math.floor(vs); y <= Math.ceil(ve); y++) {
      for (let m = 0; m < 12; m++) {
        const t = y + m / 12;
        if (t < vs - 0.03 || t > ve + 0.03) continue;
        const major = m === 0;
        const labeled = major || m % labelEvery === 0;
        ticks.push({
          key: `${y}-${m}`,
          t,
          major,
          label: labeled ? (major ? `${MONTHS[0]} '${String(y).slice(2)}` : MONTHS[m]) : "",
        });
      }
    }
  }
  return ticks;
}

// Active sub-intervals of a span once paused ranges are removed.
function activeIntervals(t0, t1, pauses) {
  if (!pauses || !pauses.length) return [[t0, t1]];
  const sorted = [...pauses].sort((a, b) => a[0] - b[0]);
  const out = [];
  let cur = t0;
  for (const [ps, pe] of sorted) {
    const s = Math.max(t0, ps);
    const e = Math.min(t1, pe);
    if (e <= cur) continue;
    if (s > cur) out.push([cur, s]);
    cur = Math.max(cur, e);
  }
  if (cur < t1) out.push([cur, t1]);
  return out;
}

// Secondary line shown in a clip's hover tooltip.
function tipMeta(c) {
  if (c.track === "research") return [c.year, c.venue].filter(Boolean).join(" · ");
  if (c.track === "experience") return [c.company, c.year].filter(Boolean).join(" · ");
  return (c.tags || []).join(" · ");
}

export default function Timeline() {
  const { state, actions } = useStore();
  const areaRef = useRef(null);
  const dragging = useRef(false);

  // visible time window (zoom + pan)
  const viewSpan = FULL / state.zoom;
  const viewStart = state.viewStart;
  const viewEnd = viewStart + viewSpan;
  const vpos = (t) => (t - viewStart) / viewSpan; // -> 0..1 across the viewport

  const timeFromX = (clientX) => {
    const rect = areaRef.current.getBoundingClientRect();
    const f = clamp((clientX - rect.left) / rect.width, 0, 1);
    return viewStart + f * viewSpan;
  };

  const capture = (e) => {
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    capture(e);
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

  // Render the visible clips of a track in their FIXED sub-rows (assigned once
  // over the full span), so a clip never changes row when you zoom.
  const layoutTrack = (clips) => {
    const visible = clips.filter((c) => {
      const [l, r] = footprint(c);
      return r >= -0.15 && l <= 1.15;
    });
    let maxRow = 0;
    visible.forEach((c) => {
      if (c._row > maxRow) maxRow = c._row;
    });
    const rows = maxRow + 1;
    const byRow = Array.from({ length: rows }, () => []);
    visible.forEach((c) => byRow[c._row].push(c));
    return { byRow, rows };
  };

  const layouts = tracks.map((t) => ({ track: t, ...layoutTrack(t.clips) }));
  const sumRows = layouts.reduce((a, l) => a + l.rows, 0);
  const bandH = (state.tlHeight - CHROME) / sumRows;
  const compact = bandH < 17; // bands too short for legible labels -> dots
  // The experience track is weighted heavier; show its bar labels only when that
  // band is tall enough (otherwise clean thin bars + tooltips).
  const expRows = layouts.find((l) => l.track.key === "experience")?.rows || 1;
  const totalWeight = layouts.reduce((a, l) => a + (l.track.key === "experience" ? l.rows * 2.2 : l.rows), 0);
  const expBandH = ((state.tlHeight - CHROME) * (expRows * 2.2)) / totalWeight / expRows;
  const showBarLabels = expBandH >= 15;

  const renderClip = (c) => {
    const isActive = state.focusId === c.id;
    const isLit = lit.has(c.id);
    const showLabel = !compact || isActive || isLit;
    const tipImg = c.thumb || c.image;
    const tip = (
      <span className="tl-tip" aria-hidden="true">
        {tipImg && <img className="tl-tip-img" src={tipImg} alt="" loading="lazy" />}
        <span className="tl-tip-title">{c.title}</span>
        {tipMeta(c) && <span className="tl-tip-meta">{tipMeta(c)}</span>}
      </span>
    );
    if (c.point) {
      const left = vpos(c.t0) * 100;
      if (!showLabel) {
        return (
          <button
            key={c.id}
            className={`tl-dot k-${c.kind || "project"}${isActive ? " active" : ""}${isLit ? " lit" : ""}${c.upcoming ? " upcoming" : ""}`}
            style={{ left: `${left}%` }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => actions.selectClip(c.id)}
            aria-label={c.title}
          >
            {tip}
          </button>
        );
      }
      // anchor by the clip's FIXED full-span position so it never flips while panning
      const fullFrac = pos(c.t0);
      const anchor = fullFrac > 0.9 ? " edge-r" : fullFrac < 0.035 ? " edge-l" : "";
      return (
        <button
          key={c.id}
          className={`tl-clip${isActive ? " active" : ""}${isLit ? " lit" : ""} k-${c.kind || "project"}${c.upcoming ? " upcoming" : ""}${anchor}`}
          style={{ left: `${left}%` }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => actions.selectClip(c.id)}
        >
          <span className="tl-clip-dot" />
          <span className="tl-clip-label">{c.label}</span>
          {tip}
        </button>
      );
    }
    // bar (experience), split around any paused ranges (e.g. internship)
    const intervals = activeIntervals(c.t0, c.t1, c.pauses);
    let widest = 0;
    intervals.forEach((iv, i) => {
      if (iv[1] - iv[0] > intervals[widest][1] - intervals[widest][0]) widest = i;
    });
    const segs = intervals.map((iv, i) => {
      const l = Math.max(0, vpos(iv[0]) * 100);
      const r = Math.min(100, vpos(iv[1]) * 100);
      if (r <= l) return null;
      return (
        <button
          key={`${c.id}-${i}`}
          className={`tl-bar${isActive ? " active" : ""}${isLit ? " lit" : ""}${c.hub ? " hub" : ""}`}
          style={{ left: `${l}%`, width: `${Math.max(1, r - l)}%` }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => actions.selectClip(c.id)}
          aria-label={`${c.title} — ${c.company}`}
        >
          {showBarLabels && i === widest && <span className="tl-bar-label">{c.label}</span>}
          {tip}
        </button>
      );
    });
    const gaps = (c.pauses || []).map((p, gi) => {
      const l = Math.max(0, vpos(Math.max(c.t0, p[0])) * 100);
      const r = Math.min(100, vpos(Math.min(c.t1, p[1])) * 100);
      if (r <= l) return null;
      return (
        <span
          key={`${c.id}-gap-${gi}`}
          className="tl-bar-pause"
          style={{ left: `${l}%`, width: `${r - l}%` }}
          aria-hidden="true"
        />
      );
    });
    return [...segs, ...gaps];
  };

  const inView = (t, m = 0.02) => vpos(t) >= -m && vpos(t) <= 1 + m;

  return (
    <div className="tl">
      {/* ruler: year/month ticks + section flags + honors + NOW */}
      <div className="tl-ruler">
        {rulerTicks(viewStart, viewEnd, viewSpan).map((tk) => (
          <span
            key={tk.key}
            className={`tl-tick${tk.major ? " maj" : ""}${tk.label ? "" : " nolabel"}`}
            style={{ left: `${vpos(tk.t) * 100}%` }}
          >
            {tk.label}
          </span>
        ))}
        {inView(NOW) && (
          <span className="tl-now-flag" style={{ left: `${vpos(NOW) * 100}%` }}>
            NOW
          </span>
        )}
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

        {layouts.map(({ track, byRow, rows }) => (
          <div
            className={`tl-track tl-track-${track.key}`}
            key={track.key}
            style={{ flexGrow: track.key === "experience" ? rows * 2.2 : rows }}
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
            capture(e);
          }}
          onPointerMove={(e) => dragging.current && actions.seek(timeFromX(e.clientX))}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
    </div>
  );
}
