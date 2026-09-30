"use client";

import dynamic from "next/dynamic";

// The 21st.dev AnimatedThemeToggler (components/ui/animated-theme-toggler.tsx,
// kept verbatim) reads the <html> class in its first render, so server HTML
// can never match in dark mode and hydration fails. Rendering it client-only
// avoids that without editing the component. The placeholder is its size
// (p-2 around a 24px icon) so the header doesn't shift when it arrives.
export const ThemeToggle = dynamic(
  () =>
    import("@/components/ui/animated-theme-toggler").then(
      (m) => m.AnimatedThemeToggler,
    ),
  { ssr: false, loading: () => <span className="size-10" /> },
);
