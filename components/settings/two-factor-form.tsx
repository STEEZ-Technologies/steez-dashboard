"use client";

import { useActionState, useState, useTransition } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  startTotpEnrollment,
  confirmTotpEnrollment,
  cancelTotpEnrollment,
  disableTotp,
} from "@/app/(dashboard)/settings/actions";
import { useT } from "@/lib/i18n/provider";

type EnrollState = { secret: string; uri: string; qrDataUrl: string } | null;

export function TwoFactorForm({ enabled }: { enabled: boolean }) {
  const { dict } = useT();
  const t = dict.settings.twoFactor;

  const [enroll, setEnroll] = useState<EnrollState>(null);
  const [starting, startStarting] = useTransition();
  const [confirmState, confirmAction, confirming] = useActionState(
    confirmTotpEnrollment,
    undefined,
  );
  const [disableError, disableAction, disabling] = useActionState(
    disableTotp,
    undefined,
  );
  const [showDisable, setShowDisable] = useState(false);

  async function handleEnable() {
    startStarting(async () => {
      const result = await startTotpEnrollment();
      if ("error" in result) return;
      const qrDataUrl = await QRCode.toDataURL(result.uri);
      setEnroll({ ...result, qrDataUrl });
    });
  }

  async function handleCancel() {
    setEnroll(null);
    await cancelTotpEnrollment();
  }

  if (confirmState?.recoveryCodes) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t.recoveryTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">{t.recoveryDesc}</p>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
            {confirmState.recoveryCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
          <div>
            <Button onClick={() => setEnroll(null)}>{t.recoveryDone}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (enroll) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t.scanTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">{t.scanDesc}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qrDataUrl} alt="TOTP QR code" width={200} height={200} className="rounded-lg" />
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">{t.manualEntry}</p>
            <code className="break-all text-sm">{enroll.secret}</code>
          </div>
          <form action={confirmAction} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="totp-code">{t.codeLabel}</Label>
              <Input
                id="totp-code"
                name="code"
                inputMode="numeric"
                placeholder={t.codePlaceholder}
                autoFocus
                required
              />
            </div>
            {confirmState?.error && (
              <p className="text-sm text-destructive">{confirmState.error}</p>
            )}
            <div className="flex gap-3">
              <Button type="submit" disabled={confirming}>
                {confirming ? t.confirming : t.confirm}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t.cancel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">{enabled ? t.descOn : t.descOff}</p>
        {enabled ? (
          showDisable ? (
            <form action={disableAction} className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="disable-password">{t.disableConfirmPassword}</Label>
                <Input id="disable-password" name="password" type="password" required autoComplete="current-password" />
              </div>
              {disableError && <p className="text-sm text-destructive">{disableError}</p>}
              <div className="flex gap-3">
                <Button type="submit" variant="destructive" disabled={disabling}>
                  {disabling ? t.disabling : t.disable}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDisable(false)}>
                  {t.cancel}
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <Button variant="destructive" onClick={() => setShowDisable(true)}>
                {t.disable}
              </Button>
            </div>
          )
        ) : (
          <div>
            <Button onClick={handleEnable} disabled={starting}>
              {t.enable}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
