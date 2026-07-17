"use client";

import { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { authenticate } from "../actions";
import { SignInPage } from "@/components/ui/sign-in";
import { ShaderBackground } from "@/components/shared/shader-background";
import { STEEZWordmark } from "@/components/shared/steez-wordmark";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { useT } from "@/lib/i18n/provider";

export default function LoginPage() {
  const { dict } = useT();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  // Same pattern as the STEEZ marketing hero: pick shader colors from the
  // resolved theme, only after mount (avoids a light/dark hydration flash).
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const color1 = "#019d86";
  const color2 = isDark ? "#04342C" : "#F0F9FF";

  function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    startTransition(async () => {
      const result = await authenticate(undefined, formData);
      if (result) setError(result);
    });
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <ShaderBackground color1={color1} color2={color2} speed={1} />
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 20 }}>
        <ThemeToggle />
      </div>
      <div style={{ position: "relative", zIndex: 10 }}>
        <SignInPage
          logo={
            <div className="flex items-baseline gap-2">
              <STEEZWordmark size={26} color="var(--foreground)" />
              <span className="cn-text text-lg font-bold text-[var(--gold,#E0A93A)]">思智</span>
            </div>
          }
          title={<span className="font-light text-foreground tracking-tighter">{dict.auth.welcomeBack}</span>}
          description={dict.auth.signInSub}
          emailLabel={dict.auth.email}
          emailPlaceholder={dict.auth.emailPlaceholder}
          passwordLabel={dict.auth.password}
          passwordPlaceholder={dict.auth.passwordPlaceholder}
          keepSignedInLabel={dict.auth.keepSignedIn}
          resetPasswordLabel={dict.auth.resetPasswordLink}
          signInLabel={dict.auth.signIn}
          signingInLabel={dict.auth.signingIn}
          pending={pending}
          errorMessage={error}
          onSignIn={handleSignIn}
        />
      </div>
    </div>
  );
}
