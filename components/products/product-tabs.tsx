"use client";

import { createContext, useContext, useState } from "react";
import { flushSync } from "react-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* The product edit page split into tabs instead of one long scroll.
 *
 * Panels are `hidden`, never unmounted: Basics, Specs and Finder are all
 * parts of the one product <form>, so a Save pressed on any of them still
 * posts every field. The gallery, 3D models and box contents save themselves
 * and sit outside that form, in the same tabs.
 *
 * Outside a <ProductTabs> every panel shows — the New product page uses the
 * same form with no tabs. */

export type ProductTab = "basics" | "media" | "specs" | "finder";

const TABS: { id: ProductTab; label: string }[] = [
  { id: "basics", label: "Basics" },
  { id: "media", label: "Photos & 3D" },
  { id: "specs", label: "Specs & box" },
  { id: "finder", label: "Finder quiz" },
];

const isTab = (v: unknown): v is ProductTab => TABS.some((t) => t.id === v);

const TabContext = createContext<ProductTab | null>(null);

export function ProductTabs({
  initialTab,
  children,
}: {
  initialTab?: string;
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState<ProductTab>(isTab(initialTab) ? initialTab : "basics");

  function select(next: ProductTab) {
    setTab(next);
    // Kept in the address so a reload lands back on the same tab.
    // replaceState, not a navigation: nothing refetches.
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <TabContext.Provider value={tab}>
      <Tabs
        value={tab}
        onValueChange={(v) => isTab(v) && select(v)}
        className="mb-4 max-w-2xl"
      >
        {/* Scrolls sideways rather than squeezing four labels into a phone. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="px-3">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      {/* A required field on a hidden tab can't show the browser's "please
          fill in" bubble, so Save would silently do nothing. Open its tab
          first, synchronously, so the browser can focus it. */}
      <div
        onInvalidCapture={(e) => {
          const owner = (e.target as HTMLElement).closest<HTMLElement>("[data-product-tab]");
          const target = owner?.dataset.productTab;
          if (isTab(target) && target !== tab) flushSync(() => select(target));
        }}
      >
        {children}
      </div>
    </TabContext.Provider>
  );
}

export function ProductTabPanel({
  tab,
  children,
  className,
}: {
  tab: ProductTab | ProductTab[];
  children: React.ReactNode;
  className?: string;
}) {
  const active = useContext(TabContext);
  const shown = active === null || (Array.isArray(tab) ? tab.includes(active) : tab === active);
  return (
    <div
      className={className}
      data-product-tab={Array.isArray(tab) ? tab[0] : tab}
      hidden={!shown}
    >
      {children}
    </div>
  );
}
