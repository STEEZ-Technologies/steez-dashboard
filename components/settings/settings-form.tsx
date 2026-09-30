"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateTenantSettings } from "@/app/(dashboard)/settings/actions";
import { useT } from "@/lib/i18n/provider";

// Only what the client should touch. The slug, live site address and deploy
// hook are STEEZ's to set, from /admin.
export function SettingsForm({
  name,
  canManage,
}: {
  name: string;
  canManage: boolean;
}) {
  const [error, formAction, pending] = useActionState(updateTenantSettings, undefined);
  const { dict } = useT();

  return (
    <form action={formAction} className="max-w-xl">
      <Card>
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Label htmlFor="name">{dict.settings.workspaceName}</Label>
            <Input id="name" name="name" defaultValue={name} disabled={!canManage} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {canManage ? (
            <div>
              <Button type="submit" disabled={pending}>
                {pending ? dict.settings.saving : dict.settings.saveChanges}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {dict.settings.ownerOnlyNote}
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
