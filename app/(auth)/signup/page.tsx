"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [error, formAction, pending] = useActionState(signup, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-2xl font-extrabold tracking-[0.14em]">STEEZ</span>
            <span className="cn-text text-xl font-bold text-[var(--gold)]">思智</span>
          </div>
          <p className="eyebrow mt-3">Create your workspace</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form action={formAction} className="grid gap-5">
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
                <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Creating…" : "Create workspace"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--forest-mid,#0f6e56)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
