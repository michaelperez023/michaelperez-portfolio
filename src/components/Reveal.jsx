import { createElement, useEffect, useRef, useState } from "react";

// Wraps children and fades them up when they scroll into view.
export default function Reveal({ children, as = "div", className = "", ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return createElement(
    as,
    { ref, className: `reveal ${shown ? "in" : ""} ${className}`.trim(), ...rest },
    children
  );
}
