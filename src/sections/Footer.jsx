import { FiGithub, FiLinkedin, FiMail, FiArrowUp } from "react-icons/fi";
import { SiGooglescholar } from "react-icons/si";
import { Link } from "react-scroll";
import { information } from "../data/content";

export default function Footer() {
  const { social, email } = information;
  const year = "2026";

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-grid">
          <h2>
            Let's build something —{" "}
            <a href={social.linkedin} target="_blank" rel="noreferrer">
              get in touch
            </a>
            .
          </h2>
          <div className="footer-social">
            <a href={social.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <FiGithub size={19} />
            </a>
            <a href={social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <FiLinkedin size={19} />
            </a>
            <a href={social.scholar} target="_blank" rel="noreferrer" aria-label="Google Scholar">
              <SiGooglescholar size={18} />
            </a>
            {email && (
              <a href={`mailto:${email}`} aria-label="Email">
                <FiMail size={19} />
              </a>
            )}
          </div>
        </div>

        <div className="footer-meta">
          <span>© {year} Michael Pérez · {information.location}</span>
          <Link to="home" smooth duration={500} className="text-link" style={{ cursor: "pointer" }}>
            Back to top <FiArrowUp size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
