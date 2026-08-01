import { Link } from "@tanstack/react-router";

const TABS = [
  { to: "/admin/protection", label: "Protection" },
  { to: "/admin/utility-locates", label: "Utility Locates" },
] as const;

/** Subsection tab bar shared by the Admin operations subsections. */
export function AdminSubTabs() {
  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-obsidian/10 pb-3">
      {TABS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className="rounded-[3px] border border-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55 hover:bg-obsidian/[0.05]"
          activeProps={{ className: "border-obsidian/15 bg-obsidian text-white hover:bg-obsidian" }}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
