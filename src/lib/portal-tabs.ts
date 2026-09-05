/**
 * Portal section tabs.
 *
 * The sidebar is flat — one click per top-level section. Every sub-destination
 * that used to be a sidebar sub-item now lives as a tab inside its section.
 * Routing is unchanged: each tab is a plain link to the page that already
 * exists, so functionality and data are untouched.
 */

export type SectionTab = {
  label: string;
  to: string;
  /** Optional query params (used by the Contacts type filters). */
  search?: Record<string, string>;
};

export type TabGroup = {
  key: string;
  /** Shown above the tab bar as the section name. */
  label: string;
  tabs: SectionTab[];
};

export const tabGroups: TabGroup[] = [
  {
    key: "permits",
    label: "Permits",
    tabs: [
      { label: "My Permits", to: "/portal/permits" },
      { label: "Project Guides", to: "/portal/guides" },
      { label: "Inspections", to: "/portal/inspections" },
      { label: "HOA Submittals", to: "/portal/hoa-submittals" },
      { label: "Bid Review", to: "/portal/bid-review" },
      { label: "Utility Locates", to: "/portal/utility-locates" },
      { label: "Portal Logins", to: "/building-dept-logins" },
    ],
  },
  {
    key: "lien-rights",
    label: "Compliance",
    tabs: [
      { label: "Documents", to: "/portal/lien-rights/documents" },
      { label: "Deadlines", to: "/portal/lien-rights/deadlines" },
      { label: "E-Recording", to: "/portal/lien-rights/e-recording" },
      { label: "Settings", to: "/portal/lien-rights/settings" },
    ],
  },
  {
    key: "contacts",
    label: "Contacts",
    tabs: [
      { label: "Subcontractors", to: "/portal/subcontractors" },
      { label: "Contacts", to: "/portal/contacts" },
      { label: "Insurance & COI", to: "/portal/request-coi" },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    tabs: [
      { label: "All Documents", to: "/portal/documents" },
      { label: "Compliance", to: "/portal/compliance" },
      { label: "Payment Authorization", to: "/forms/payment-authorization" },
      { label: "Billing", to: "/portal/billing" },
      { label: "Legal", to: "/legal" },
      { label: "Notary Queue", to: "/portal/notary-queue" },
    ],
  },
  {
    key: "financials",
    label: "Financials",
    tabs: [
      { label: "Savings", to: "/portal/financials" },
      { label: "Billing", to: "/portal/billing" },
      { label: "Permit Fees", to: "/portal/permit-fees" },
      { label: "Reports", to: "/portal/reports" },
    ],
  },
  {
    key: "messages",
    label: "Messages",
    tabs: [
      { label: "Inbox", to: "/messages" },
      { label: "Victoria Alerts", to: "/portal/alerts" },
    ],
  },
  {
    key: "resources",
    label: "Resources",
    tabs: [
      { label: "Blog", to: "/portal/blog" },
      { label: "Feature Requests", to: "/portal/feature-requests" },
      { label: "Marketplace", to: "/portal/marketplace" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    tabs: [
      { label: "Profile & Notifications", to: "/profile" },
      { label: "Company Profile", to: "/portal/company" },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    tabs: [
      { label: "Invite Pipeline", to: "/admin/invites" },
      { label: "Compliance Queue", to: "/admin/compliance" },
      { label: "Feature Access Requests", to: "/admin/feature-requests" },
      { label: "Staff Workload", to: "/admin/workload" },
      { label: "Audit Trail", to: "/admin/audit" },
      { label: "Pricing Tiers", to: "/admin/pricing" },
      { label: "CRMs", to: "/admin/crms" },
    ],
  },
];

function matches(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Find the tab group that owns the current pathname (longest match wins). */
export function groupForPath(pathname: string): TabGroup | null {
  let best: { len: number; group: TabGroup } | null = null;
  for (const group of tabGroups) {
    for (const tab of group.tabs) {
      if (matches(pathname, tab.to) && tab.to.length > (best?.len ?? 0)) {
        best = { len: tab.to.length, group };
      }
    }
  }
  return best?.group ?? null;
}

export function isTabActive(pathname: string, search: Record<string, unknown>, tab: SectionTab) {
  if (!matches(pathname, tab.to)) return false;
  if (!tab.search) return true;
  return Object.entries(tab.search).every(([k, v]) => String(search?.[k] ?? "") === v);
}

/** True when the current path is inside a group but no tab-specific query matches. */
export function hasQualifiedTab(group: TabGroup, pathname: string, search: Record<string, unknown>) {
  return group.tabs.some((t) => isTabActive(pathname, search, t));
}
