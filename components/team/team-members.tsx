"use client";

import { useState, useTransition } from "react";
import { UserPlus, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  addTeamMember,
  removeTeamMember,
  resetMemberPassword,
} from "@/app/(dashboard)/team/actions";
import { KeyRound } from "lucide-react";

export type Member = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  isSelf: boolean;
};

export function TeamMembers({
  members,
  canManage,
}: {
  members: Member[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [toRemove, setToRemove] = useState<Member | null>(null);
  const [toReset, setToReset] = useState<Member | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetErr, setResetErr] = useState<string | null>(null);

  function handleReset() {
    const target = toReset;
    if (!target) return;
    setResetErr(null);
    startTransition(async () => {
      const err = await resetMemberPassword(target.id, resetPw);
      if (err) {
        setResetErr(err);
      } else {
        toast.success("Password reset");
        setToReset(null);
        setResetPw("");
      }
    });
  }

  function handleAdd(formData: FormData) {
    formData.set("role", role);
    setError(null);
    startTransition(async () => {
      const err = await addTeamMember(undefined, formData);
      if (err) {
        setError(err);
      } else {
        toast.success("Team member added");
        setOpen(false);
        setRole("STAFF");
      }
    });
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>
              <UserPlus /> Add member
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add team member</DialogTitle>
                <DialogDescription>
                  Creates a login for a teammate. There is no email invite — share the
                  credentials with them directly.
                </DialogDescription>
              </DialogHeader>
              <form action={handleAdd} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Temporary password</Label>
                  <Input id="password" name="password" type="text" minLength={8} required />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v ?? "STAFF")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={pending}>
                    {pending ? "Adding…" : "Add member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              {canManage && <TableHead className="w-[52px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.email}
                  {m.isSelf && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>
                    {m.role === "OWNER" ? "Owner" : "Staff"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{m.createdAt}</TableCell>
                {canManage && (
                  <TableCell>
                    {!m.isSelf && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setResetPw(""); setResetErr(null); setToReset(m); }}>
                            <KeyRound className="size-4" /> Reset password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setToRemove(m)}
                          >
                            <Trash2 className="size-4" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toRemove?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will immediately lose access to this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toRemove;
                setToRemove(null);
                if (target)
                  startTransition(async () => {
                    await removeTeamMember(target.id);
                    toast.success("Member removed");
                  });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!toReset} onOpenChange={(o) => !o && setToReset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for {toReset?.email}. Share it with them directly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="resetPw">New password</Label>
            <Input
              id="resetPw"
              type="text"
              minLength={8}
              value={resetPw}
              onChange={(e) => setResetPw(e.target.value)}
            />
            {resetErr && <p className="text-sm text-destructive">{resetErr}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleReset} disabled={pending || resetPw.length < 8}>
              {pending ? "Resetting…" : "Reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
