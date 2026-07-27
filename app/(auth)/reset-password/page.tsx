"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetPassword } from "../actions";
import { useT } from "@/lib/i18n/provider";

export default function ResetPasswordPage() {
  const { dict } = useT();
  const token = useSearchParams().get("token") ?? "";
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{dict.auth.resetTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{dict.auth.resetSub}</p>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-destructive">{dict.auth.resetMissingToken}</p>
          ) : state?.success ? (
            <div className="grid gap-4">
              <p className="text-sm text-foreground">{dict.auth.resetSuccess}</p>
              <Button render={<Link href="/login" />}>{dict.auth.resetGoToLogin}</Button>
            </div>
          ) : (
            <form action={formAction} className="grid gap-5">
              <input type="hidden" name="token" value={token} />
              <div className="grid gap-2">
                <Label htmlFor="password">{dict.auth.resetPasswordLabel}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={dict.auth.resetPasswordPlaceholder}
                  autoFocus
                  required
                  minLength={8}
                />
              </div>
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" disabled={pending}>
                {pending ? dict.auth.resetSubmitting : dict.auth.resetSubmit}
              </Button>
            </form>
          )}
          {!state?.success && (
            <Link
              href="/login"
              className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {dict.auth.forgotBack}
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
