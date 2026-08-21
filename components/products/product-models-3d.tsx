"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, Trash2, ArrowLeft, ArrowRight, Box } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addProductModel3D,
  removeProductModel3D,
  moveProductModel3D,
} from "@/app/(dashboard)/products/[id]/models3d/actions";
import { useT } from "@/lib/i18n/provider";

export type ProductModel = { id: string; url: string };

function fileName(url: string) {
  return url.split("/").pop() ?? url;
}

export function ProductModels3D({
  productId,
  models,
}: {
  productId: string;
  models: ProductModel[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const { dict } = useT();

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload/model", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        await addProductModel3D(productId, data.path);
      }
      toast.success(files.length > 1 ? dict.models3d.modelsAdded : dict.models3d.modelAdded);
    } catch {
      toast.error(dict.models3d.uploadFailed);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".glb,model/gltf-binary"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {models.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">
          {dict.models3d.empty}
        </p>
      ) : (
        <ul className="mb-3 divide-y">
          {models.map((model, i) => (
            <li key={model.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <Box className="size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{fileName(model.url)}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={i === 0 || pending}
                  onClick={() => startTransition(() => moveProductModel3D(productId, model.id, "up"))}
                  aria-label={dict.models3d.moveEarlier}
                >
                  <ArrowLeft className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={i === models.length - 1 || pending}
                  onClick={() => startTransition(() => moveProductModel3D(productId, model.id, "down"))}
                  aria-label={dict.models3d.moveLater}
                >
                  <ArrowRight className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await removeProductModel3D(productId, model.id);
                      toast.success(dict.models3d.modelRemoved);
                    })
                  }
                  aria-label={dict.models3d.remove}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Plus />}
        {uploading ? dict.models3d.uploading : dict.models3d.addModels}
      </Button>
    </div>
  );
}
