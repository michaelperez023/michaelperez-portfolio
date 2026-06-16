import { FiArrowUpRight, FiFileText, FiGithub } from "react-icons/fi";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import { publications, workingPapers, preprints } from "../data/content";

// Bold the author's own name within an author list (standard academic convention).
const ME = "Michael Perez";
function withMe(authors) {
  if (!authors || !authors.includes(ME)) return authors;
  return authors.split(ME).flatMap((part, i) =>
    i === 0 ? [part] : [<strong className="author-me" key={i}>{ME}</strong>, part]
  );
}

function LeadPublication({ pub }) {
  return (
    <Reveal>
      <a className="pub-lead" href={pub.link} target="_blank" rel="noreferrer">
        <div className="pub-lead-year">{pub.year}</div>
        <div>
          <span className="pub-venue">{pub.venue}</span>
          <h3>{pub.title}</h3>
          <p className="pub-authors">{withMe(pub.authors)}</p>
          <p className="pub-note">{pub.note}</p>
          <span className="text-link">
            Read paper <FiArrowUpRight size={15} />
          </span>
        </div>
      </a>
    </Reveal>
  );
}

export default function Research() {
  const [lead, ...rest] = publications;

  return (
    <section id="research" className="section">
      <div className="container">
        <SectionHead
          index="02 / Research"
          title="Selected Publications"
          lead="Peer-reviewed work across multimodal video analysis, HCI, and medical imaging, including ACM Multimedia and IEEE CG&A."
        />

        <LeadPublication pub={lead} />

        <ul className="pub-list">
          {rest.map((pub) => (
            <Reveal as="li" className="pub-item" key={pub.id}>
              <span className="pub-year">{pub.year}</span>
              <div>
                <h4>
                  {pub.link ? (
                    <a className="pub-title-link" href={pub.link} target="_blank" rel="noreferrer">
                      {pub.title}
                    </a>
                  ) : (
                    pub.title
                  )}
                </h4>
                <p className="pub-meta">
                  <span className="pub-venue-sm">{pub.venue}</span>
                  {" · "}
                  {withMe(pub.authors)}
                </p>
              </div>
              {pub.link && (
                <a className="pub-item-link" href={pub.link} target="_blank" rel="noreferrer" aria-label="Read publication">
                  <FiArrowUpRight size={20} />
                </a>
              )}
            </Reveal>
          ))}
        </ul>

        <p className="pub-subhead">Working papers</p>
        <ul className="pub-list">
          {workingPapers.map((pub) => (
            <Reveal as="li" className="pub-item" key={pub.id}>
              <span className="pub-year">{pub.year}</span>
              <div>
                <h4>
                  {pub.link ? (
                    <a className="pub-title-link" href={pub.link} target="_blank" rel="noreferrer">
                      {pub.title}
                    </a>
                  ) : (
                    pub.title
                  )}
                </h4>
                <p className="pub-meta">{pub.note}</p>
              </div>
              {pub.link && (
                <a className="pub-item-link" href={pub.link} target="_blank" rel="noreferrer" aria-label="Read manuscript">
                  <FiArrowUpRight size={20} />
                </a>
              )}
            </Reveal>
          ))}
        </ul>

        <p className="pub-subhead">Preprints & technical reports</p>
        <ul className="pub-list">
          {preprints.map((pub) => (
            <Reveal as="li" className="pub-item" key={pub.id}>
              <span className="pub-year">{pub.year}</span>
              <div>
                <h4>{pub.title}</h4>
                <p className="pub-meta">{pub.note}</p>
                <div className="pub-actions">
                  {pub.file ? (
                    <a className="text-link" href={pub.file} target="_blank" rel="noreferrer">
                      <FiFileText size={14} /> Report
                    </a>
                  ) : pub.link ? (
                    <a className="text-link" href={pub.link} target="_blank" rel="noreferrer">
                      <FiArrowUpRight size={14} /> Paper
                    </a>
                  ) : null}
                  {pub.githubLink && (
                    <a className="text-link" href={pub.githubLink} target="_blank" rel="noreferrer">
                      <FiGithub size={14} /> Code
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
