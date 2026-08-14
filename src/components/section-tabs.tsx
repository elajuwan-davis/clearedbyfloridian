/**
 * SectionTabs — the single tab-bar pattern used by every portal section.
 *
 * Rendered once by the portal shell directly under the top bar, so all sections
 * share identical tab styling and position. Tabs are links to the existing
 * routes; nothing about data or routing logic changes.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { groupForPath, isTabActive, hasQualifiedTab } from "@/lib/portal-tabs";

export function SectionTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });

  const group = groupForPath(pathname);
  if (!group || group.tabs.length < 2) return null;

  const qualified = hasQualifiedTab(group, pathname, search ?? {});

  return (
    <div
      className="sticky top-12 z-20 w-full overflow-x-auto"
      style={{
        backgroundColor: "var(--p-topbar)",
        borderBottom: "1px solid var(--p-border)",
      }}
    >
      <nav className="flex min-w-max items-center px-3 sm:px-4 lg:px-6" aria-label={`${group.label} sections`}>
        {group.tabs.map((tab, i) => {
          const active = qualified
            ? isTabActive(pathname, search ?? {}, tab)
            : // No query-qualified match (e.g. /portal/contacts with no ?type):
              // highlight the first tab that owns this path.
              group.tabs.findIndex((t) => pathname === t.to || pathname.startsWith(`${t.to}/`)) === i;

          return (
            <Link
              key={`${tab.to}-${tab.label}`}
              to={tab.to as never}
              search={(tab.search ?? {}) as never}
              className="whitespace-nowrap transition-[color,border-color] duration-150"
              style={{
                fontSize: 13,
                padding: "10px 20px",
                borderRadius: 0,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
                borderBottom: `2px solid ${active ? "var(--teal, #00B4A8)" : "transparent"}`,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
