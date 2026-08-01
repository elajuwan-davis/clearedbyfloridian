// Shared portal navigation model: icon rail sections + their flyout sub-pages.

import {
  LayoutDashboard,
  Bookmark,
  FileText,
  Users,
  DollarSign,
  FolderOpen,
  BookOpen,
  ClipboardCheck,

  ShieldCheck,
  Settings,
  HardHat,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/lib/use-session";

export type AlertKey = "my-permits" | "request-coi" | "sub-insurance";
export type NavLink = { to: string; label: string; alertKey?: AlertKey; divider?: boolean };
export type NavSection = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Direct destination when the section has no sub-items. */
  to?: string;
  items?: NavLink[];
};

export const dashboardSection: NavSection = {
  key: "dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
  items: [
    { to: "/dashboard", label: "Overview" },
    { to: "/portal/alerts", label: "Victoria Alerts" },
    { to: "/messages", label: "Messages" },
  ],
};

export const bookmarksSection: NavSection = {
  key: "bookmarks",
  label: "Bookmarks",
  icon: Bookmark,
  to: "/portal/bookmarks",
};

export const complianceSection: NavSection = {
  key: "compliance-top",
  label: "Compliance",
  icon: ClipboardCheck,
  to: "/compliance",
};

export const navSections: NavSection[] = [
  dashboardSection,
  bookmarksSection,
  complianceSection,

  {
    key: "permits",
    label: "Permits",
    icon: FileText,
    items: [
      { to: "/portal/permits", label: "My Permits", alertKey: "my-permits" },
      { to: "/portal/permits/new", label: "New Permit" },
      { to: "/portal/submissions", label: "Submissions" },
      { to: "/portal/inspections", label: "Inspections" },
      { to: "/portal/hoa-submittals", label: "HOA Submittals" },
      { to: "/portal/bid-review", label: "Bid Review" },
    ],
  },
  {
    key: "people",
    label: "People",
    icon: Users,
    items: [
      { to: "/portal/contacts", label: "Contacts" },
      { to: "/forms/subcontractors", label: "Subcontractors" },
      { to: "/portal/compliance", label: "Compliance" },
      { to: "/portal/request-coi", label: "Request COI", alertKey: "request-coi" },
      { to: "/portal/request-sub-insurance", label: "Sub Insurance", alertKey: "sub-insurance" },
    ],
  },
  {
    key: "financials",
    label: "Financials",
    icon: DollarSign,
    items: [
      { to: "/portal/financials", label: "Financial Overview" },
      { to: "/portal/permit-fees", label: "Permit Fees" },
      { to: "/invoices", label: "Invoices" },
      { to: "/fee-calculator", label: "Savings Calculator" },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    icon: FolderOpen,
    items: [
      { to: "/forms/payment-authorization", label: "Payment Authorization" },
      { to: "/portal/building-dept", label: "Building Departments" },
      { to: "/building-dept-logins", label: "Portal Logins" },
      { to: "/portal/notary-queue", label: "Notary Queue" },
    ],
  },
  {
    key: "resources",
    label: "Resources",
    icon: BookOpen,
    items: [
      { to: "/portal/guides", label: "Project Guides" },
      { to: "/municipalities", label: "Municipalities" },
      { to: "/ask-victoria", label: "Ask Victoria" },
      { to: "/portal/reports", label: "Reports" },
      { to: "/portal/blog", label: "Blog" },
      { to: "/portal/feature-requests", label: "Feature Requests" },
      { to: "/portal/marketplace", label: "Marketplace" },
    ],
  },
];


export const adminSection: NavSection = {
  key: "admin",
  label: "Admin",
  icon: ShieldCheck,
  items: [
    { to: "/admin/invites", label: "Invite Pipeline" },
    { to: "/admin/review-queue", label: "Review Queue" },
    { to: "/admin/activity", label: "Activity Log" },
    { to: "/admin/access-requests", label: "Access Requests" },
    { to: "/admin/gc-clients", label: "GC Clients" },
    { to: "/admin/protection", label: "Protection", divider: true },
    { to: "/admin/utility-locates", label: "Utility Locates" },
  ],
};


export const settingsSection: NavSection = {
  key: "settings",
  label: "Settings",
  icon: Settings,
  items: [
    { to: "/profile", label: "Profile & Notifications" },
    { to: "/portal/contacts", label: "Contacts" },
    { to: "/portal/bookmarks", label: "Bookmarks" },
  ],
};

export const subNavSections: NavSection[] = [
  bookmarksSection,
  { key: "sub-projects", label: "My Projects", icon: HardHat, to: "/sub-portal" },
  {
    key: "sub-compliance",
    label: "Compliance",
    icon: ShieldCheck,
    items: [{ to: "/profile", label: "Documents" }],
  },
];

export const subSettingsSection: NavSection = {
  key: "settings",
  label: "Settings",
  icon: Settings,
  items: [
    { to: "/profile", label: "Profile" },
    { to: "/portal/bookmarks", label: "Bookmarks" },
  ],
};

export function sectionsForRole(role: AppRole | null, isAdmin: boolean): NavSection[] {
  if (role === "subcontractor") return subNavSections;
  return isAdmin ? [...navSections, adminSection] : navSections;
}

export function settingsForRole(role: AppRole | null): NavSection {
  return role === "subcontractor" ? subSettingsSection : settingsSection;
}

export function isItemActive(pathname: string, to: string) {
  if (to === "/portal") return pathname === "/portal" || pathname === "/portal/";
  return pathname === to || pathname.startsWith(to + "/");
}

/** Best-effort human label for an arbitrary portal path (used by bookmarks). */
export function labelForPath(pathname: string): string {
  const all = [...navSections, adminSection, settingsSection, ...subNavSections];
  let best: { len: number; label: string } | null = null;
  for (const s of all) {
    const entries: Array<{ to: string; label: string }> = s.to
      ? [{ to: s.to, label: s.label }]
      : (s.items ?? []).map((i) => ({ to: i.to, label: i.label }));
    for (const e of entries) {
      if (isItemActive(pathname, e.to) && e.to.length > (best?.len ?? 0)) {
        best = { len: e.to.length, label: e.label };
      }
    }
  }
  if (best) return best.label;
  const last = pathname.split("/").filter(Boolean).pop() ?? "Page";
  return last
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
