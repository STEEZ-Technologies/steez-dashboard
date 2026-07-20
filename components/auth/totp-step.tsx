"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

export function TotpStep({
  pending,
  errorMessage,
  onSubmit,
  onBack,
}: {
  pending: boolean;
  errorMessage?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  const { dict } = useT();

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{dict.auth.totpTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{dict.auth.totpSub}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="code">{dict.auth.totpCodeLabel}</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={dict.auth.totpCodePlaceholder}
                autoFocus
                required
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? dict.auth.signingIn : dict.auth.totpVerify}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                {dict.auth.totpBack}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
