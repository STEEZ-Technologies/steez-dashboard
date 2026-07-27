"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "../actions";
import { useT } from "@/lib/i18n/provider";

export default function ForgotPasswordPage() {
  const { dict } = useT();
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{dict.auth.forgotTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{dict.auth.forgotSub}</p>
        </CardHeader>
        <CardContent>
          {state?.message ? (
            <p className="text-sm text-foreground">{state.message}</p>
          ) : (
            <form action={formAction} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">{dict.auth.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={dict.auth.emailPlaceholder}
                  autoFocus
                  required
                />
              </div>
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" disabled={pending}>
                {pending ? dict.auth.forgotSending : dict.auth.forgotSend}
              </Button>
            </form>
          )}
          <Link
            href="/login"
            className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {dict.auth.forgotBack}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
