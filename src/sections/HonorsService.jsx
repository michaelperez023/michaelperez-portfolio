import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import { honors, service } from "../data/content";

export default function HonorsService() {
  return (
    <section id="honors" className="section">
      <div className="container">
        <SectionHead
          index="04 — Honors"
          title="Honors & Service"
          lead="Fellowships and awards, plus service to the research community."
        />

        <div className="edu-grid">
          {honors.map((h) => (
            <Reveal className="edu-card" key={h.id}>
              <div className="exp-year">{h.year}</div>
              <h4>{h.title}</h4>
              <p>{h.note}</p>
            </Reveal>
          ))}
        </div>

        <p className="pub-subhead">Professional service</p>
        <ul className="pub-list">
          {service.map((s) => (
            <Reveal as="li" className="pub-item" key={s.id}>
              <span className="pub-year">{s.year}</span>
              <div>
                <h4>{s.role}</h4>
                <p className="pub-meta">{s.venue}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
