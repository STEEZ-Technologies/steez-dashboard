"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_ITEMS } from "./nav-items";
import { useT } from "@/lib/i18n/provider";

type SearchResult = {
  products: { id: string; name: string; model: string }[];
  categories: { id: string; label: string }[];
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ products: [], categories: [] });
  const router = useRouter();
  const { dict } = useT();
  const NAV_LABEL_KEY: Record<string, keyof typeof dict.nav> = {
    "/": "overview",
    "/products": "products",
    "/categories": "categories",
    "/analytics": "analytics",
    "/team": "team",
    "/settings": "settings",
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], categories: [] });
      return;
    }
    const id = setTimeout(() => {
      fetch(`/api/dashboard-search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then(setResults)
        .catch(() => setResults({ products: [], categories: [] }));
    }, 200);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">{dict.actions.search}</span>
        <kbd className="ml-1 hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={dict.command.placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{dict.command.empty}</CommandEmpty>
          {(results.products.length > 0 || results.categories.length > 0) && (
            <>
              <CommandGroup heading={dict.command.products}>
                {results.products.map((p) => (
                  <CommandItem
                    key={p.id}
                    onSelect={() => go(`/products/${p.id}/edit`)}
                    value={`${p.name} ${p.model}`}
                  >
                    {p.name}
                    <span className="ml-auto text-xs text-muted-foreground">{p.model}</span>
                  </CommandItem>
                ))}
                {results.categories.map((c) => (
                  <CommandItem
                    key={c.id}
                    onSelect={() => go(`/categories/${c.id}/edit`)}
                    value={c.label}
                  >
                    {c.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          <CommandGroup heading={dict.command.navigate}>
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => go(item.href)}
                value={dict.nav[NAV_LABEL_KEY[item.href]] ?? item.label}
              >
                <item.icon className="size-4" />
                {dict.nav[NAV_LABEL_KEY[item.href]] ?? item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={dict.command.create}>
            <CommandItem onSelect={() => go("/products/new")} value="new product">
              <Plus className="size-4" />
              {dict.actions.newProduct}
            </CommandItem>
            <CommandItem onSelect={() => go("/categories/new")} value="new category">
              <Plus className="size-4" />
              {dict.actions.newCategory}
            </CommandItem>
            <CommandItem onSelect={() => go("/team")} value="invite member">
              <Plus className="size-4" />
              {dict.nav.team}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
