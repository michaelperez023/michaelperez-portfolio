import { FiArrowDown, FiDownload, FiGithub, FiLinkedin } from "react-icons/fi";
import { SiGooglescholar } from "react-icons/si";
import { Link } from "react-scroll";
import { information } from "../data/content";
import CopyEmail from "../components/CopyEmail";

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="container hero-grid">
        <div>
          <p className="hero-eyebrow">{information.role}</p>
          <h1>
            Michael <span className="accent">Pérez</span>
          </h1>
          <p className="hero-tagline">{information.tagline}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={information.cvFile} target="_blank" rel="noreferrer">
              <FiDownload size={17} /> Download CV
            </a>
            <a className="btn btn-ghost" href={information.social.scholar} target="_blank" rel="noreferrer">
              <SiGooglescholar size={16} /> Google Scholar
            </a>
            <a className="btn btn-ghost" href={information.social.github} target="_blank" rel="noreferrer">
              <FiGithub size={16} /> GitHub
            </a>
            <a className="btn btn-ghost" href={information.social.linkedin} target="_blank" rel="noreferrer">
              <FiLinkedin size={16} /> LinkedIn
            </a>
            <CopyEmail variant="button" />
          </div>
        </div>

        <div className="hero-portrait">
          <img src={information.headshot} alt={information.fullName} />
        </div>
      </div>

      <div className="container" style={{ marginTop: "3.5rem" }}>
        <Link to="about" smooth duration={500} offset={-72} className="text-link" style={{ cursor: "pointer" }}>
          <FiArrowDown size={15} /> Scroll to explore
        </Link>
      </div>
    </section>
  );
}
