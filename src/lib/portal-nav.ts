// Shared portal navigation model: icon rail sections + their flyout sub-pages.

import {
  LayoutDashboard,
  Bookmark,
  FileText,
  DollarSign,
  FolderOpen,
  MessageSquare,
  ShieldCheck,
  Scale,
  CreditCard,
  CalendarDays,
  Settings,
  HardHat,
  KeyRound,
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
  to: "/dashboard",
};

export const bookmarksSection: NavSection = {
  key: "bookmarks",
  label: "Bookmarks",
  icon: Bookmark,
  to: "/portal/bookmarks",
};

export const calendarSection: NavSection = {
  key: "calendar",
  label: "Calendar",
  icon: CalendarDays,
  to: "/portal/calendar",
};

export const billingSection: NavSection = {
  key: "billing",
  label: "Billing",
  icon: CreditCard,
  to: "/portal/billing",
};

export const permitsSection: NavSection = {
  key: "permits",
  label: "My Permits",
  icon: FileText,
  to: "/portal/permits",
};

export const messagesSection: NavSection = {
  key: "messages",
  label: "Messages",
  icon: MessageSquare,
  to: "/messages",
};

/** Portal Logins is a tab elsewhere; a trial plan gets it as its own entry. */
export const portalLoginsSection: NavSection = {
  key: "portal-logins",
  label: "Portal Logins",
  icon: KeyRound,
  to: "/building-dept-logins",
};

/**
 * Flat sidebar — one click per section. Every former sub-item now lives as a
 * tab inside its section page (see src/lib/portal-tabs.ts).
 */
export const navSections: NavSection[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { key: "permits", label: "My Permits", icon: FileText, to: "/portal/permits" },
  { key: "portal-logins", label: "Portal Logins", icon: KeyRound, to: "/building-dept-logins" },
  { key: "inspections", label: "Inspections", icon: CalendarDays, to: "/portal/inspections" },
  {
    key: "documents",
    label: "Documents",
    icon: FolderOpen,
    to: "/portal/documents",
    items: [
      { to: "/portal/documents", label: "All Documents" },
      { to: "/portal/compliance", label: "Compliance" },
      { to: "/portal/contacts", label: "Contacts" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    icon: DollarSign,
    to: "/portal/financials",
    items: [
      { to: "/portal/financials", label: "Financials" },
      { to: "/portal/calendar", label: "Calendar" },
    ],
  },
  { key: "messages", label: "Messages", icon: MessageSquare, to: "/messages" },
];

export const legalSection: NavSection = {
  key: "legal",
  label: "Legal",
  icon: Scale,
  items: [{ to: "/legal", label: "Document Library" }],
};

export const adminSection: NavSection = {
  key: "admin",
  label: "Admin",
  icon: ShieldCheck,
  to: "/admin/invites",
};

export const settingsSection: NavSection = {
  key: "settings",
  label: "Settings",
  icon: Settings,
  items: [
    { to: "/profile", label: "Profile & Notifications" },
    { to: "/portal/company", label: "Company Profile" },
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
  items: [{ to: "/profile", label: "Profile" }],
};

/**
 * Trial (self-serve) plan: the five places such an account can actually do
 * something — file its own permits, keep its own portal credentials, talk to
 * Cleard, and manage its account. Everything else is gated
 * (see TRIAL_PATHS in src/lib/plan-access.ts).
 */
export const trialNavSections: NavSection[] = [
  dashboardSection,
  permitsSection,
  portalLoginsSection,
  messagesSection,
];

/**
 * Client view (Flōridian): the five places a GC client works out of. Used when
 * the view-mode toggle is set to the client side.
 */
export const CLIENT_NAV_SECTIONS: NavSection[] = [
  permitsSection,
  {
    key: "inspections",
    label: "Inspections",
    icon: CalendarDays,
    to: "/portal/inspections",
  },
  {
    key: "documents",
    label: "Compliance",
    icon: FolderOpen,
    to: "/portal/documents",
  },
  messagesSection,
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    to: "/portal/settings",
  },
];

/** Collapsed 7-item staff rail: sub-pages are grouped under Documents/Finance. */
export const ADMIN_NAV_SECTIONS: NavSection[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { key: "permits", label: "My Permits", icon: FileText, to: "/portal/permits" },
  { key: "portal-logins", label: "Portal Logins", icon: KeyRound, to: "/building-dept-logins" },
  { key: "inspections", label: "Inspections", icon: CalendarDays, to: "/portal/inspections" },
  {
    key: "documents",
    label: "Compliance",
    icon: FolderOpen,
    to: "/portal/documents",
    items: [
      { to: "/portal/documents", label: "All Documents" },
      { to: "/portal/lien-rights/documents", label: "Statutory Documents" },
      { to: "/portal/contacts", label: "Contacts" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    icon: DollarSign,
    to: "/portal/financials",
    items: [
      { to: "/portal/financials", label: "Financials" },
      { to: "/portal/calendar", label: "Calendar" },
    ],
  },
  { key: "messages", label: "Messages", icon: MessageSquare, to: "/messages" },
];

export function sectionsForRole(role: AppRole | null, isAdmin: boolean): NavSection[] {
  if (role === "subcontractor") return subNavSections;
  // Admin tools stay reachable alongside the collapsed set.
  return isAdmin ? [...ADMIN_NAV_SECTIONS, adminSection] : navSections;
}

/** Flat sidebar entry for Settings (sub-pages live as tabs on the page). */
export const sidebarSettingsSection: NavSection = {
  key: "settings",
  label: "Settings",
  icon: Settings,
  to: "/profile",
};

/** Same page, named for what a self-serve account goes there to do. */
export const accountInfoSection: NavSection = {
  ...sidebarSettingsSection,
  label: "Account Info",
};

export function sidebarSettingsForRole(role: AppRole | null): NavSection {
  return role === "subcontractor" ? { ...sidebarSettingsSection } : sidebarSettingsSection;
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
  const all = [
    ...navSections,
    billingSection,
    calendarSection,
    legalSection,
    adminSection,
    settingsSection,
    ...subNavSections,
  ];
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
  return last.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
