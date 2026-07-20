export type Municipality = { name: string; url?: string; note?: string; phone?: string };



export const MUNICIPALITIES: Municipality[] = [
  { name: "Coral Springs", url: "https://etrakit.coralsprings.gov/etrakit/" },
  { name: "Greenacres", url: "https://portal.greenacresfl.gov/", note: "Need to register in their office" },
  { name: "Jupiter", url: "https://cds.jupiter.fl.us/EnerGov_Prod/selfservice/JupiterFLProd", note: "Log-in details not working" },
  { name: "Palm Beach", url: "https://eden.townofpalmbeach.com/Default.aspx?Build=PM.PermitsHome&ShowLogon=ShowLogon" },
  { name: "Wellington", url: "https://wellingtonfl-energovweb.tylerhost.net/apps/SelfService", phone: "(561) 791-4000" },
  { name: "Palm Beach Gardens", url: "https://palmbeachgardensfl-energovweb.tylerhost.net/apps/SelfService#/home" },
  { name: "Fort Lauderdale", url: "https://aca-prod.accela.com/FTL/Login.aspx" },
  { name: "City of Port St. Lucie", url: "https://pandapublicweb.cityofpsl.com/SignIn/StatusPermit.aspx?Tab=SubmitTab&View=Permits", phone: "(772) 871-5132" },
  { name: "West Palm Beach", url: "https://permit-planner.wpb.org/" },
  { name: "Miramar", url: "https://mss.miramarfl.gov/css/default.aspx", note: "No login required" },
  { name: "Boca Raton", url: "https://www.bocaehub.com", note: "Uses EHub Boca system" },
  { name: "Pembroke Pines", url: "https://pembrokepinesfl-energovweb.tylerhost.net/apps/selfservice", note: "No login required" },
  { name: "Miami-Dade County", url: "https://www.miamidade.gov/Apps/RER/EPSPortal" },
  { name: "Oakland Park", url: "https://cityofoaklandparkfl.tylerportico.com/portal/launcher/" },
  { name: "Weston", url: "https://aca-prod.accela.com/WESTON/Login.aspx" },
  { name: "Wilton Manors", url: "https://www.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=125" },
  { name: "Davie", url: "https://esuite.davie-fl.gov/eSuite.Permits/AdvancedSearchPage/AdvancedSearch.aspx" },
  { name: "Martin County / Stuart", url: "https://aca-prod.accela.com/MARTINCO/Default.aspx", phone: "(772) 288-5916" },
  { name: "Palm Beach County", url: "https://discover.pbcgov.org/pzb/Pages/PermitTrackingSystem.aspx", phone: "(561) 233-5100" },
  { name: "Indian River County", url: "https://ircgov.com/community-development/", phone: "(772) 226-1260" },
  { name: "Boynton Beach", url: "https://www.sagesgov.com/boyntonbeach-fl" },
  { name: "Royal Palm Beach", url: "https://click2gov.royalpalmbeach.com/Click2GovBP/index.html" },
  { name: "Fort Myers", url: "https://cdservices.cityftmyers.com/energovprod/selfservice" },
  { name: "Westlake", url: "https://cityviewportal.westlakegov.com/Permit/Locator", phone: "(561) 472-5100" },
  { name: "Doral", url: "https://doralfl-energovweb.tylerhost.net/apps/SelfService" },
  { name: "Parkland", url: "https://www.mgoconnect.org/cp/portal" },
  { name: "North Palm Beach", url: "https://www.mgoconnect.org/cp/portal", note: "Select North Palm Beach on login", phone: "(561) 841-3380" },
  { name: "Plantation", url: "https://aca.plantation.org/CitizenAccess/Default.aspx", phone: "(954) 797-2200" },
  { name: "Tequesta", url: "https://bsaonline.com/Account/LogOn?uid=2607" },
  { name: "Miami Beach", url: "https://energovcss.miamibeachfl.gov/energovprod/selfservice#/home" },
  { name: "Lighthouse Point", url: "https://ci-lighthousepoint-fl.smartgovcommunity.com/" },
  { name: "County of PSL", url: "https://www.stlucieco.gov/departments-and-services/planning-and-development-services/energov-online-platform", phone: "(772) 871-5132" },
  { name: "St. Lucie County", url: "https://www.stlucieco.gov/departments-and-services/planning-and-development-services/energov-online-platform", phone: "(772) 462-1553" },

];

/** Find the best matching municipality portal URL for a given address string. */
export function findPortalForAddress(address: string): Municipality | undefined {
  if (!address) return undefined;
  const lower = address.toLowerCase();
  // Prefer longest name match to avoid "Palm Beach" catching "Palm Beach Gardens" etc.
  const candidates = MUNICIPALITIES
    .filter((m) => lower.includes(m.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length);
  if (candidates[0]) return candidates[0];

  // Common aliases
  const aliases: Array<[RegExp, string]> = [
    [/\bnorth palm beach\b/, "North Palm Beach"],
    [/\bwest palm beach\b/, "West Palm Beach"],
    [/\bpalm beach gardens\b/, "Palm Beach Gardens"],
    [/\broyal palm beach\b/, "Royal Palm Beach"],
    [/\bport st\.?\s*lucie\b/, "City of Port St. Lucie"],
    [/\bstuart\b/, "Martin County / Stuart"],
    [/\bfort pierce\b/, "St. Lucie County"],

  ];
  for (const [re, name] of aliases) {
    if (re.test(lower)) {
      const m = MUNICIPALITIES.find((x) => x.name === name);
      if (m) return m;
    }
  }
  return undefined;
}
