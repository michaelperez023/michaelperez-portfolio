import { useState } from "react";
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiList, FiDownload, FiChevronDown, FiChevronUp, FiLink, FiCheck } from "react-icons/fi";
import { useStore, isPanel } from "./storeCore";
import { clipById, fmtTime } from "./timelineData";
import { information } from "../data/content";

const PANEL_LABEL = { intro: "Intro", about: "About", skills: "Skills", contact: "Contact" };

export default function TransportBar() {
  const { state, actions } = useStore();
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  const activeLabel = isPanel(state.activeId)
    ? PANEL_LABEL[state.activeId]
    : clipById[state.activeId]?.title || "—";

  return (
    <div className="transport">
      <div className="tp-left">
        <span className="tp-tc">{fmtTime(state.playhead)}</span>
        <span className="tp-active" title={activeLabel}>{activeLabel}</span>
      </div>

      <div className="tp-center">
        <button className="tp-btn" onClick={() => actions.edge(-1)} aria-label="First clip"><FiSkipBack size={15} /></button>
        <button className="tp-btn" onClick={() => actions.step(-1)} aria-label="Previous clip">◀</button>
        <button className="tp-btn play" onClick={() => actions.togglePlay()} aria-label={state.playing ? "Pause" : "Play"}>
          {state.playing ? <FiPause size={16} /> : <FiPlay size={16} />}
        </button>
        <button className="tp-btn" onClick={() => actions.step(1)} aria-label="Next clip">▶</button>
        <button className="tp-btn" onClick={() => actions.edge(1)} aria-label="Last clip"><FiSkipForward size={15} /></button>
        <button
          className="tp-btn tp-speed"
          onClick={() => actions.cyclePlaySpeed()}
          title="Playback speed"
          aria-label={`Playback speed ${state.playSpeed}×`}
        >
          {state.playSpeed}×
        </button>
      </div>

      <div className="tp-right">
        <button
          className="tp-link"
          onClick={() => actions.toggleTlCollapse()}
          aria-label={state.tlCollapsed ? "Show timeline" : "Hide timeline"}
        >
          {state.tlCollapsed ? (
            <><FiChevronUp size={14} /> Timeline</>
          ) : (
            <><FiChevronDown size={14} /> Hide</>
          )}
        </button>
        <button className="tp-link" onClick={() => actions.toggleListView()}>
          <FiList size={14} /> List view
        </button>
        <a className="tp-link" href={information.cvFile} target="_blank" rel="noreferrer">
          <FiDownload size={14} /> CV
        </a>
        <button className="tp-link" onClick={copyLink} aria-label="Copy a shareable link to this view">
          {copied ? <><FiCheck size={14} /> Copied</> : <><FiLink size={14} /> Share</>}
        </button>
      </div>
    </div>
  );
}
