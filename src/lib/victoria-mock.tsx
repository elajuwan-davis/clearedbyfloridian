// Shared Victoria canned answers + inline bold renderer.
// Used by the full /ask-victoria page and the floating Ask Victoria dock.

export function mockReply(q: string): string {
  const t = q.toLowerCase();

  const COUNTIES_ANSWER =
    "Cleard services **five Florida counties**:\n\n" +
    "• **Broward** — Fort Lauderdale, Hollywood, Pompano Beach, Coral Springs, Davie, Pembroke Pines, Miramar, Hallandale Beach\n" +
    "• **Palm Beach** — West Palm Beach, Boca Raton, Delray Beach, Boynton Beach, Jupiter, Palm Beach Gardens, Wellington, North Palm Beach, Palm Beach, Westlake\n" +
    "• **Martin** — Stuart, Hobe Sound, Jensen Beach, Palm City\n" +
    "• **St. Lucie** — Port St. Lucie, Fort Pierce\n" +
    "• **Indian River** — Vero Beach, Sebastian";

  const FEES_ANSWER =
    "Cleard invoices two line items at submittal:\n\n" +
    "• **Permitting Fee** — construction value × **1.5%**\n" +
    "• **Private Provider & Admin Fee** — flat **$8,856**\n\n" +
    "Using a private provider also entitles the project to up to a **50% reduction** in county permit fees under FS §553.791 and HB 803.";

  const TIMELINES_ANSWER =
    "Statutory timelines on every Cleard project:\n\n" +
    "• **10 business days** — private provider plan review\n" +
    "• **10 business days** — county to issue the permit after affidavit is filed (permit-or-cite under FS §553.791)\n" +
    "• **48 hours** — correction window after a failed inspection\n" +
    "• **2 business days** — county to issue the Certificate of Occupancy after the final certificate of compliance is filed";

  const SERVICES_ANSWER =
    "Cleard provides, under **FS §553.791**:\n\n" +
    "• Private provider **plan review**\n" +
    "• Private provider **inspections** — structural, MEP, gas, and pool\n" +
    "• **Permit submittal and tracking** across all five service counties\n" +
    "• Real-time virtual inspections with a 48-hour correction window";

  const cityMatch = [
    "fort lauderdale","hollywood","pompano","coral springs","davie","pembroke pines","miramar","hallandale",
    "west palm","boca raton","delray","boynton","jupiter","palm beach gardens","wellington","north palm beach","westlake","palm beach",
    "stuart","hobe sound","jensen beach","palm city",
    "port st. lucie","port st lucie","fort pierce","st. lucie","st lucie",
    "vero beach","sebastian","indian river",
    "broward","martin",
  ].some((c) => t.includes(c));

  if (t.includes("county") || t.includes("counties") || t.includes("service area") || t.includes("where") || t.includes("coverage") || t.includes("jurisdiction") || t.includes("location") || t.includes("cities"))
    return COUNTIES_ANSWER;

  if (t.includes("fee") || t.includes("cost") || t.includes("price") || t.includes("pricing") || t.includes("how much") || t.includes("invoice") || t.includes("admin fee") || t.includes("1.5") || t.includes("8856") || t.includes("8,856"))
    return FEES_ANSWER;

  if (t.includes("timeline") || t.includes("how long") || t.includes("turnaround") || t.includes("deadline") || t.includes("days") || t.includes("10 business") || t.includes("review time"))
    return TIMELINES_ANSWER;

  if (t.includes("553.791") || t.includes("private provider") || t.includes("hb 803"))
    return "Under **FS §553.791**, Cleard acts as a licensed private provider performing plan review and inspections in lieu of the local building official. The county must reduce the permit fee accordingly — **up to 50%** when both plan review and inspections are handled privately (HB 803, eff. Jul 1 2026). Statutory clock: **10 business days** for the county to issue the permit after the affidavit of intent is filed, and **2 business days** for the CO after the final certificate of compliance.";

  if (t.includes("inspection"))
    return "Cleard performs **real-time virtual inspections** — structural, MEP, gas, and pool — with a **48-hour correction window**. If an inspection fails, findings are posted to the project record and the trade has 48 hours to remediate before re-inspection.";

  if (t.includes("co") || t.includes("certificate of occupancy") || t.includes("compliance"))
    return "Once the final certificate of compliance is filed by the private provider, the local building official has **2 business days** to issue the Certificate of Occupancy on a residential project (§553.791(11)).";

  if (t.includes("service") || t.includes("what do you do") || t.includes("offer") || t.includes("scope"))
    return SERVICES_ANSWER;

  if (cityMatch)
    return COUNTIES_ANSWER;

  if (t.includes("contact") || t.includes("email") || t.includes("reach") || t.includes("get started") || t.includes("sign up") || t.includes("onboard"))
    return "Cleard is available **exclusively to GC clients of Cleard**. For onboarding or project submittals, reach the team at **permits@floridianinc.com**.";

  if (t.includes("who") && (t.includes("you") || t.includes("cleared") || t.includes("victoria")))
    return "I'm **Victoria**, the AI permitting assistant for **Cleard** — Cleard's private-provider permitting arm under FS §553.791. I can answer questions about our service counties, fees, statutory timelines, and inspection process. Ask me anything about a project in Broward, Palm Beach, Martin, St. Lucie, or Indian River County.";

  return "I can answer questions about **Cleard** — our five service counties (Broward, Palm Beach, Martin, St. Lucie, Indian River), private-provider services under FS §553.791, statutory timelines (10 / 10 / 48hr / 2 business days), and fees (1.5% + $8,856 flat at submittal). What would you like to know?";
}

/** Lightweight **bold** renderer — keeps editorial polish without a markdown dep. */
export function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-obsidian">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
