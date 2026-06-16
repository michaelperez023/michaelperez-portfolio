import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Research from "./sections/Research";
import Experience from "./sections/Experience";
import HonorsService from "./sections/HonorsService";
import Projects from "./sections/Projects";
import Skills from "./sections/Skills";
import Footer from "./sections/Footer";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <Nav theme={theme} toggle={toggle} />
      <main>
        <Hero />
        <About />
        <Research />
        <Experience />
        <HonorsService />
        <Projects />
        <Skills />
      </main>
      <Footer />
    </>
  );
}
