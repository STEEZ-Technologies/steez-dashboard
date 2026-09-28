"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowRight, Building2, KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shell/empty-state";
import {
  createTenant,
  openWorkspace,
  resetTenantOwnerPassword,
} from "@/app/(dashboard)/admin/actions";
import { useT } from "@/lib/i18n/provider";

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  userCount: number;
  productCount: number;
  createdAt: string;
  ownerId: string | null;
  ownerEmail: string | null;
};

export function TenantsPanel({
  tenants,
  currentTenantId,
}: {
  tenants: TenantRow[];
  /** Workspace the dashboard is showing right now (STEEZ's own or an opened client). */
  currentTenantId: string;
}) {
  const { dict } = useT();
  const t = dict.admin;
  const [open, setOpen] = useState(false);
  const [error, formAction, creating] = useActionState(createTenant, undefined);
  const [pending, startTransition] = useTransition();
  const [toReset, setToReset] = useState<TenantRow | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetErr, setResetErr] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  function handleOpen(tenantId: string) {
    setOpening(tenantId);
    startTransition(async () => {
      // Redirects on success; only returns when something went wrong.
      const err = await openWorkspace(tenantId);
      if (err) toast.error(err);
      setOpening(null);
    });
  }

  function handleReset() {
    if (!toReset?.ownerId) return;
    setResetErr(null);
    startTransition(async () => {
      const err = await resetTenantOwnerPassword(toReset.ownerId!, resetPw);
      if (err) {
        setResetErr(err);
      } else {
        toast.success(t.passwordReset);
        setToReset(null);
        setResetPw("");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus /> {t.newTenant}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.createTenant}</DialogTitle>
              <DialogDescription>{t.subtitle}</DialogDescription>
            </DialogHeader>
            <form action={formAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t.tenantName}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">{t.tenantSlug}</Label>
                <Input id="slug" name="slug" required placeholder="acme-sanitary" />
                <p className="text-xs text-muted-foreground">{t.slugHelp}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ownerEmail">{t.ownerEmail}</Label>
                <Input id="ownerEmail" name="ownerEmail" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ownerPassword">{t.ownerPassword}</Label>
                <Input
                  id="ownerPassword"
                  name="ownerPassword"
                  type="text"
                  minLength={8}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? t.creating : t.createTenant}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon={Building2} title={t.emptyTitle} description={t.emptyDesc} />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.colWorkspace}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.colUsers}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.colProducts}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.colCreated}</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="mr-2">
                        {tenant.slug}
                      </Badge>
                      <span className="mt-1 block sm:mt-0 sm:inline">
                        {tenant.ownerEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell tabular-nums text-muted-foreground">
                    {tenant.userCount}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell tabular-nums text-muted-foreground">
                    {tenant.productCount}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell whitespace-nowrap text-muted-foreground">
                    {tenant.createdAt}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                    {tenant.id === currentTenantId ? (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {t.currentWorkspace}
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        disabled={pending}
                        onClick={() => handleOpen(tenant.id)}
                      >
                        {opening === tenant.id ? "…" : t.openWorkspace}
                        <ArrowRight className="size-3.5" />
                      </Button>
                    )}
                    {tenant.ownerId && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t.resetOwnerPassword}
                        title={t.resetOwnerPassword}
                        onClick={() => {
                          setResetPw("");
                          setResetErr(null);
                          setToReset(tenant);
                        }}
                      >
                        <KeyRound className="size-4" />
                      </Button>
                    )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!toReset} onOpenChange={(o) => !o && setToReset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.resetOwnerPassword}</DialogTitle>
            <DialogDescription>{toReset?.ownerEmail}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="newOwnerPw">{dict.settings.newPassword}</Label>
            <Input
              id="newOwnerPw"
              type="text"
              minLength={8}
              value={resetPw}
              onChange={(e) => setResetPw(e.target.value)}
            />
            {resetErr && <p className="text-sm text-destructive">{resetErr}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleReset} disabled={pending || resetPw.length < 8}>
              {t.resetOwnerPassword}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
