"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  GripVertical,
  FolderTree,
  Plus,
  Package,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/shell/empty-state";
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
  deleteCategory,
  moveCategory,
  reorderCategories,
} from "@/app/(dashboard)/categories/actions";
import { useT } from "@/lib/i18n/provider";

export type CategoryProduct = {
  id: string;
  name: string;
  model: string;
  published: boolean;
};

export type CategoryRow = {
  id: string;
  label: string;
  slug: string;
  productCount: number;
  products: CategoryProduct[];
};

export function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<CategoryRow | null>(null);
  const [order, setOrder] = useState<CategoryRow[]>(categories);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  useEffect(() => setOrder(categories), [categories]);
  const { dict } = useT();
  const t = dict.categories;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function runAction(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(message);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((c) => c.id === active.id);
    const newIndex = order.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startTransition(async () => {
      await reorderCategories(next.map((c) => c.id));
      toast.success("Order saved");
    });
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={FolderTree}
        title={t.emptyTitle}
        description={t.emptyDesc}
        action={
          <LinkButton href="/categories/new">
            <Plus /> {dict.actions.newCategory}
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28px]"></TableHead>
              <TableHead>{t.colCategory}</TableHead>
              <TableHead>{t.colSlug}</TableHead>
              <TableHead>{t.colProducts}</TableHead>
              <TableHead className="w-[52px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={order.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {order.map((c) => (
                <CategoryTableRow
                  key={c.id}
                  c={c}
                  pending={pending}
                  expanded={expanded.has(c.id)}
                  onToggleExpand={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(c.id)) next.delete(c.id);
                      else next.add(c.id);
                      return next;
                    })
                  }
                  onMoveUp={() => runAction(() => moveCategory(c.id, "up"), "Moved up")}
                  onMoveDown={() =>
                    runAction(() => moveCategory(c.id, "down"), "Moved down")
                  }
                  onDelete={() => setToDelete(c)}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dict.products.deleteTitle} “{toDelete?.label}”?</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (target) runAction(() => deleteCategory(target.id), "Category deleted");
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

function CategoryTableRow({
  c,
  pending,
  expanded,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  c: CategoryRow;
  pending: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: c.id });
  const { dict } = useT();

  return (
    <>
      <TableRow
        ref={setNodeRef}
        data-pending={pending || undefined}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : undefined,
        }}
      >
        <TableCell>
          <button
            type="button"
            className="flex size-6 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        </TableCell>
        <TableCell className="font-medium">{c.label}</TableCell>
        <TableCell className="text-muted-foreground">{c.slug}</TableCell>
        <TableCell className="text-muted-foreground tabular-nums">
          <button
            type="button"
            onClick={onToggleExpand}
            disabled={c.productCount === 0}
            className="flex items-center gap-1 disabled:cursor-default"
          >
            {c.productCount > 0 &&
              (expanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              ))}
            {c.productCount}
          </button>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={dict.actions.edit}
              title={dict.actions.edit}
              render={<Link href={`/categories/${c.id}/edit`} />}
            >
              <Pencil className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          </div>
        </TableCell>
      </TableRow>
      {expanded && c.products.length > 0 && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30 p-0">
            <ul className="divide-y divide-border/60 px-4 py-2">
              {c.products.map((p) => (
                <li key={p.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <Package className="size-3.5 text-muted-foreground" />
                  <Link
                    href={`/products/${p.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="text-muted-foreground">{p.model}</span>
                  <Badge
                    variant={p.published ? "default" : "outline"}
                    className="ml-auto"
                  >
                    {p.published ? dict.products.published : dict.products.draft}
                  </Badge>
                </li>
              ))}
            </ul>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
