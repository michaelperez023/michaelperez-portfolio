import { FiArrowUpRight, FiGithub, FiPlayCircle } from "react-icons/fi";
import SectionHead from "../components/SectionHead";
import Reveal from "../components/Reveal";
import { projects } from "../data/content";

export default function Projects() {
  return (
    <section id="projects" className="section">
      <div className="container">
        <SectionHead
          index="05 — Projects"
          title="Things I've Built"
          lead="A mix of research tooling, graphics, games, and web work."
        />

        <div className="project-grid">
          {projects.map((p) => (
            <Reveal className="project-card" key={p.id}>
              <div className="project-media">
                <img src={p.image} alt={p.title} loading="lazy" />
              </div>
              <div className="project-body">
                <h4>{p.title}</h4>
                <p>{p.subtitle}</p>
                <div className="project-tags">
                  {p.tags?.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="project-links">
                  {p.url && (
                    <a className="text-link" href={p.url} target="_blank" rel="noreferrer">
                      <FiPlayCircle size={15} /> Watch
                    </a>
                  )}
                  {p.githubLink && (
                    <a className="text-link" href={p.githubLink} target="_blank" rel="noreferrer">
                      <FiGithub size={15} /> Code
                    </a>
                  )}
                  {!p.url && !p.githubLink && (
                    <span className="text-link" style={{ opacity: 0.5 }}>
                      <FiArrowUpRight size={15} /> Case study
                    </span>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
