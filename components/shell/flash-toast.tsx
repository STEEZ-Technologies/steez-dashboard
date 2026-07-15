"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Fires a sonner toast from a `?flash=` search param set by Server Actions
 * that redirect after a mutation, then strips it from the URL. */
export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const flash = params.get("flash");
    if (flash && flash !== last.current) {
      last.current = flash;
      toast.success(flash);
      const next = new URLSearchParams(params);
      next.delete("flash");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }, [params, router, pathname]);

  return null;
}
