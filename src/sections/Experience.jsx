import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import { workingExperience, education } from "../data/content";

export default function Experience() {
  return (
    <section id="experience" className="section">
      <div className="container">
        <SectionHead
          index="03 — Experience"
          title="Where I've Worked"
          lead="Research and engineering roles spanning DARPA-funded labs, teaching, and industry."
        />

        <div className="timeline">
          {workingExperience.map((exp) => (
            <Reveal className="exp-item" key={exp.id}>
              <div className="exp-year">{exp.year}</div>
              <div>
                <h3 className="exp-position">{exp.position}</h3>
                <p className="exp-company">{exp.company}</p>
                <p className="exp-details">{exp.details}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="pub-subhead">Education</p>
        <div className="edu-grid">
          {education.map((e) => (
            <Reveal className="edu-card" key={e.id}>
              <div className="exp-year">{e.year}</div>
              <h4>{e.degree}</h4>
              <p>{e.school}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
