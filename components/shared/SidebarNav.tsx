"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/analytics", label: "Analytics" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-1 md:flex-col md:gap-1.5">
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            data-active={active}
            className="dash-navlink"
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
