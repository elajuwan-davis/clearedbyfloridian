import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { FileText, Users, CreditCard, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/forms")({
  head: () => ({ meta: [{ title: "Forms — Cleard" }, { name: "robots", content: "noindex" }] }),
  component: FormsIndex,
});

const forms = [
  {
    to: "/forms/permit-intake",
    code: "01",
    title: "Permit Intake",
    body: "Open a new permit. Project details, scope, valuation, contractor & owner information, and required documents.",
    icon: FileText,
  },
  {
    to: "/forms/subcontractor-intake",
    code: "02",
    title: "Subcontractor Intake",
    body: "Add a subcontractor to an active project. Trade, license, contact, and trade valuation.",
    icon: Users,
  },
  {
    to: "/forms/payment-authorization",
    code: "03",
    title: "Payment Authorization",
    body: "Authorize Cleard to charge a card or ACH on file for services and permit fees.",
    icon: CreditCard,
  },
] as const;

function FormsIndex() {
  return (
    <PortalShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50">Form Submissions</div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Forms</h1>
          <p className="mt-3 max-w-2xl text-sm text-obsidian/55">
            Permit intake, subcontractor intake, and payment authorization. Drafts save automatically.
          </p>
        </div>

        <ul className="mt-10 grid gap-px bg-obsidian/10 border border-obsidian/15 rounded-[3px] overflow-hidden sm:grid-cols-1">
          {forms.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.to} className="bg-white">
                <Link
                  to={f.to}
                  className="flex items-start gap-5 p-6 sm:p-8 group hover:bg-paper-warm transition-colors"
                >
                  <div className="h-10 w-10 grid place-items-center border border-obsidian/15 rounded-[3px] shrink-0">
                    <Icon className="h-4 w-4 text-obsidian" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/50">
                      Form / {f.code}
                    </div>
                    <div className="display-serif text-2xl mt-1 text-obsidian">{f.title}</div>
                    <p className="mt-2 text-sm text-obsidian/60 max-w-2xl">{f.body}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-obsidian/35 group-hover:text-obsidian transition-colors shrink-0 mt-2" strokeWidth={1.5} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </PortalShell>
  );
}
