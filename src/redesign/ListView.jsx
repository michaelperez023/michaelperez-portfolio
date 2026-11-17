import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { useStore } from "./storeCore";
import { kindName, extraLinks } from "./timelineData";
import {
  information,
  about,
  publications,
  workingPapers,
  preprints,
  workingExperience,
  education,
  skillGroups,
  honors,
  certifications,
  service,
  projects,
} from "../data/content";

// "Class report · Advanced Machine Learning": what the entry is, then its note,
// without repeating the kind when the note already says it ("arXiv preprint").
function kindAndNote(p) {
  const kind = kindName(p.kind);
  const note = p.note || "";
  const showKind = kind && !note.toLowerCase().includes(kind.toLowerCase());
  return [showKind ? kind : null, note].filter(Boolean).join(" · ");
}

const ME = "Michael Pérez";
function withMe(authors) {
  if (!authors || !authors.includes(ME)) return authors;
  return authors.split(ME).flatMap((part, i) =>
    i === 0 ? [part] : [<strong key={i}>{ME}</strong>, part]
  );
}

// Links here are lowercase ("code · demo"); an extra link's label follows suit
// unless its first word is a name ("GitHub", "YouTube").
const listLabel = (s) => (/^[A-Z][a-z]+\b/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

// " · report (PDF) · code": the files an entry links to, after its title,
// followed by any extra links the entry lists in content.js.
function EntryLinks({ links, entry }) {
  const more = extraLinks(entry).map((l) => [l.href, listLabel(l.label)]);
  return [...links, ...more]
    .filter(([href]) => href)
    .map(([href, text], i) => (
      <span key={`${i}-${href}`}>
        {" · "}
        <a href={href}>{text}</a>
      </span>
    ));
}

// Plain, fully semantic, recruiter/screen-reader-friendly fallback document.
// It is a modal dialog: the page behind it is inert while it is open, focus
// moves to its title, and closing it (button or Escape) returns focus to the
// control that opened it.
export default function ListView() {
  const { actions } = useStore();
  const titleRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const page = document.querySelector(".cut-root");
    if (page) page.inert = true;
    titleRef.current?.focus();
    return () => {
      if (page) page.inert = false;
      if (opener && opener !== document.body && opener.isConnected) opener.focus?.();
    };
  }, []);
  return (
    <div className="lv" role="dialog" aria-modal="true" aria-label="Plain résumé view">
      <div className="lv-bar">
        <span>Plain view — everything, in order</span>
        <button className="lv-close" onClick={() => actions.toggleListView()} aria-label="Close list view">
          <FiX size={16} /> close
        </button>
      </div>
      <div className="lv-doc">
        <div className="lv-head">
          <h1 ref={titleRef} tabIndex={-1}>{information.fullName}</h1>
          <p>{information.role} · {information.location}</p>
          <p className="lv-avail">{information.availability}</p>
          <p className="lv-links">
            <a href={`mailto:${information.email}`}>{information.email}</a> ·{" "}
            <a href={information.social.github}>GitHub</a> ·{" "}
            <a href={information.social.linkedin}>LinkedIn</a> ·{" "}
            <a href={information.social.scholar}>Scholar</a> ·{" "}
            <a href={information.resumeFile}>Résumé</a> ·{" "}
            <a href={information.cvFile}>CV</a>
          </p>
        </div>

        <section>
          <h2>About</h2>
          {about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </section>

        <section>
          <h2>Publications</h2>
          <ul>
            {publications.map((p) => (
              <li key={p.id}>
                <span className="lv-y">{p.year}</span>{" "}
                {p.link ? <a href={p.link}>{p.title}</a> : p.title} — <em>{p.venue}</em>{p.demo && " (demo)"}
                <div className="lv-auth">{withMe(p.authors)}</div>
              </li>
            ))}
          </ul>
          <h3>Working papers</h3>
          <ul>{workingPapers.map((p) => <li key={p.id}><span className="lv-y">{p.year}</span> {p.title} — <em>{p.note}</em>{p.summary && <div className="lv-auth">{p.summary}</div>}</li>)}</ul>
          <h3>Preprints & reports</h3>
          <ul>
            {preprints.map((p) => (
              <li key={p.id}>
                <span className="lv-y">{p.year}</span>{" "}
                {p.link ? <a href={p.link}>{p.title}</a> : p.title} — <em>{kindAndNote(p)}</em>
                <EntryLinks links={[[p.file, "report (PDF)"], [p.githubLink, "code"]]} entry={p} />
                {p.summary && <div className="lv-auth">{p.summary}</div>}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Experience</h2>
          <ul>
            {workingExperience.map((e) => (
              <li key={e.id}>
                <span className="lv-y">{e.year}</span> <strong>{e.position}</strong>, {e.company}
                <ul className="lv-highlights">
                  {e.highlights.map((h) => (
                    <li key={h.label}><strong>{h.label}.</strong> {h.text}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Projects</h2>
          <ul>
            {projects.map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong> — {p.subtitle}
                <EntryLinks links={[[p.githubLink, "code"], [p.url, "demo"], [p.report, "report (PDF)"]]} entry={p} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Skills</h2>
          <ul>{skillGroups.map((g) => <li key={g.title}><strong>{g.title}:</strong> {g.items.join(", ")}</li>)}</ul>
        </section>

        <section>
          <h2>Education</h2>
          <ul>{education.map((e) => <li key={e.id}><span className="lv-y">{e.year}</span> {e.degree} · {e.school}</li>)}</ul>
        </section>

        <section>
          <h2>Certifications</h2>
          <ul>{certifications.map((c) => <li key={c.id}><span className="lv-y">{c.year}</span> {c.title} — {c.note}</li>)}</ul>
        </section>

        <section>
          <h2>Service</h2>
          <ul>{service.map((s) => <li key={s.id}><span className="lv-y">{s.year}</span> {s.role} — {s.venue}</li>)}</ul>
        </section>

        <section>
          <h2>Honors</h2>
          <ul>{honors.map((h) => <li key={h.id}><span className="lv-y">{h.year}</span> {h.title} — {h.note}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}
