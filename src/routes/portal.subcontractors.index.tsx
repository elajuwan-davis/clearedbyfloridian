import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, ShieldCheck } from "lucide-react";
import { SubcontractorsManager } from "@/components/subcontractors-manager";
import { SubsComplianceView } from "@/components/subs-compliance-view";

export const Route = createFileRoute("/portal/subcontractors/")({
  head: () => ({
    meta: [
      { title: "Subcontractors & Compliance — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubcontractorsAndCompliance,
});

const TABS = [
  { key: "subs" as const, label: "Subcontractors", icon: Users },
  { key: "compliance" as const, label: "Compliance & COI", icon: ShieldCheck },
];

function SubcontractorsAndCompliance() {
  const [active, setActive] = useState<"subs" | "compliance">("subs");

  return (
    <div>
      <div className="flex gap-1 border-b border-obsidian/10 px-4 sm:px-6" role="tablist">
        {TABS.map((t) => {
          const on = active === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.key)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                on
                  ? "border-current text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {t.label}
            </button>
          );
        })}
      </div>

      {active === "subs" ? (
        <SubcontractorsManager />
      ) : (
        <div className="px-4 py-4 sm:px-6">
          <SubsComplianceView />
        </div>
      )}
    </div>
  );
}
