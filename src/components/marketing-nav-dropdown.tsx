import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

const SYS_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const INK = "#111110";
const BODY = "#6B6860";
const HOVER = "#F5F4F0";
const BORDER = "#E4E2DE";
const TEAL = "#00B4A8";
const LABEL = "#9E9B96";

export type NavMenuItem = { to: string; label: string; description?: string };
export type NavMenuSection = { label: string; items: NavMenuItem[] };

/** Product / Contractors dropdown menus — shared across marketing surfaces. */
export const PRODUCT_MENU: NavMenuSection[] = [
  {
    label: "Platform",
    items: [
      { to: "/products", label: "Product overview", description: "Everything Cleard runs for you" },
      { to: "/services", label: "Services", description: "Plan review, inspections, coordination" },
      { to: "/process", label: "How it works", description: "Intake to certificate of occupancy" },
    ],
  },
  {
    label: "Compare",
    items: [{ to: "/compare", label: "Cleard vs alternatives", description: "Side-by-side breakdowns" }],
  },
];

export const CONTRACTORS_MENU: NavMenuSection[] = [
  {
    label: "Get started",
    items: [
      { to: "/join", label: "Request access", description: "Invite-only onboarding" },
      { to: "/pricing", label: "Pricing", description: "À la carte and full-service" },
    ],
  },
  {
    label: "Resources",
    items: [
      { to: "/municipalities", label: "Coverage", description: "Where we submit" },
      { to: "/blog", label: "Blog", description: "Code and permitting updates" },
      { to: "/contact", label: "Contact", description: "Talk to the team" },
    ],
  },
];

export function MarketingNavDropdown({
  label,
  to,
  sections,
  triggerColor = BODY,
  triggerSize = 14,
}: {
  label: string;
  to: string;
  sections: NavMenuSection[];
  triggerColor?: string;
  triggerSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 90);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide} style={{ fontFamily: SYS_FONT }}>
      <Link
        to={to}
        className="inline-flex items-center gap-1 no-underline transition-opacity hover:opacity-70"
        style={{ color: triggerColor, fontSize: triggerSize, borderRadius: 0 }}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </Link>

      {open && (
        <div
          className="absolute left-0 top-full z-50 md-dropdown-fade"
          style={{
            marginTop: 0,
            minWidth: 268,
            background: "#FFFFFF",
            border: `1px solid ${BORDER}`,
            borderRadius: 0,
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            paddingBottom: 8,
            fontFamily: SYS_FONT,
          }}
        >
          {sections.map((section) => (
            <div key={section.label}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: LABEL,
                  padding: "12px 20px 4px",
                  borderRadius: 0,
                }}
              >
                {section.label}
              </div>
              {section.items.map((item) => (
                <DropdownItem key={item.to} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ item, onNavigate }: { item: NavMenuItem; onNavigate: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block no-underline"
      style={{
        padding: "10px 20px",
        fontSize: 14,
        fontWeight: 500,
        color: INK,
        background: hover ? HOVER : "#FFFFFF",
        borderRadius: 0,
        borderLeft: hover ? `3px solid ${TEAL}` : "3px solid transparent",
      }}
    >
      {item.label}
      {item.description && (
        <span className="block" style={{ fontSize: 12, fontWeight: 400, color: BODY, marginTop: 2 }}>
          {item.description}
        </span>
      )}
    </Link>
  );
}
