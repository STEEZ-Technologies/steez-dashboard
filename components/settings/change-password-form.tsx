"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/app/(dashboard)/settings/actions";
import { useT } from "@/lib/i18n/provider";

export function ChangePasswordForm() {
  const [error, formAction, pending] = useActionState(changePassword, undefined);
  const { dict } = useT();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{dict.settings.changePassword}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">{dict.settings.currentPassword}</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">{dict.settings.newPassword}</Label>
            <Input id="newPassword" name="newPassword" type="password" minLength={8} required autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? dict.settings.saving : dict.settings.updatePassword}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
