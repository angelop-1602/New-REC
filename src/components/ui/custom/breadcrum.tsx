"use client";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronsRight, Component, FileInput, User, Book, Home } from "lucide-react";
import { usePathname } from "next/navigation";

// Map your routes to friendly labels and icons
const BREADCRUMB_MAP: Record<
  string,
  { label: string; icon?: React.ReactNode }
> = {
  home: { label: "Home", icon: <Home className="h-4 w-4" /> },
  dashboard: { label: "Dashboard", icon: <Component className="h-4 w-4" /> },
  application: {
    label: "Protocol Application",
    icon: <FileInput className="h-4 w-4" />,
  },
  profile: { label: "Profile", icon: <User className="h-4 w-4" /> },
  protocols: { label: "Protocols", icon: <Book className="h-4 w-4" /> },
};

function getBreadcrumbItems(pathname: string) {
  // Example: "/rec/proponent/application/files"
  const segments = pathname.split("/").filter(Boolean);
  // Skip static prefixes, adjust if your structure is different!
  const relevant = segments.slice(2); // ["application", "files"]

  let href = "";
  const items = relevant.map((seg) => {
    href += `/${seg}`;
    const map = BREADCRUMB_MAP[seg];
    return {
      label:
        map?.label ??
        seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: `/rec/proponent${href}`,
      icon: map?.icon,
    };
  });

  // Always prepend Dashboard if not already there
  if (relevant.length > 0) {
    items.unshift({
      label: BREADCRUMB_MAP["home"].label,
      href: "/rec/proponent",
      icon: BREADCRUMB_MAP["home"].icon,
    });
  }
  return items;
}

export default function CustomBreadcrumbs() {
  const pathname = usePathname();
  const items = getBreadcrumbItems(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, idx) => (
          <React.Fragment key={item.href + item.label + idx}>
            <BreadcrumbItem>
              {idx === items.length - 1 ? (
                // Last item: current page
                <BreadcrumbPage>
                  <div className="flex items-center gap-2">
                    {item.icon} {item.label}
                  </div>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>
                  <div className="flex items-center gap-2">
                    {item.icon} {item.label}
                  </div>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {idx !== items.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronsRight />
              </BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
