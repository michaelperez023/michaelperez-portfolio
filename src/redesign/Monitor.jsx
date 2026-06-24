import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowUpRight,
  FiGithub,
  FiFileText,
  FiCornerDownLeft,
  FiCheck,
  FiCopy,
  FiPlay,
  FiDownload,
  FiLinkedin,
} from "react-icons/fi";
import { SiGooglescholar } from "react-icons/si";
import { useStore, isPanel } from "./storeCore";
import { allClips, clipById, barActiveAt, eras } from "./timelineData";
import { examples } from "./retrieval";
import { information, about, skillGroups, honors, education } from "../data/content";

const COINCIDE_W = 0.25; // ~3 months (a quarter): a tight cluster shows together, but
// distinct work from another season doesn't bleed in.
function clipsAtTime(t) {
  return allClips.filter((c) =>
    c.point ? Math.abs(c.t0 - t) <= COINCIDE_W : barActiveAt(c, t)
  );
}

const ME = "Michael Pérez";
function withMe(authors) {
  if (!authors || !authors.includes(ME)) return authors;
  return authors.split(ME).flatMap((part, i) =>
    i === 0 ? [part] : [<strong className="me" key={i}>{ME}</strong>, part]
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

export default function Monitor() {
  const { state, actions } = useStore();
  const reduced = usePrefersReducedMotion();
  const inputRef = useRef(null);
  const [revealed, setRevealed] = useState(0);

  // Stream the answer token-by-token; light timeline clips as citations land.
  useEffect(() => {
    if (!state.answer) {
      setRevealed(0);
      return;
    }
    const tokens = state.answer.tokens;
    if (reduced) {
      setRevealed(tokens.length);
      tokens.forEach((t) => t.type === "cite" && actions.attend(t.id));
      return;
    }
    setRevealed(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealed(i);
      const tok = tokens[i - 1];
      if (tok && tok.type === "cite") actions.attend(tok.id);
      if (i >= tokens.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answer, reduced]);

  const onKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      actions.submitQuery();
    }
  };

  const answering = state.mode === "query" && state.answer;
  const total = answering ? state.answer.tokens.length : 0;
  const confTarget = answering ? state.answer.confidence ?? 90 : 0;
  const confidence = answering ? Math.round((revealed / Math.max(1, total)) * confTarget) : 0;
  const latency = answering ? state.answer.latency ?? 38 : 0;

  // All clips at the current playhead time (so concurrent work shows together).
  const showingClips = !answering && !isPanel(state.activeId);
  const coincident = useMemo(() => {
    if (!showingClips) return [];
    // Filter strictly by the current playhead time (the blue line).
    const at = clipsAtTime(state.playhead);
    // Stable order (never reshuffles when focus changes): experience, research, projects, by time.
    const ord = { experience: 0, research: 1, projects: 2 };
    at.sort((a, b) => ord[a.track] - ord[b.track] || a.t0 - b.t0);
    return at;
  }, [showingClips, state.playhead]);

  // Degree(s) in progress at this moment (shown at the bottom of the rail).
  const eduActive = showingClips
    ? eras.filter((e) => state.playhead >= e.t0 && state.playhead <= e.t1)
    : [];

  return (
    <div className="mon">
      {/* console */}
      <div className="mon-console">
        <span className="mon-prompt">ask&nbsp;my&nbsp;work</span>
        <span className="mon-caret">›</span>
        <input
          ref={inputRef}
          className="mon-input"
          value={state.query}
          onChange={(e) => actions.setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="e.g. can you scale?  ( press /  to focus )"
          aria-label="Query Michael's work"
          data-query-input
        />
        <button className="mon-run" onClick={() => actions.submitQuery()} aria-label="Run query">
          run <FiCornerDownLeft size={13} />
        </button>
      </div>
      <div className="mon-examples">
        {examples.map((ex) => (
          <button key={ex} className="mon-ex" onClick={() => { actions.setQuery(ex); actions.submitQuery(); }}>
            {ex}
          </button>
        ))}
      </div>

      {/* readout HUD (only while answering) */}
      {answering && (
        <div className="mon-hud" aria-hidden="true">
          <span className="dot" /> MPX-1
          <span className="sep">·</span> latency {latency}ms
          <span className="sep">·</span> {revealed >= total ? "done" : "decoding"}
          <span className="sep">·</span> conf <b>{confidence}%</b>
          <span className="mon-hud-bar"><i style={{ width: `${confidence}%` }} /></span>
        </div>
      )}

      {/* main panel */}
      <div className="mon-stage">
        {answering ? (
          <Answer tokens={state.answer.tokens} revealed={revealed} matched={state.answer.matched} />
        ) : isPanel(state.activeId) ? (
          <Panel id={state.activeId} />
        ) : (
          <ClipStack
            clips={coincident}
            edu={eduActive}
            primaryId={state.focusId}
            onFocus={actions.focusClip}
          />
        )}
      </div>
    </div>
  );
}

function Answer({ tokens, revealed, matched }) {
  const { actions } = useStore();
  let citeN = 0;
  return (
    <div className="mon-answer">
      <p className="ans-body">
        {tokens.slice(0, revealed).map((t, i) => {
          if (t.type === "text") return <span key={i}>{t.text}</span>;
          citeN += 1;
          const clip = clipById[t.id];
          if (!clip) return null;
          return (
            <button key={i} className="ans-cite" onClick={() => actions.selectClip(clip.id)} title={clip.title}>
              <sup>[{citeN}]</sup> {clip.label}
            </button>
          );
        })}
        {revealed < tokens.length && <span className="ans-cursor" />}
      </p>
      {revealed >= tokens.length && (
        <p className="ans-foot">
          {matched ? "retrieved from indexed work · click a citation to scrub there" : "no exact match — showing an overview"}
        </p>
      )}
    </div>
  );
}

// Extract an 11-char YouTube id from youtu.be / watch?v= / embed URLs.
function ytId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Project preview: poster image; for YouTube projects, click to play inline.
function ProjectMedia({ clip }) {
  const [playing, setPlaying] = useState(false);
  const vid = ytId(clip.url);
  if (!clip.image && !vid) return null;
  if (vid && playing) {
    return (
      <figure className="cv-figure playing">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`}
          title={clip.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </figure>
    );
  }
  return (
    <figure className={`cv-figure${vid ? " has-video" : ""}`}>
      {clip.image && <img src={clip.image} alt={clip.title} loading="lazy" />}
      {vid && (
        <button className="cv-playbtn" onClick={() => setPlaying(true)} aria-label={`Play ${clip.title} video`}>
          <span className="cv-playcircle"><FiPlay size={22} /></span>
        </button>
      )}
    </figure>
  );
}

function LinkRow({ clip }) {
  const projLabel =
    clip.track === "projects" ? (ytId(clip.link) ? "Open on YouTube" : "Visit site") : "Read paper";
  return (
    <div className="cv-links">
      {clip.link && (
        <a className="cv-link" href={clip.link} target="_blank" rel="noreferrer">
          {projLabel} <FiArrowUpRight size={14} />
        </a>
      )}
      {clip.file && (
        <a className="cv-link" href={clip.file} target="_blank" rel="noreferrer">
          <FiFileText size={13} /> Report
        </a>
      )}
      {clip.githubLink && (
        <a className="cv-link" href={clip.githubLink} target="_blank" rel="noreferrer">
          <FiGithub size={13} /> Code
        </a>
      )}
    </div>
  );
}

// Paper PDF preview: first-page thumbnail; click to open the PDF inline.
function PaperPreview({ clip }) {
  const [open, setOpen] = useState(false);
  const pdf = clip.pdf || clip.file;
  if (!clip.thumb) return null;
  if (open && pdf) {
    return (
      <figure className="cv-figure paper playing">
        <iframe src={`${pdf}#view=FitH`} title={`${clip.title} (PDF)`} />
      </figure>
    );
  }
  return (
    <figure className={`cv-figure paper${pdf ? " has-pdf" : ""}`}>
      <img src={clip.thumb} alt={`First page of ${clip.title}`} loading="lazy" />
      {pdf && (
        <button className="cv-pdfbtn" onClick={() => setOpen(true)} aria-label={`Open the PDF of ${clip.title}`}>
          <span className="cv-pdftag"><FiFileText size={12} /> View PDF</span>
        </button>
      )}
    </figure>
  );
}

function ResearchCard({ clip }) {
  const kindLabel = clip.kind === "working" ? "WORKING PAPER" : clip.kind === "preprint" ? "PREPRINT" : "PUBLICATION";
  const meta = (
    <div className="cv-meta">
      <span className={`cv-kind ${clip.kind}`}>{kindLabel}</span>
      {clip.lead && <span className="cv-tag lead">FIRST AUTHOR</span>}
      {clip.upcoming && <span className="cv-tag up">ACCEPTED · TO APPEAR</span>}
      <span className="cv-year">{clip.year}</span>
    </div>
  );
  const body = (
    <>
      {clip.venue && <p className="cv-venue">{clip.venue}</p>}
      {clip.authors && <p className="cv-authors">{withMe(clip.authors)}</p>}
      {clip.note && <p className="cv-note">{clip.note}</p>}
      <LinkRow clip={clip} />
    </>
  );
  if (clip.thumb) {
    return (
      <>
        {meta}
        <h2 className="cv-title">{clip.title}</h2>
        <div className="cv-projbody">
          <PaperPreview clip={clip} />
          <div className="cv-projtext">{body}</div>
        </div>
      </>
    );
  }
  return (
    <>
      {meta}
      <h2 className="cv-title">{clip.title}</h2>
      {body}
    </>
  );
}

function ClipCard({ clip, dense, primary, rail, onFocus }) {
  if (!clip) return null;
  const base = `cv${dense ? " dense" : ""}${primary ? " primary" : ""}${rail ? " inrail" : ""}`;
  // Clicking the card body highlights it in the timeline (ignore inner links/buttons).
  const onCardClick = (e) => {
    if (onFocus && !e.target.closest("a, button")) onFocus(clip.id);
  };
  if (clip.track === "experience") {
    return (
      <article className={base} onClick={onCardClick}>
        <div className="cv-meta">
          <span className="cv-kind exp">EXPERIENCE</span>
          {clip.tag && <span className="cv-tag">{clip.tag}</span>}
          <span className="cv-year">{clip.year}</span>
        </div>
        <h2 className="cv-title">{clip.title}</h2>
        <p className="cv-sub">{clip.company}{clip.location ? ` · ${clip.location}` : ""}</p>
        {!rail && <p className="cv-body">{clip.details}</p>}
      </article>
    );
  }
  if (clip.track === "projects") {
    return (
      <article className={`${base} cv-proj`} onClick={onCardClick}>
        <div className="cv-meta">
          <span className="cv-kind proj">PROJECT</span>
          {clip.tags?.map((t) => <span key={t} className="cv-tag">{t}</span>)}
        </div>
        <h2 className="cv-title">{clip.title}</h2>
        <div className="cv-projbody">
          <ProjectMedia clip={clip} />
          <div className="cv-projtext">
            <p className="cv-body">{clip.sub}</p>
            <LinkRow clip={clip} />
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className={base} onClick={onCardClick}>
      <ResearchCard clip={clip} />
    </article>
  );
}

// Papers/projects in the main area; ALL concurrent roles (and the degree in
// progress) sit in a fixed right rail so they stay put during playback.
function ClipStack({ clips, primaryId, edu, onFocus }) {
  if (!clips || !clips.length) return null;
  const main = clips.filter((c) => c.track !== "experience");
  const rail = clips.filter((c) => c.track === "experience");
  const hasMain = main.length > 0;
  const hasRail = rail.length > 0 || (edu && edu.length > 0);
  return (
    <div className="cv-zones">
      <div className={`cv-stack cv-zone-main${hasMain ? " multi" : ""}`}>
        {main.length > 1 && <p className="cv-stack-head">{main.length} at this moment</p>}
        {hasMain ? (
          main.map((c) => (
            <ClipCard key={c.id} clip={c} dense primary={c.id === primaryId} onFocus={onFocus} />
          ))
        ) : (
          <p className="cv-empty">Nothing published or built at this exact point — scrub or zoom to explore.</p>
        )}
      </div>
      {hasRail && (
        <aside className="cv-rail">
          {edu && edu.length > 0 && (
            <div className="cv-edu">
              <p className="cv-rail-head edu">Education</p>
              {edu.map((e) => (
                <div key={e.label} className="cv-edu-item">{e.label}</div>
              ))}
            </div>
          )}
          {rail.length > 0 && <p className="cv-rail-head">Roles</p>}
          {rail.map((c) => (
            <ClipCard key={c.id} clip={c} dense rail primary={c.id === primaryId} onFocus={onFocus} />
          ))}
        </aside>
      )}
    </div>
  );
}

function Panel({ id }) {
  if (id === "intro") return <IntroPanel />;
  if (id === "about") return <AboutPanel />;
  if (id === "skills") return <SkillsPanel />;
  if (id === "contact") return <ContactPanel />;
  return null;
}

function IntroPanel() {
  return (
    <div className="intro">
      <div className="intro-text">
        <p className="intro-eyebrow">{information.role.toUpperCase()}</p>
        <h1 className="intro-name">
          Michael <span className="acc">Pérez</span>
        </h1>
        <p className="intro-tag">{information.tagline}</p>
        <div className="intro-facts">
          {about.facts.map((f) => (
            <div key={f.label} className="intro-fact">
              <span className="k">{f.label}</span>
              <span className="v">{f.value}</span>
            </div>
          ))}
        </div>
        <p className="intro-hint">▸ scrub the timeline below, press <kbd>Space</kbd> to play it, or <kbd>/</kbd> to ask my work a question</p>
      </div>
      <div className="intro-portrait">
        <img src={information.headshot} alt={information.fullName} loading="lazy" />
      </div>
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="panel">
      <h2 className="panel-h">About</h2>
      {about.paragraphs.map((p, i) => (
        <p key={i} className="panel-p">{p}</p>
      ))}
      <h3 className="panel-sub">Education</h3>
      <ul className="panel-list">
        {education.map((e) => (
          <li key={e.id}><span className="mono-dim">{e.year}</span> {e.degree} · {e.school}</li>
        ))}
      </ul>
      <h3 className="panel-sub">Honors</h3>
      <ul className="panel-list">
        {honors.map((h) => (
          <li key={h.id}><span className="mono-dim">{h.year}</span> {h.title}</li>
        ))}
      </ul>
    </div>
  );
}

function SkillsPanel() {
  return (
    <div className="panel">
      <h2 className="panel-h">Skills</h2>
      <div className="mixer">
        {skillGroups.map((g) => (
          <div key={g.title} className="mixer-group">
            <p className="mixer-title">{g.title}</p>
            <div className="mixer-items">
              {g.items.map((it) => (
                <span key={it} className="mixer-chip">{it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPanel() {
  const [copied, setCopied] = useState(false);
  const { social, email, cvFile } = information;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };
  return (
    <div className="panel">
      <h2 className="panel-h">Let's build something.</h2>
      <p className="panel-p">Open to full-time ML / AI Engineer roles. The fastest way to reach me:</p>
      <div className="contact-row">
        <button className="contact-btn primary" onClick={copy}>
          {copied ? <><FiCheck size={15} /> Copied</> : <><FiCopy size={15} /> {email}</>}
        </button>
        <div className="contact-links">
          <a className="contact-btn" href={cvFile} target="_blank" rel="noreferrer"><FiDownload size={15} /> Download CV</a>
          <a className="contact-btn" href={social.github} target="_blank" rel="noreferrer"><FiGithub size={15} /> GitHub</a>
          <a className="contact-btn" href={social.linkedin} target="_blank" rel="noreferrer"><FiLinkedin size={15} /> LinkedIn</a>
          <a className="contact-btn" href={social.scholar} target="_blank" rel="noreferrer"><SiGooglescholar size={15} /> Scholar</a>
        </div>
      </div>
    </div>
  );
}
