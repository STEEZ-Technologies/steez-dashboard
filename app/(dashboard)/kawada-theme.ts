// Emit this with the Kawada layout so the palette is present in the server
// response. Applying the tokens at the root also covers portaled dialogs.
export const kawadaTheme = `
html:has([data-tenant="kawada"]) {
  --background: #fcfbf8;
  --foreground: #28222e;
  --card: #ffffff;
  --card-foreground: var(--foreground);
  --popover: var(--card);
  --popover-foreground: var(--foreground);
  --primary: #8952be;
  --primary-foreground: #ffffff;
  --secondary: #eeece7;
  --secondary-foreground: #4e2a78;
  --muted: #f2f1ed;
  --muted-foreground: #66615f;
  --accent: #f0e6eb;
  --accent-foreground: #8a1053;
  --destructive: #ab4347;
  --border: #dedbd5;
  --input: #ccc7d0;
  --ring: #db0082;
  --chart-1: #db0082;
  --chart-2: #8952be;
  --chart-3: #274754;
  --chart-4: #e8c468;
  --chart-5: #f4a462;
  --sidebar: #f1e9f9;
  --sidebar-foreground: var(--foreground);
  --sidebar-primary: var(--primary);
  --sidebar-primary-foreground: var(--primary-foreground);
  --sidebar-accent: var(--accent);
  --sidebar-accent-foreground: var(--accent-foreground);
  --sidebar-border: var(--border);
  --sidebar-ring: var(--ring);
  --glass-bg: rgb(250 245 255 / 72%);
  --glass-bg-strong: rgb(250 245 255 / 96%);
  --glass-shadow: rgb(74 38 112 / 16%);
  --card-shadow: 0 1px 2px rgb(74 38 112 / 5%), 0 6px 20px -8px var(--glass-shadow);
  --ambient-a: rgb(137 82 190 / 16%);
  --ambient-b: rgb(219 0 130 / 8%);
  --forest: var(--primary-foreground);
  --mint: var(--primary);
  --gold: #805b14;
  --ivory: var(--primary-foreground);
  --chart-crosshair: var(--primary);
}

html.dark:has([data-tenant="kawada"]) {
  --background: #1a1420;
  --foreground: #faf7fc;
  --card: #261d2f;
  --primary: #d0a5f5;
  --primary-foreground: #24142f;
  --secondary: #332641;
  --secondary-foreground: #e7cbff;
  --muted: #312739;
  --muted-foreground: #c1b2c8;
  --accent: #45283e;
  --accent-foreground: #ffd4ea;
  --destructive: #f598a4;
  --border: #45374e;
  --input: #584662;
  --ring: #f479ba;
  --chart-1: #f479ba;
  --chart-2: #c694ee;
  --chart-3: #8ab9cc;
  --chart-4: #e8c468;
  --chart-5: #f4a462;
  --sidebar: #271c31;
  --glass-bg: rgb(45 30 58 / 72%);
  --glass-bg-strong: rgb(45 30 58 / 96%);
  --glass-shadow: rgb(0 0 0 / 40%);
  --card-shadow: 0 0 0 1px rgb(208 165 245 / 10%);
  --ambient-a: rgb(137 82 190 / 23%);
  --ambient-b: rgb(219 0 130 / 10%);
  --gold: #e8c468;
}
`;
