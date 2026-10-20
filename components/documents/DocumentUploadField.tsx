"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/provider";

/** A PDF/JPG/PNG upload into a hidden `filePath` input, via
    /api/upload/document. Shows the current file as a link. */
export function DocumentUploadField({
  defaultValue,
  defaultUrl,
}: {
  defaultValue?: string;
  defaultUrl?: string;
}) {
  const t = useT().dict.documents;
  const [path, setPath] = useState(defaultValue ?? "");
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [name, setName] = useState(defaultValue ? defaultValue.split("/").pop() ?? "" : "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/document", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPath(data.path);
      setUrl(data.url);
      setName(data.name ?? file.name);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-2">
      <Label>{t.file}</Label>
      <input type="hidden" name="filePath" value={path} />
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {path && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-2 text-sm underline underline-offset-4"
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{name}</span>
          </a>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={status === "uploading"}
          onClick={() => inputRef.current?.click()}
        >
          {status === "uploading" ? <Loader2 className="animate-spin" /> : <Upload />}
          {status === "uploading" ? t.uploading : path ? t.replaceFile : t.chooseFile}
        </Button>
      </div>
      {status === "error" && <p className="text-xs text-destructive">{t.uploadFailed}</p>}
      <p className="text-xs text-muted-foreground">{t.fileHelp}</p>
    </div>
  );
}
