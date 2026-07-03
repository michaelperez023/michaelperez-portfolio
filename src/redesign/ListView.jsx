import { FiX } from "react-icons/fi";
import { useStore } from "./storeCore";
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
  projects,
} from "../data/content";

const ME = "Michael Pérez";
function withMe(authors) {
  if (!authors || !authors.includes(ME)) return authors;
  return authors.split(ME).flatMap((part, i) =>
    i === 0 ? [part] : [<strong key={i}>{ME}</strong>, part]
  );
}

// Plain, fully semantic, recruiter/screen-reader-friendly fallback document.
export default function ListView() {
  const { actions } = useStore();
  return (
    <div className="lv" role="dialog" aria-label="Plain résumé view">
      <div className="lv-bar">
        <span>Plain view — everything, in order</span>
        <button className="lv-close" onClick={() => actions.toggleListView()} aria-label="Close list view">
          <FiX size={16} /> close
        </button>
      </div>
      <div className="lv-doc">
        <header className="lv-head">
          <h1>{information.fullName}</h1>
          <p>{information.role} · {information.location}</p>
          <p className="lv-avail">{information.availability}</p>
          <p className="lv-links">
            <a href={`mailto:${information.email}`}>{information.email}</a> ·{" "}
            <a href={information.social.github}>GitHub</a> ·{" "}
            <a href={information.social.linkedin}>LinkedIn</a> ·{" "}
            <a href={information.social.scholar}>Scholar</a> ·{" "}
            <a href={information.cvFile}>CV</a>
          </p>
        </header>

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
                {p.link ? <a href={p.link}>{p.title}</a> : p.title} — <em>{p.venue}</em>
                <div className="lv-auth">{withMe(p.authors)}</div>
              </li>
            ))}
          </ul>
          <h3>Working papers</h3>
          <ul>{workingPapers.map((p) => <li key={p.id}><span className="lv-y">{p.year}</span> {p.title} — <em>{p.note}</em></li>)}</ul>
          <h3>Preprints & reports</h3>
          <ul>{preprints.map((p) => <li key={p.id}><span className="lv-y">{p.year}</span> {p.link ? <a href={p.link}>{p.title}</a> : p.title} — <em>{p.note}</em></li>)}</ul>
        </section>

        <section>
          <h2>Experience</h2>
          <ul>
            {workingExperience.map((e) => (
              <li key={e.id}>
                <span className="lv-y">{e.year}</span> <strong>{e.position}</strong>, {e.company}
                <div>{e.details}</div>
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
                {p.githubLink && <> · <a href={p.githubLink}>code</a></>}
                {p.url && <> · <a href={p.url}>demo</a></>}
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
          <h2>Honors</h2>
          <ul>{honors.map((h) => <li key={h.id}><span className="lv-y">{h.year}</span> {h.title} — {h.note}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}
