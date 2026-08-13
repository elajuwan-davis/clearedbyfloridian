import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, ShieldCheck } from "lucide-react";
import { SubcontractorsManager } from "@/components/subcontractors-manager";
import { SubsComplianceView } from "@/components/subs-compliance-view";
import { Segmented } from "@/components/ui-kit";

export const Route = createFileRoute("/portal/subcontractors/")({
  head: () => ({
    meta: [
      { title: "Subcontractors & Compliance — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubcontractorsAndCompliance,
});

function SubcontractorsAndCompliance() {
  const [active, setActive] = useState<"subs" | "compliance">("subs");

  return (
    <div>
      <div className="px-4 pt-4 sm:px-6">
        <Segmented
          value={active}
          onChange={setActive}
          options={[
            {
              value: "subs",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" strokeWidth={1.75} /> Subcontractors
                </span>
              ),
            },
            {
              value: "compliance",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Compliance & COI
                </span>
              ),
            },
          ]}
        />
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

