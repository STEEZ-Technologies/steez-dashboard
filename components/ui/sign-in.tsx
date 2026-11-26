"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// --- TYPE DEFINITIONS ---

interface SignInPageProps {
  logo?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  keepSignedInLabel?: string;
  resetPasswordLabel?: string;
  signInLabel?: string;
  signingInLabel?: string;
  pending?: boolean;
  errorMessage?: string;
  panelClassName?: string;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-border/80 bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/60 focus-within:bg-primary/5">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  logo,
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  emailLabel = "Email Address",
  emailPlaceholder = "Enter your email address",
  passwordLabel = "Password",
  passwordPlaceholder = "Enter your password",
  keepSignedInLabel = "Keep me signed in",
  resetPasswordLabel = "Reset password",
  signInLabel = "Sign In",
  signingInLabel = "Signing in…",
  pending = false,
  errorMessage,
  panelClassName,
  onSignIn,
  onResetPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-5 sm:p-6">
      <div className={`w-full max-w-lg ${panelClassName ?? ""}`}>
        <div className="flex flex-col gap-6">
          {logo && <div className="animate-element animate-delay-100">{logo}</div>}
          <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="animate-element animate-delay-200 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <form className="space-y-5" onSubmit={onSignIn}>
            <div className="animate-element animate-delay-300">
              <label className="mb-2 block text-xs font-semibold tracking-wide text-foreground/75">
                {emailLabel}
              </label>
              <GlassInputWrapper>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={emailPlaceholder}
                  className="w-full rounded-xl bg-transparent px-4 py-3.5 text-sm focus:outline-none"
                />
              </GlassInputWrapper>
            </div>

            <div className="animate-element animate-delay-400">
              <label className="mb-2 block text-xs font-semibold tracking-wide text-foreground/75">
                {passwordLabel}
              </label>
              <GlassInputWrapper>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder={passwordPlaceholder}
                    className="w-full rounded-xl bg-transparent px-4 py-3.5 pr-11 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                    )}
                  </button>
                </div>
              </GlassInputWrapper>
            </div>

            <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                <span className="text-foreground/90">{keepSignedInLabel}</span>
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onResetPassword?.();
                }}
                className="text-primary transition-colors hover:underline"
              >
                {resetPasswordLabel}
              </a>
            </div>

            {errorMessage && (
              <p className="animate-element rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="animate-element animate-delay-600 w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {pending ? signingInLabel : signInLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
