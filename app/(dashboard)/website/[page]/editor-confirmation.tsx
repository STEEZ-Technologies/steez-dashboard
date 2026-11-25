"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function EditorConfirmation({ title, cancelLabel, onCancel, children, confirm }: {
  title: string;
  cancelLabel: string;
  onCancel: () => void;
  children: ReactNode;
  confirm: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    cancel.current?.focus();
    return () => node?.close();
  }, []);

  return <dialog ref={dialog} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onCancel(); }}
    className="fixed inset-0 m-auto max-h-[85dvh] w-[min(92vw,34rem)] overflow-y-auto rounded-xl border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-black/45">
    <h2 id={titleId} className="mb-2 text-lg font-semibold">{title}</h2>
    <div className="space-y-2 text-sm">{children}</div>
    <div className="mt-5 flex flex-wrap justify-end gap-3">
      <button ref={cancel} type="button" onClick={onCancel} className="rounded-md border px-3 py-2">{cancelLabel}</button>
      {confirm}
    </div>
  </dialog>;
}
