import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ExternalLink, type LucideIcon, Calculator, CreditCard, Scale, Users, Ruler, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Cleard" },
      {
        name: "description",
        content:
          "Curated partners for Cleard builders — insurance, bookkeeping, no-PG business cards, legal, and payroll.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketplacePage,
});

type Partner = {
  name: string;
  description: string;
  url: string;
  cta?: string;
};

type Section = {
  label: string;
  icon: LucideIcon;
  partners: Partner[];
  placeholder?: boolean;
};

const SECTIONS: Section[] = [
  {
    label: "Insurance",
    icon: ShieldCheck,
    partners: [
      {
        name: "Harper Insurance",
        description: "Specialized coverage for contractors and construction professionals.",
        url: "https://www.harperinsure.com/",
        cta: "Visit Harper Insurance",
      },
      {
        name: "WithCoverage",
        description: "Modern brokerage purpose-built for construction — GL, WC, Builders Risk.",
        url: "https://www.withcoverage.com/",
        cta: "Visit WithCoverage",
      },
    ],
  },
  {
    label: "Bookkeeping & Accounting",
    icon: Calculator,
    partners: [
      {
        name: "Debit & Co.",
        description: "Bookkeeping provider for construction firms and residential builders.",
        url: "https://www.debitandco.com/",
        cta: "Learn More",
      },
      {
        name: "Puzzle.io",
        description: "Accounting automation that closes your books in real time.",
        url: "https://puzzle.io/",
        cta: "Learn More",
      },
    ],
  },
  {
    label: "No Personal Guarantee Business Cards",
    icon: CreditCard,
    partners: [
      {
        name: "Ramp",
        description: "Corporate cards and spend management — construction program available.",
        url: "https://ramp.com/",
        cta: "Learn More",
      },
      {
        name: "Flex",
        description: "Charge card and working capital built for owner-operators.",
        url: "https://flex.one/",
        cta: "Learn More",
      },
      {
        name: "Bill Spend & Expense",
        description: "Corporate cards with real-time budgets and expense management.",
        url: "https://www.bill.com/product/spend-and-expense",
        cta: "Learn More",
      },
      {
        name: "Stash",
        description: "Business charge card with rewards — no personal guarantee required.",
        url: "https://www.getstash.com/",
        cta: "Learn More",
      },
      {
        name: "Mercury",
        description: "Business banking and IO cards for growing companies.",
        url: "https://mercury.com/",
        cta: "Learn More",
      },
      {
        name: "Rho",
        description: "Corporate cards, banking, and AP automation for finance teams.",
        url: "https://www.rho.co/",
        cta: "Learn More",
      },
      {
        name: "Rippling",
        description: "Spend management with corporate cards, bill pay, and reimbursements.",
        url: "https://www.rippling.com/spend",
        cta: "Learn More",
      },
    ],
  },
  {
    label: "Takeoff",
    icon: Ruler,
    partners: [
      {
        name: "Handoff AI",
        description: "AI-powered construction takeoff.",
        url: "https://www.handoff.ai/",
        cta: "Visit",
      },
    ],
  },
  {
    label: "Project Management | CRM",
    icon: Briefcase,
    partners: [
      {
        name: "JobTread",
        description: "Job management and CRM built for contractors.",
        url: "https://www.jobtread.com/",
        cta: "Visit",
      },
    ],
  },
  {
    label: "Legal",
    icon: Scale,
    partners: [],
    placeholder: true,
  },
  {
    label: "Payroll",
    icon: Users,
    partners: [
      {
        name: "Gusto",
        description: "Full-service payroll built for small business.",
        url: "https://gusto.com/",
        cta: "Visit",
      },
    ],
  },
];

function MarketplacePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="border-b border-obsidian/10 pb-8">
        <div className="eyebrow text-obsidian/50">Curated Partners</div>
        <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Marketplace</h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-obsidian/65 leading-relaxed">
          A short list of providers we trust — insurance, back office, capital, and more.
          Each partner is vetted for how they serve residential builders.
        </p>
      </div>

      <div className="mt-10 space-y-14">
        {SECTIONS.map((section) => (
          <section key={section.label}>
            <div className="flex items-center gap-2 mb-5">
              <section.icon className="h-3.5 w-3.5 text-obsidian/60" strokeWidth={1.5} />
              <h2
                className="font-mono text-[11px] uppercase tracking-[0.22em] font-bold"
                style={{ color: "var(--obsidian)" }}
              >
                {section.label}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.placeholder ? (
                <PlaceholderCard />
              ) : (
                section.partners.map((p) => <PartnerCard key={p.name} partner={p} />)
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/45 leading-relaxed">
        Partners listed here are independent companies. Cleard receives no compensation for
        referrals. All service decisions rest with the client and provider.
      </p>
    </div>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="flex flex-col p-5 rounded-[3px] border border-obsidian/12 bg-white">
      <div className="font-display text-xl text-obsidian font-semibold">{partner.name}</div>
      <p className="mt-2 text-[13px] text-obsidian/70 leading-relaxed flex-1">
        {partner.description}
      </p>
      <div className="mt-5">
        <Button
          asChild
          size="sm"
          className="w-full rounded-[3px] gap-2 bg-obsidian text-paper hover:bg-obsidian/90"
        >
          <a href={partner.url} target="_blank" rel="noopener noreferrer">
            {partner.cta ?? "Learn More"}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function PlaceholderCard() {
  return (
    <div className="flex flex-col p-5 rounded-[3px] border border-obsidian/10 bg-obsidian/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="font-display text-xl text-obsidian/40 font-semibold">Partner TBA</div>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1 rounded-[3px] border border-obsidian/15 text-obsidian/50"
        >
          Coming Soon
        </span>
      </div>
      <p className="mt-2 text-[13px] text-obsidian/40 leading-relaxed flex-1">
        We're finalizing a partner in this category. Check back soon.
      </p>
      <div className="mt-5 h-9" aria-hidden />
    </div>
  );
}
