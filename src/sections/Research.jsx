import { FiArrowUpRight, FiFileText } from "react-icons/fi";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import { publications, preprints } from "../data/content";

function LeadPublication({ pub }) {
  return (
    <Reveal>
      <a className="pub-lead" href={pub.link} target="_blank" rel="noreferrer">
        <div className="pub-lead-year">{pub.year}</div>
        <div>
          <span className="pub-venue">{pub.venue}</span>
          <h3>{pub.title}</h3>
          <p className="pub-authors">{pub.authors}</p>
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
          index="02 — Research"
          title="Selected Publications"
          lead="Peer-reviewed work across multimodal video analysis, HCI, and medical imaging — including ACM Multimedia and IEEE CG&A."
        />

        <LeadPublication pub={lead} />

        <ul className="pub-list">
          {rest.map((pub) => (
            <Reveal as="li" className="pub-item" key={pub.id}>
              <span className="pub-year">{pub.year}</span>
              <div>
                <h4>{pub.title}</h4>
                <p className="pub-meta">
                  <span className="pub-venue-sm">{pub.venue}</span>
                  {" · "}
                  {pub.authors}
                </p>
              </div>
              <a className="pub-item-link" href={pub.link} target="_blank" rel="noreferrer" aria-label="Read publication">
                <FiArrowUpRight size={20} />
              </a>
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
              </div>
              <a
                className="pub-item-link"
                href={pub.link || pub.file}
                target="_blank"
                rel="noreferrer"
                aria-label="Open report"
              >
                {pub.file ? <FiFileText size={19} /> : <FiArrowUpRight size={20} />}
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
