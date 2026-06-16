import { useEffect, useState } from "react";
import { Link } from "react-scroll";
import { FiMenu, FiX } from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";

const SECTIONS = [
  { to: "about", label: "About" },
  { to: "research", label: "Research" },
  { to: "experience", label: "Experience" },
  { to: "honors", label: "Honors" },
  { to: "projects", label: "Projects" },
  { to: "skills", label: "Skills" },
];

export default function Nav({ theme, toggle }) {
  const [open, setOpen] = useState(false);

  // Lock the burger menu closed when resizing up to desktop.
  useEffect(() => {
    const onResize = () => window.innerWidth > 680 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className={`nav ${open ? "open" : ""}`}>
      <div className="nav-inner">
        <Link
          to="home"
          smooth
          duration={500}
          className="nav-brand"
          style={{ cursor: "pointer" }}
        >
          Michael Pérez<span className="dot">.</span>
        </Link>

        <ul className="nav-links" onClick={() => setOpen(false)}>
          {SECTIONS.map((s) => (
            <li key={s.to}>
              <Link to={s.to} smooth duration={500} spy offset={-72} activeClass="active">
                {s.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <ThemeToggle theme={theme} toggle={toggle} />
          <button
            className="nav-burger"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
