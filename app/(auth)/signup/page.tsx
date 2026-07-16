"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { signup } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [error, formAction, pending] = useActionState(signup, undefined);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[var(--forest)] text-[var(--off-white,#faf9f5)] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, var(--mint) 0%, transparent 60%), radial-gradient(50% 40% at 90% 90%, var(--gold) 0%, transparent 55%)",
          }}
        />
        <div className="relative flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-[0.14em] text-white">
            STEEZ
          </span>
          <span className="cn-text text-xl font-bold text-[var(--gold)]">思智</span>
        </div>

        <div className="relative max-w-md">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
            Create your workspace
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-white">
            Your catalog, your control.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Set up a workspace with your invite code and start managing your
            storefront in minutes.
          </p>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} STEEZ · 思智
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-[0.14em]">STEEZ</span>
              <span className="cn-text text-xl font-bold text-[var(--gold)]">思智</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Create workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ll need an invite code from STEEZ.
          </p>

          <form action={formAction} className="mt-8 grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="code">Invite code</Label>
              <Input id="code" name="code" required autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenantName">Workspace name</Label>
              <Input id="tenantName" name="tenantName" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating…" : "Create workspace"}
              {!pending && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--forest-mid,#0f6e56)] hover:underline dark:text-[var(--mint)]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
