import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import { skillGroups, coursework } from "../data/content";

export default function Skills() {
  return (
    <section id="skills" className="section">
      <div className="container">
        <SectionHead
          index="06 / Skills"
          title="Tools & Techniques"
          lead="What I reach for across research and engineering."
        />

        <div className="skills-grid">
          {skillGroups.map((group) => (
            <Reveal className="skill-group" key={group.title}>
              <h4>{group.title}</h4>
              <div className="tags">
                {group.items.map((item) => (
                  <span className="tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        <p className="pub-subhead">Graduate coursework</p>
        <Reveal className="skill-group">
          <div className="tags">
            {coursework.map((c) => (
              <span className="tag" key={c}>
                {c}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
