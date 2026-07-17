"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addProductImage,
  removeProductImage,
  moveProductImage,
} from "@/app/(dashboard)/products/[id]/images/actions";
import { useT } from "@/lib/i18n/provider";

export type GalleryImage = { id: string; url: string };

export function ProductImages({
  productId,
  images,
}: {
  productId: string;
  images: GalleryImage[];
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
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        await addProductImage(productId, data.path);
      }
      toast.success(files.length > 1 ? dict.gallery.imagesAdded : dict.gallery.imageAdded);
    } catch {
      toast.error(dict.gallery.uploadFailed);
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
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {images.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">
          {dict.gallery.empty}
        </p>
      ) : (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="group relative overflow-hidden rounded-lg border">
              <Image
                src={img.url}
                alt={dict.gallery.altText.replace("{n}", String(i + 1))}
                width={160}
                height={160}
                className="aspect-square w-full object-cover"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/85 p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={i === 0 || pending}
                  onClick={() => startTransition(() => moveProductImage(productId, img.id, "up"))}
                  aria-label={dict.gallery.moveEarlier}
                >
                  <ArrowLeft className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={i === images.length - 1 || pending}
                  onClick={() => startTransition(() => moveProductImage(productId, img.id, "down"))}
                  aria-label={dict.gallery.moveLater}
                >
                  <ArrowRight className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await removeProductImage(productId, img.id);
                      toast.success(dict.gallery.imageRemoved);
                    })
                  }
                  aria-label={dict.gallery.remove}
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
        {uploading ? dict.gallery.uploading : dict.gallery.addImages}
      </Button>
    </div>
  );
}
