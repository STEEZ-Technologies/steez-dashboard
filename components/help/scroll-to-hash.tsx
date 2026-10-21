"use client";

import { useEffect } from "react";

/** Jumps to the #topic in the address once the manual has rendered — the
    page streams in after the browser's own jump, so that one finds nothing. */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  return null;
}
