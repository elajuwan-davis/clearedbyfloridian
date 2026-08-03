import { AlertTriangle, ShieldAlert } from "lucide-react";
import { complianceFlags, type GcCompanyProfile } from "@/lib/gc-company";
import { Link } from "@tanstack/react-router";

export function CompanyComplianceBanner({ profile }: { profile: GcCompanyProfile }) {
  const flags = complianceFlags(profile);
  if (flags.length === 0) return null;

  const blocked = flags.filter((f) => f.level === "blocked");
  const warned = flags.filter((f) => f.level === "warn");
  const isBlocking = blocked.length > 0;

  return (
    <div
      className={`mb-6 rounded-[3px] border p-4 sm:p-5 flex items-start gap-3 ${
        isBlocking ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
      }`}
    >
      {isBlocking ? (
        <ShieldAlert className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
      ) : (
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <div
          className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
            isBlocking ? "text-red-700" : "text-amber-800"
          }`}
        >
          {isBlocking ? "Action Required — Permit Submission Blocked" : "Compliance Warning"}
        </div>
        <ul className={`mt-2 space-y-1 text-sm ${isBlocking ? "text-red-800" : "text-amber-900"}`}>
          {[...blocked, ...warned].map((f, i) => (
            <li key={i}>{f.label}</li>
          ))}
        </ul>
        <Link
          to="/portal/company"
          className={`inline-flex items-center mt-3 min-h-[44px] px-3 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] border ${
            isBlocking
              ? "border-red-400 text-red-700 hover:bg-red-100"
              : "border-amber-400 text-amber-800 hover:bg-amber-100"
          }`}
        >
          Update Company Profile
        </Link>
      </div>
    </div>
  );
}
