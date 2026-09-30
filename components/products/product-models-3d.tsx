"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
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
  const name = url.split("/").pop() ?? url;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

/* <model-viewer> is vendored as Google's self-contained build (three.js
   bundled in) under public/vendor, because the npm package's peer range pins
   an older three than the dashboard's own. It's a 1 MB script, so it is only
   fetched once a preview is actually on screen — the 3D tab is hidden until
   opened. */
const MODEL_VIEWER_SRC = "/vendor/model-viewer-4.3.1.min.js";
let modelViewerLoad: Promise<void> | null = null;
function loadModelViewer() {
  modelViewerLoad ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = MODEL_VIEWER_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      modelViewerLoad = null;
      reject(new Error("model-viewer failed to load"));
    };
    document.head.appendChild(script);
  });
  return modelViewerLoad;
}

function ModelPreview({ url }: { url: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let live = true;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      loadModelViewer().then(
        () => live && setReady(true),
        () => {},
      );
    });
    observer.observe(box);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={boxRef} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
      {ready ? (
        /* @ts-expect-error -- a custom element, not a React component */
        <model-viewer
          src={url}
          alt=""
          camera-controls
          auto-rotate
          interaction-prompt="none"
          shadow-intensity="0.6"
          exposure="0.9"
          tone-mapping="neutral"
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
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
        <ul className="mb-3 grid gap-3 sm:grid-cols-2">
          {models.map((model, i) => (
            <li key={model.id} className="grid gap-2">
              <ModelPreview url={model.url} />
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm">{fileName(model.url)}</span>
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
