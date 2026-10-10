"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, ExternalLink, Globe, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { goLive, transferSite } from "@/app/(dashboard)/admin/handover/actions";
import type { DeployRun } from "@/lib/handover";
import { useT } from "@/lib/i18n/provider";

const RAM_URL = "https://ram.console.aliyun.com/users";

export function HandoverPanel({
  slug,
  name,
  domains,
  dns,
  githubReady,
  originsReady,
  runs,
}: {
  slug: string;
  name: string;
  domains: string[];
  dns: { aliyun: boolean; servers: string[] };
  githubReady: boolean;
  originsReady: boolean;
  runs: DeployRun[];
}) {
  const { dict } = useT();
  const t = dict.handover;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [watchUntil, setWatchUntil] = useState(0);
  const [transferring, startTransfer] = useTransition();
  const [launching, startLaunch] = useTransition();

  const zone = domains[0];
  const domainList = domains.join(" + ");

  // Poll while a deploy is running, and for a minute after starting one —
  // GitHub takes a few seconds to list a freshly dispatched run.
  const running = runs.some((r) => r.status !== "completed");
  useEffect(() => {
    if (!running && Date.now() > watchUntil) return;
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [running, watchUntil, router]);

  function started() {
    setWatchUntil(Date.now() + 60_000);
    toast.success(t.started);
    router.refresh();
  }

  function transfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setTransferError(null);
    startTransfer(async () => {
      const err = await transferSite(slug, formData);
      if (err) return setTransferError(err);
      formRef.current?.reset();
      started();
    });
  }

  function launch() {
    setLiveError(null);
    startLaunch(async () => {
      const err = await goLive(slug);
      if (err) return setLiveError(err);
      started();
    });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="grid gap-3 p-6">
            <p className="eyebrow">{t.checklist}</p>
            <Check ok={githubReady} label={t.checkGithub} />
            <Check ok={originsReady} label={t.checkOrigins.replace("{domains}", domainList)} />
            <div className="flex gap-2 text-sm">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                {t.checkKey.replace("{zone}", zone)}{" "}
                <a
                  href={RAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-2"
                >
                  {t.createKey} <ExternalLink className="size-3" />
                </a>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 p-6">
            <div className="grid gap-1">
              <h2 className="text-base font-semibold">{t.step1}</h2>
              <p className="text-sm text-muted-foreground">{t.step1Desc.replace("{zone}", zone)}</p>
            </div>
            <form ref={formRef} className="grid gap-4" onSubmit={transfer}>
              <div className="grid gap-2">
                <Label htmlFor="akId">{t.akId}</Label>
                <Input id="akId" name="akId" required autoComplete="off" spellCheck={false} className="font-mono" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="akSecret">{t.akSecret}</Label>
                <Input
                  id="akSecret"
                  name="akSecret"
                  type="password"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">{t.akHelp}</p>
              </div>
              {transferError && <p className="text-sm text-destructive">{transferError}</p>}
              <Button type="submit" size="lg" disabled={transferring || !githubReady}>
                {transferring ? <Loader2 className="animate-spin" /> : <Send />}
                {transferring ? t.transferring : t.transfer.replace("{name}", name)}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 p-6">
            <div className="grid gap-1">
              <h2 className="text-base font-semibold">{t.step2}</h2>
              <p className="text-sm text-muted-foreground">{t.step2Desc.replace("{domains}", domainList)}</p>
            </div>
            <Check
              ok={dns.aliyun}
              label={
                dns.aliyun
                  ? t.dnsAliyun.replace("{zone}", zone)
                  : t.dnsElsewhere.replace("{zone}", zone).replace("{servers}", dns.servers.join(", ") || "—")
              }
            />
            {liveError && <p className="text-sm text-destructive">{liveError}</p>}
            <Button
              size="lg"
              variant="outline"
              disabled={launching || !githubReady || !dns.aliyun}
              onClick={() => setConfirming(true)}
            >
              {launching ? <Loader2 className="animate-spin" /> : <Globe />}
              {launching ? t.goingLive : t.goLive}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t.deploys}</h2>
        <Card>
          <CardContent className="grid gap-3 p-6">
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noDeploys}</p>
            ) : (
              runs.map((run) => (
                <div key={run.url} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <RunBadge run={run} />
                    <span className="truncate text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <a
                    href={run.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 underline underline-offset-2"
                  >
                    {t.viewLog} <ExternalLink className="size-3" />
                  </a>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmTitle.replace("{domains}", domainList)}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirming(false);
                launch();
              }}
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      )}
      <span className={ok ? undefined : "text-destructive"}>{label}</span>
    </div>
  );
}

function RunBadge({ run }: { run: DeployRun }) {
  const { dict } = useT();
  const t = dict.handover;
  if (run.status === "queued") return <Badge variant="secondary">{t.queued}</Badge>;
  if (run.status !== "completed") {
    return (
      <Badge variant="secondary">
        <Loader2 className="size-3 animate-spin" /> {t.running}
      </Badge>
    );
  }
  return run.conclusion === "success" ? (
    <Badge>{t.succeeded}</Badge>
  ) : (
    <Badge variant="destructive">{t.failed}</Badge>
  );
}
