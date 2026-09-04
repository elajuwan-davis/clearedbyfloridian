// Certificate of Occupancy checklist progress. Isolated from co-checklist.ts so
// the rule can load under tsx without the Supabase client.
//
// `issued` is true only when every item is complete — that flag fires the
// celebration notification, so a false positive would tell a GC they have a
// CO they do not have.

export const CO_ITEMS: { key: string; label: string }[] = [
  { key: "final_structural", label: "Final structural inspection passed" },
  { key: "final_electrical", label: "Final electrical inspection passed" },
  { key: "final_plumbing", label: "Final plumbing inspection passed" },
  { key: "final_mechanical", label: "Final mechanical / HVAC inspection passed" },
  { key: "final_pool_spa", label: "Final pool / spa inspection passed" },
  { key: "trade_signoffs", label: "All trade sign-offs received" },
  { key: "corrections_resolved", label: "All permit corrections resolved" },
  { key: "lien_releases_filed", label: "Lien releases filed (all subs)" },
  { key: "noc_recorded", label: "NOC recorded with county clerk" },
  { key: "hoa_deposit_refunded", label: "HOA damage deposit refunded (if applicable)" },
  { key: "co_issued", label: "CO issued by municipality" },
];

export function coProgress(items: { complete: boolean }[]): {
  done: number;
  total: number;
  percent: number;
  issued: boolean;
} {
  const total = items.length || CO_ITEMS.length;
  const done = items.filter((i) => i.complete).length;
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
    issued: total > 0 && done === total,
  };
}
