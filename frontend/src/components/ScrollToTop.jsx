import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const TWO_MINUTES = 2 * 60 * 1000;

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const lastVisit = useRef({});

  useEffect(() => {
    const now = Date.now();
    const last = lastVisit.current[pathname] ?? 0;
    if (now - last > TWO_MINUTES) {
      window.scrollTo(0, 0);
    }
    lastVisit.current[pathname] = now;
  }, [pathname]);

  return null;
}