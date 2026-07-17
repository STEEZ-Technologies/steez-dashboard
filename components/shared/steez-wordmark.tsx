// Ported verbatim from ~/Projects/steez/components/shared/STEEZWordmark.tsx
// for a consistent visual identity across the marketing site and dashboard.

type STEEZWordmarkProps = { size?: number; color?: string };

export function STEEZWordmark({ size = 28, color = "var(--fg, currentColor)" }: STEEZWordmarkProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-stack-sans), sans-serif",
        fontWeight: 900,
        fontSize: size,
        color,
        letterSpacing: "-0.04em",
        textTransform: "uppercase",
        lineHeight: 1,
        transition: "color 0.4s ease",
      }}
    >
      STEEZ
    </span>
  );
}
