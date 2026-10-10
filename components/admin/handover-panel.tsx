"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { transferSite } from "@/app/(dashboard)/admin/handover/actions";
import type { DeployRun } from "@/lib/handover";
import { useT } from "@/lib/i18n/provider";

const TOKEN_URL = "https://dash.cloudflare.com/profile/api-tokens";

export function HandoverPanel({
  slug,
  name,
  domains,
  project,
  githubReady,
  originsReady,
  runs,
}: {
  slug: string;
  name: string;
  domains: string[];
  project: string;
  githubReady: boolean;
  originsReady: boolean;
  runs: DeployRun[];
}) {
  const { dict } = useT();
  const t = dict.handover;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [goLive, setGoLive] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagesDev, setPagesDev] = useState<string | null>(null);
  const [watchUntil, setWatchUntil] = useState(0);
  const [pending, startTransition] = useTransition();

  const domainList = domains.join(" + ");
  const preview = pagesDev ?? `${project}.pages.dev`;

  // Poll while a deploy is running, and for a minute after starting one —
  // GitHub takes a few seconds to list a freshly dispatched run.
  const running = runs.some((r) => r.status !== "completed");
  useEffect(() => {
    if (!running && Date.now() > watchUntil) return;
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [running, watchUntil, router]);

  function submit() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    if (goLive) formData.set("goLive", "on");
    setError(null);
    startTransition(async () => {
      const res = await transferSite(slug, formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setPagesDev(res.pagesDev);
      formRef.current?.reset();
      setGoLive(false);
      setWatchUntil(Date.now() + 60_000);
      toast.success(t.started);
      router.refresh();
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
                {t.checkToken.replace("{zone}", domains[0])}{" "}
                <a
                  href={TOKEN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-2"
                >
                  {t.createToken} <ExternalLink className="size-3" />
                </a>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <form
              ref={formRef}
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (goLive) setConfirming(true);
                else submit();
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="accountId">{t.accountId}</Label>
                <Input
                  id="accountId"
                  name="accountId"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  pattern="[0-9a-fA-F]{32}"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">{t.accountIdHelp}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apiToken">{t.apiToken}</Label>
                <Input
                  id="apiToken"
                  name="apiToken"
                  type="password"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">{t.apiTokenHelp}</p>
              </div>
              <label className="flex items-start gap-3 rounded-lg border p-3">
                <Checkbox
                  checked={goLive}
                  onCheckedChange={(v) => setGoLive(Boolean(v))}
                  className="mt-0.5"
                />
                <span className="grid gap-1">
                  <span className="text-sm font-medium">
                    {t.goLive.replace("{domains}", domainList)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.goLiveHelp.replace("{pagesDev}", preview)}
                  </span>
                </span>
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" disabled={pending || !githubReady}>
                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                {pending ? t.transferring : t.transfer.replace("{name}", name)}
              </Button>
            </form>
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
            <a
              href={`https://${preview}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
            >
              {t.preview.replace("{url}", preview)}
            </a>
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
                submit();
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
