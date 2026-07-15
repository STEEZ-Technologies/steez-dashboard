"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ImageUploadField({
  name,
  label,
  defaultValue,
  defaultUrl,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  defaultUrl?: string;
}) {
  const [path, setPath] = useState(defaultValue ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

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
            {previewUrl ? "Replace image" : "Upload image"}
          </Button>
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground"
            >
              <X className="size-3.5" /> Remove
            </Button>
          )}
        </div>
      </div>
      {status === "error" && (
        <p className="text-sm text-destructive">Upload failed. Try again.</p>
      )}
    </div>
  );
}
