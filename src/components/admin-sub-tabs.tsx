import { Link, useRouterState } from "@tanstack/react-router";

const TABS = [
  { to: "/admin/protection", label: "Protection" },
  { to: "/admin/utility-locates", label: "Utility Locates" },
] as const;

/**
 * Subsection tab bar shared by the Admin operations subsections. Compact
 * segmented control designed to live in a PageShell toolbar row.
 */
export function AdminSubTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="p-seg" role="tablist">
      {TABS.map((t) => (
        <Link key={t.to} to={t.to} role="tab" data-active={pathname.startsWith(t.to)}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
