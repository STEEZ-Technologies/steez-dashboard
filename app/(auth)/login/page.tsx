"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authenticate } from "../actions";
import { SignInPage } from "@/components/ui/sign-in";
import { TotpStep } from "@/components/auth/totp-step";
import GlimmerVale from "@/components/originkit/ui/glimmer-vale";
import { STEEZWordmark } from "@/components/shared/steez-wordmark";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { LanguageSwitcher } from "@/components/shell/language-switcher";
import { useT } from "@/lib/i18n/provider";
import { kawadaTheme } from "../../(dashboard)/kawada-theme";

export default function LoginPage() {
  const { dict } = useT();
  const router = useRouter();
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
    <div data-tenant="kawada" style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <style>{kawadaTheme}</style>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <GlimmerVale style={{ minWidth: 0, minHeight: 0 }} />
      </div>
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 20, display: "flex", gap: 8 }}>
        <LanguageSwitcher />
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
              <div className="flex items-center gap-2.5">
                <STEEZWordmark size={24} color="var(--foreground)" />
                <span className="text-sm font-medium text-muted-foreground">×</span>
                <Image
                  src="/brand/kawada-logo-h144.webp"
                  alt="Kawada"
                  width={66}
                  height={48}
                  className="h-9 w-auto object-contain"
                />
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
            panelClassName="rounded-3xl border border-(--glass-edge) bg-[rgb(250_245_255/55%)] p-6 shadow-[0_10px_35px_-18px_var(--glass-shadow),inset_0_1px_0_var(--glass-highlight)] backdrop-blur-md dark:bg-[rgb(45_30_58/55%)] sm:p-9"
            onSignIn={handleSignIn}
            onResetPassword={() => router.push("/forgot-password")}
          />
        )}
      </div>
    </div>
  );
}
