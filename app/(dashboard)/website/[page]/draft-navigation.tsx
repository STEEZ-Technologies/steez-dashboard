"use client";

import { useEffect, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_NAVIGATE, type RequestNavigation } from "@/lib/dashboard-navigation";
import { EditorConfirmation } from "./editor-confirmation";

type BrowserNavigation = EventTarget & {
  currentEntry: NavigationHistoryEntry | null;
  entries: () => NavigationHistoryEntry[];
  traverseTo: (key: string) => { finished: Promise<unknown> };
};
type TraversalEvent = Event & {
  navigationType: string;
  hashChange: boolean;
  destination: { key: string; sameDocument: boolean; url: string };
};

function changesPage(href: string) {
  const url = new URL(href, location.href);
  return url.pathname !== location.pathname || url.search !== location.search;
}

export function DraftNavigation({ draftCount, dirty, zh, discard, resume }: {
  draftCount: number;
  dirty: RefObject<boolean>;
  zh: boolean;
  discard: () => void;
  resume: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<(() => void) | null>(null);

  const hasDrafts = draftCount > 0;
  useEffect(() => {
    if (!hasDrafts) return;
    const navigation = (window as Window & { navigation?: BrowserNavigation }).navigation;
    let origin = navigation?.currentEntry?.key;
    let bounce: string | undefined;

    function hold(proceed: () => void) {
      setPending(previous => previous ?? proceed);
    }

    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = true;
    }

    function click(event: MouseEvent) {
      if (!dirty.current || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (url.origin !== location.origin || !changesPage(url.href)) return;
      event.preventDefault();
      event.stopPropagation();
      hold(() => router.push(url.pathname + url.search + url.hash));
    }

    function request(event: Event) {
      if (!dirty.current) return;
      const { href, proceed } = (event as CustomEvent<RequestNavigation>).detail;
      if (!changesPage(href)) return;
      event.preventDefault();
      hold(proceed);
    }

    function traverse(event: Event) {
      const { navigationType, hashChange, destination } = event as TraversalEvent;
      if (!dirty.current || bounce || navigationType !== "traverse" || hashChange
        || !destination.sameDocument || !changesPage(destination.url) || !event.cancelable) return;
      event.preventDefault();
      hold(() => { void navigation?.traverseTo(destination.key).finished.catch(() => {}); });
    }

    function popstate(event: PopStateEvent) {
      const destination = navigation?.currentEntry;
      if (!destination || !origin) return;
      if (bounce) {
        bounce = undefined;
        if (destination.key === origin) {
          event.stopImmediatePropagation();
          return;
        }
      }
      // Browser UI may commit a same-document traversal before it can be
      // canceled. Return to the original entry before Next handles popstate.
      if (dirty.current && destination.key !== origin) {
        const previous = navigation?.entries().find(entry => entry.key === origin);
        if (previous?.url && destination.url) {
          const from = new URL(previous.url);
          const to = new URL(destination.url);
          if (from.pathname !== to.pathname || from.search !== to.search) {
            event.stopImmediatePropagation();
            bounce = origin;
            void navigation?.traverseTo(origin).finished.then(() => {
              hold(() => { void navigation?.traverseTo(destination.key).finished.catch(() => {}); });
            }).catch(() => {
              // If the browser can't return, let Next reconcile with its actual entry.
              bounce = undefined;
              origin = navigation?.currentEntry?.key;
              window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
            });
            return;
          }
        }
      }
      origin = destination.key;
    }

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    window.addEventListener(DASHBOARD_NAVIGATE, request);
    navigation?.addEventListener("navigate", traverse);
    window.addEventListener("popstate", popstate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
      window.removeEventListener(DASHBOARD_NAVIGATE, request);
      navigation?.removeEventListener("navigate", traverse);
      window.removeEventListener("popstate", popstate, true);
    };
  }, [dirty, hasDrafts, router]);

  if (!pending) return null;
  return <EditorConfirmation title={zh ? "有未保存的更改" : "You have unsaved changes"}
    cancelLabel={zh ? "继续编辑" : "Keep editing"} onCancel={() => {
      setPending(null);
      window.requestAnimationFrame(resume);
    }}
    confirm={<button type="button" className="rounded-md bg-destructive px-3 py-2 text-white" onClick={() => {
      setPending(null);
      discard();
      pending();
    }}>{zh ? "放弃更改并离开" : "Discard changes and leave"}</button>}>
    <p>{zh ? "继续编辑可保留此页面的草稿。" : "Keep editing to preserve your drafts on this page."}</p>
  </EditorConfirmation>;
}
