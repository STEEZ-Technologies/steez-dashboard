"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  ImageOff,
  GripVertical,
  BarChart3,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuSeparator,
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
  deleteProduct,
  duplicateProduct,
  moveProduct,
  reorderProducts,
  bulkUpdateProducts,
  bulkDeleteProducts,
} from "@/app/(dashboard)/products/actions";
import { useT } from "@/lib/i18n/provider";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  model: string;
  categoryLabel: string | null;
  featured: boolean;
  published: boolean;
  imageUrl: string | null;
};

const KONLITO_SITE_BASE = "https://konlito.steez.digital";

type SortKey = "name" | "model" | "category" | "status";

export function ProductsTable({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: { label: string }[];
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  // sort.key === null => manual (drag-reorderable) order
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({
    key: null,
    dir: "asc",
  });
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ProductRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { dict } = useT();
  const t = dict.products;

  // Local ordering so drag-reorder feels instant; re-sync when server data changes.
  const [order, setOrder] = useState<ProductRow[]>(products);
  useEffect(() => setOrder(products), [products]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const reorderable =
    sort.key === null && q === "" && category === "all" && status === "all";

  const rows = useMemo(() => {
    let out = order.filter((p) => {
      if (q && !`${p.name} ${p.model}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (category !== "all" && p.categoryLabel !== category) return false;
      if (status === "published" && !p.published) return false;
      if (status === "draft" && p.published) return false;
      if (status === "featured" && !p.featured) return false;
      return true;
    });
    if (sort.key !== null) {
      const key = sort.key;
      out = [...out].sort((a, b) => {
        const dir = sort.dir === "asc" ? 1 : -1;
        const val = (p: ProductRow) =>
          key === "category"
            ? (p.categoryLabel ?? "")
            : key === "status"
              ? `${p.published ? 1 : 0}${p.featured ? 1 : 0}`
              : p[key];
        return String(val(a)).localeCompare(String(val(b))) * dir;
      });
    }
    return out;
  }, [order, q, category, status, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? s.dir === "asc"
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" } // third click returns to manual order
        : { key, dir: "asc" },
    );
  }

  function runAction(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(message);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((p) => p.id === active.id);
    const newIndex = order.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startTransition(async () => {
      await reorderProducts(next.map((p) => p.id));
      toast.success(dict.products.toastOrderSaved);
    });
  }

  // ---- selection helpers ----
  const allVisibleSelected =
    rows.length > 0 && rows.every((p) => selected.has(p.id));
  function toggleAll() {
    setSelected((prev) => {
      if (rows.every((p) => prev.has(p.id))) {
        const next = new Set(prev);
        rows.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(prev);
      rows.forEach((p) => next.add(p.id));
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const selectedIds = useMemo(() => [...selected], [selected]);

  function bulkSet(patch: { published?: boolean }, message: string) {
    const ids = selectedIds;
    startTransition(async () => {
      await bulkUpdateProducts(ids, patch);
      setSelected(new Set());
      toast.success(message);
    });
  }

  const SortHead = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <TableHead>
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <ArrowUpDown
          className={`size-3 ${sort.key === k ? "opacity-100 text-foreground" : "opacity-50"}`}
        />
      </button>
    </TableHead>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.colCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allCategories}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.label} value={c.label}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t.colStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allStatus}</SelectItem>
            <SelectItem value="published">{t.published}</SelectItem>
            <SelectItem value="draft">{t.draft}</SelectItem>
            <SelectItem value="featured">{t.featured}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">
            {selectedIds.length} {t.selected}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => bulkSet({ published: true }, dict.actions.publish)}
            >
              <Eye className="size-4" /> {dict.actions.publish}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => bulkSet({ published: false }, dict.actions.unpublish)}
            >
              <EyeOff className="size-4" /> {dict.actions.unpublish}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-4" /> {dict.actions.delete}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              {dict.actions.clear}
            </Button>
          </div>
        </div>
      )}

      {!reorderable && (
        <p className="mb-2 text-xs text-muted-foreground">
          {t.reorderHint}
        </p>
      )}

      <div className="rounded-xl border bg-card">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[36px]">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[28px]"></TableHead>
                <TableHead className="w-[52px]"></TableHead>
                <SortHead k="name">{t.colProduct}</SortHead>
                <SortHead k="model">{t.colModel}</SortHead>
                <SortHead k="category">{t.colCategory}</SortHead>
                <SortHead k="status">{t.colStatus}</SortHead>
                <TableHead className="w-[52px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t.noMatch}
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={rows.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rows.map((p) => (
                    <ProductTableRow
                      key={p.id}
                      p={p}
                      pending={pending}
                      reorderable={reorderable}
                      selected={selected.has(p.id)}
                      onToggle={() => toggleOne(p.id)}
                      onDuplicate={() =>
                        runAction(() => duplicateProduct(p.id), dict.products.toastDuplicated)
                      }
                      onMoveUp={() =>
                        runAction(() => moveProduct(p.id, "up"), dict.products.toastMovedUp)
                      }
                      onMoveDown={() =>
                        runAction(() => moveProduct(p.id, "down"), dict.products.toastMovedDown)
                      }
                      onDelete={() => setToDelete(p)}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle} “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (target)
                  runAction(() => deleteProduct(target.id), dict.products.toastDeleted);
              }}
            >
              {dict.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.deleteTitle} {selectedIds.length} {t.colProduct.toLowerCase()}
              {selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>{t.bulkDeleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const ids = selectedIds;
                setBulkDeleteOpen(false);
                startTransition(async () => {
                  await bulkDeleteProducts(ids);
                  setSelected(new Set());
                  toast.success(dict.products.toastBulkDeleted);
                });
              }}
            >
              {dict.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductTableRow({
  p,
  pending,
  reorderable,
  selected,
  onToggle,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  p: ProductRow;
  pending: boolean;
  reorderable: boolean;
  selected: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id, disabled: !reorderable });
  const { dict } = useT();

  return (
    <TableRow
      ref={setNodeRef}
      data-pending={pending || undefined}
      data-state={selected ? "selected" : undefined}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
      }}
    >
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Select ${p.name}`}
        />
      </TableCell>
      <TableCell>
        <button
          type="button"
          className={`flex size-6 items-center justify-center text-muted-foreground ${
            reorderable ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-30"
          }`}
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-md bg-muted">
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt=""
              width={36}
              height={36}
              className="size-9 object-cover"
              unoptimized
            />
          ) : (
            <ImageOff className="size-4 text-muted-foreground" />
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">{p.name}</TableCell>
      <TableCell className="text-muted-foreground">{p.model}</TableCell>
      <TableCell className="text-muted-foreground">
        {p.categoryLabel ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex gap-1.5">
          {p.featured && <Badge variant="secondary">{dict.products.featured}</Badge>}
          <Badge variant={p.published ? "default" : "outline"}>
            {p.published ? dict.products.published : dict.products.draft}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/products/${p.id}/edit`} />}>
              <Pencil className="size-4" /> {dict.actions.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={`/products/${p.id}/analytics`} />}
            >
              <BarChart3 className="size-4" /> {dict.actions.analytics}
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <a
                  href={`${KONLITO_SITE_BASE}/products/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLink className="size-4" /> {dict.actions.preview}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="size-4" /> {dict.actions.duplicate}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveUp}>
              <ArrowUp className="size-4" /> {dict.actions.moveUp}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveDown}>
              <ArrowDown className="size-4" /> {dict.actions.moveDown}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> {dict.actions.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
