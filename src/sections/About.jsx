import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import { about } from "../data/content";

export default function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <SectionHead index="01 — About" title="Researcher at the intersection of ML & people" />
        <div className="about-grid">
          <Reveal className="about-body">
            {about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Reveal>
          <Reveal>
            <ul className="about-facts">
              {about.facts.map((f) => (
                <li key={f.label}>
                  <span className="k">{f.label}</span>
                  <span className="v">{f.value}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
