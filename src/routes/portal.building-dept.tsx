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
  { name: "Coral Springs", url: "https://etrakit.coralsprings.gov/etrakit/" },
  { name: "Greenacres", url: "https://portal.greenacresfl.gov/", note: "Need to register in their office" },
  { name: "Jupiter", url: "https://cds.jupiter.fl.us/EnerGov_Prod/selfservice/JupiterFLProd", note: "Log-in details not working" },
  { name: "Palm Beach", url: "https://eden.townofpalmbeach.com/Default.aspx?Build=PM.PermitsHome&ShowLogon=ShowLogon" },
  { name: "Wellington", url: "https://wellingtonfl-energovweb.tylerhost.net/apps/SelfService" },
  { name: "Palm Beach Gardens", url: "https://palmbeachgardensfl-energovweb.tylerhost.net/apps/SelfService#/home" },
  { name: "Fort Lauderdale", url: "https://aca-prod.accela.com/FTL/Login.aspx" },
  { name: "City of Port St. Lucie", url: "https://county-taxes.net/stlucie/stlucie/property-tax/", note: "Property search link" },
  { name: "West Palm Beach", url: "https://permit-planner.wpb.org/" },
  { name: "Miramar", url: "https://mss.miramarfl.gov/css/default.aspx", note: "No login required" },
  { name: "Boca Raton", url: "https://www.bocaehub.com", note: "Uses EHub Boca system" },
  { name: "Pembroke Pines", url: "https://pembrokepinesfl-energovweb.tylerhost.net/apps/selfservice", note: "No login required" },
  { name: "Miami-Dade County", url: "https://www.miamidade.gov/Apps/RER/EPSPortal" },
  { name: "Oakland Park", url: "https://cityofoaklandparkfl.tylerportico.com/portal/launcher/" },
  { name: "Weston", url: "https://aca-prod.accela.com/WESTON/Login.aspx" },
  { name: "Wilton Manors", url: "https://www.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=125" },
  { name: "Davie", url: "https://esuite.davie-fl.gov/eSuite.Permits/AdvancedSearchPage/AdvancedSearch.aspx" },
  { name: "Martin County / Stuart", url: "https://aca-prod.accela.com/MARTINCO/Default.aspx" },
  { name: "Boynton Beach", url: "https://www.sagesgov.com/boyntonbeach-fl" },
  { name: "Royal Palm Beach", url: "https://click2gov.royalpalmbeach.com/Click2GovBP/index.html" },
  { name: "Fort Myers", url: "https://cdservices.cityftmyers.com/energovprod/selfservice" },
  { name: "Westlake", url: "https://cityviewportal.westlakegov.com/Permit/Locator" },
  { name: "Doral", url: "https://doralfl-energovweb.tylerhost.net/apps/SelfService" },
  { name: "Parkland", url: "https://www.mgoconnect.org/cp/portal" },
  { name: "North Palm Beach", url: "https://www.mgoconnect.org/cp/portal", note: "Select North Palm Beach on login" },
  { name: "Plantation", url: "https://aca.plantation.org/CitizenAccess/Default.aspx" },
  { name: "Tequesta", url: "https://bsaonline.com/Account/LogOn?uid=2607" },
  { name: "Miami Beach", url: "https://energovcss.miamibeachfl.gov/energovprod/selfservice#/home" },
  { name: "Lighthouse Point", url: "https://ci-lighthousepoint-fl.smartgovcommunity.com/" },
  { name: "County of PSL", url: "https://www.stlucieco.gov/departments-and-services/planning-and-development-services/energov-online-platform" },
];


function BuildingDeptPage() {
  const liveCount = MUNICIPALITIES.filter((m) => m.url).length;
  const showNotes = MUNICIPALITIES.some((m) => m.note);

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
            <div className="col-span-4">Municipality</div>
            {showNotes ? (
              <>
                <div className="col-span-5">Notes</div>
                <div className="col-span-3 text-right">Portal Link</div>
              </>
            ) : (
              <div className="col-span-8 text-right">Portal Link</div>
            )}
          </div>
          <div className="divide-y">
            {MUNICIPALITIES.map((m) => (
              <div
                key={m.name}
                className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-obsidian/60" strokeWidth={1.5} />
                  <div className="text-sm font-medium text-obsidian">{m.name}</div>
                </div>
                {showNotes && (
                  <div className="col-span-5 text-xs text-muted-foreground">
                    {m.note ? (
                      <span className="italic">{m.note}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </div>
                )}
                <div className={`${showNotes ? "col-span-3" : "col-span-8"} flex justify-end`}>
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
