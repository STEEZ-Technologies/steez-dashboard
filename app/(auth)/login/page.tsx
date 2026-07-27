"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { authenticate } from "../actions";
import { SignInPage } from "@/components/ui/sign-in";
import { TotpStep } from "@/components/auth/totp-step";
import { ShaderBackground } from "@/components/shared/shader-background";
import { STEEZWordmark } from "@/components/shared/steez-wordmark";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { useT } from "@/lib/i18n/provider";

export default function LoginPage() {
  const { dict } = useT();
  const [error, setError] = useState<string | undefined>();
  const [needsTotp, setNeedsTotp] = useState(false);
  const [pending, startTransition] = useTransition();
  // Password isn't held in React state (avoid it lingering in memory/devtools)
  // — the credentials form fields are just re-read from this hidden form on
  // the TOTP step, which resubmits email+password+code together.
  const credentialsRef = useRef<{
    email: string;
    password: string;
    rememberMe: string;
  } | null>(null);

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
    credentialsRef.current = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      rememberMe: String(formData.get("rememberMe") ?? ""),
    };
    setError(undefined);
    startTransition(async () => {
      const result = await authenticate(undefined, formData);
      setError(result.error);
      setNeedsTotp(Boolean(result.totpRequired));
    });
  }

  function handleTotpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const creds = credentialsRef.current;
    if (!creds) {
      setNeedsTotp(false);
      return;
    }
    const code = new FormData(event.currentTarget).get("code");
    const formData = new FormData();
    formData.set("email", creds.email);
    formData.set("password", creds.password);
    formData.set("code", String(code ?? ""));
    if (creds.rememberMe) formData.set("rememberMe", creds.rememberMe);
    setError(undefined);
    startTransition(async () => {
      const result = await authenticate(undefined, formData);
      setError(result.error);
      setNeedsTotp(Boolean(result.totpRequired));
    });
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <ShaderBackground color1={color1} color2={color2} speed={1} />
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 20 }}>
        <ThemeToggle />
      </div>
      <div style={{ position: "relative", zIndex: 10 }}>
        {needsTotp ? (
          <TotpStep
            pending={pending}
            errorMessage={error}
            onSubmit={handleTotpSubmit}
            onBack={() => {
              setNeedsTotp(false);
              setError(undefined);
            }}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
