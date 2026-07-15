"use client";

import { useState, useTransition } from "react";
import { Plus, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createInviteCode, revokeInviteCode } from "@/app/(dashboard)/team/actions";

export type InviteCodeRow = {
  id: string;
  code: string;
  used: boolean;
  usedByEmail: string | null;
};

export function InviteCodes({ codes }: { codes: InviteCodeRow[] }) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  function generate() {
    startTransition(async () => {
      const code = await createInviteCode();
      if (code) {
        await navigator.clipboard.writeText(code).catch(() => {});
        setCopied(code);
        toast.success("Invite code created & copied");
      }
    });
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    toast.success("Copied");
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Invite codes</CardTitle>
        <Button size="sm" onClick={generate} disabled={pending}>
          <Plus /> Generate code
        </Button>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Share a code so a new client can create their own workspace at{" "}
          <span className="font-mono">/signup</span>. Each code works once.
        </p>
        {codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invite codes yet.</p>
        ) : (
          <ul className="divide-y">
            {codes.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="font-mono text-sm">{c.code}</span>
                {c.used ? (
                  <Badge variant="secondary">Used{c.usedByEmail ? ` · ${c.usedByEmail}` : ""}</Badge>
                ) : (
                  <Badge>Active</Badge>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {!c.used && (
                    <Button variant="ghost" size="icon-sm" onClick={() => copy(c.code)} aria-label="Copy">
                      {copied === c.code ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                  )}
                  {!c.used && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Revoke"
                      onClick={() =>
                        startTransition(async () => {
                          await revokeInviteCode(c.id);
                          toast.success("Code revoked");
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
