"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

export function ImageUploadField({
  name,
  label,
  defaultValue,
  defaultUrl,
  placeholderUrls = [],
}: {
  name: string;
  label: string;
  defaultValue?: string;
  defaultUrl?: string;
  /** Shown, in order of preference, while nothing is uploaded — e.g. the
   *  site icon a profile picture defaults to. Not a value: nothing is saved. */
  placeholderUrls?: string[];
}) {
  const [path, setPath] = useState(defaultValue ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderUrl = placeholderUrls[placeholderIndex];
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT().dict.editor;

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPath(data.path);
      setPreviewUrl(data.url);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function clear() {
    setPath("");
    setPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={path} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {status === "uploading" ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : previewUrl ? (
            <Image
              src={previewUrl}
              alt=""
              width={80}
              height={80}
              className="size-20 object-cover"
              unoptimized
            />
          ) : placeholderUrl ? (
            // Plain <img>: a failed load advances to the next candidate.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={placeholderUrl}
              src={placeholderUrl}
              alt=""
              className="size-20 object-cover"
              onError={() => setPlaceholderIndex((i) => i + 1)}
            />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {previewUrl ? t.replaceImage : t.uploadImage}
          </Button>
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground"
            >
              <X className="size-3.5" /> {t.remove}
            </Button>
          )}
        </div>
      </div>
      {status === "error" && (
        <p className="text-sm text-destructive">{t.uploadFailed}</p>
      )}
    </div>
  );
}
