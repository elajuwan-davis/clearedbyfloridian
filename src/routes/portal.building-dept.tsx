import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { ExternalLink, Building2 } from "lucide-react";

export const Route = createFileRoute("/portal/building-dept")({
  head: () => ({
    meta: [
      { title: "Building Department Portals — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuildingDeptPage,
});

type Row = { name: string; url?: string; note?: string };

const MUNICIPALITIES: Row[] = [
  { name: "Coral Springs" },
  { name: "Greenacres" },
  { name: "Jupiter" },
  { name: "Palm Beach" },
  { name: "Wellington" },
  { name: "Palm Beach Gardens", url: "https://palmbeachgardensfl-energovweb.tylerhost.net/apps/SelfService#/home" },
  { name: "Fort Lauderdale" },
  { name: "City of Port St. Lucie", url: "https://county-taxes.net/sflucie/stlucie/property-tax/" },
  { name: "West Palm Beach" },
  { name: "Miramar", note: "No login required" },
  { name: "Boca Raton", note: "EHub Boca" },
  { name: "Pembroke Pines", note: "No login required" },
  { name: "Miami-Dade County" },
  { name: "Oakland Park" },
  { name: "Weston" },
  { name: "Wilton Manors" },
  { name: "Davie" },
  { name: "Martin County / Stuart" },
  { name: "Boynton Beach" },
  { name: "Royal Palm Beach" },
  { name: "Fort Myers" },
  { name: "Westlake", url: "https://cityviewportal.westlakegov.com/Permit/Locator" },
  { name: "Doral" },
  { name: "Parkland" },
  { name: "North Palm Beach" },
  { name: "Plantation", url: "https://aca.plantation.org/CitizenAccess/Default.aspx" },
  { name: "Tequesta" },
  { name: "Miami Beach", url: "https://energovcss.miamibeachfl.gov/energovprod/selfservice#/home" },
  { name: "Lighthouse Point" },
  { name: "County of PSL" },
];

function BuildingDeptPage() {
  const liveCount = MUNICIPALITIES.filter((m) => m.url).length;

  return (
    <PortalShell>
      <div className="space-y-8 max-w-5xl">
        <div>
          <div className="label-eyebrow">◇ Reference</div>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-obsidian">
            Building Department Portals
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {liveCount} of {MUNICIPALITIES.length} municipal portals linked. Additional links are being verified.
          </p>
        </div>

        <div className="border hairline overflow-hidden bg-background">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b hairline bg-secondary/40 label-eyebrow">
            <div className="col-span-7">Municipality</div>
            <div className="col-span-5 text-right">Portal Link</div>
          </div>
          <div className="divide-y">
            {MUNICIPALITIES.map((m) => (
              <div
                key={m.name}
                className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="col-span-7 flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-obsidian/60" strokeWidth={1.5} />
                  <div>
                    <div className="text-sm font-medium text-obsidian">{m.name}</div>
                    {m.note && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
                        {m.note}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-5 flex justify-end">
                  {m.url ? (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-sky/60 bg-sky/10 hover:bg-sky/20 text-obsidian px-3 py-1.5 rounded-[3px] font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
                    >
                      Open Portal
                      <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                    </a>
                  ) : (
                    <span className="inline-flex items-center border border-border bg-secondary/60 text-muted-foreground px-3 py-1.5 rounded-[3px] font-mono text-[11px] uppercase tracking-[0.12em]">
                      Link Coming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Need credentials for one of these portals? Cleared maintains logins on your behalf — request access from your account manager.
        </p>
      </div>
    </PortalShell>
  );
}
