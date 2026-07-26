import { Plane, MapPin, Wind, Waves, Home, History, Sparkles } from "lucide-react";
import type { DispatchResult } from "@/lib/dispatch";
import { dispatchSummary } from "@/lib/dispatch";

function fmtMoney(cents: number | null | undefined): string {
  if (!cents && cents !== 0) return "—";
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export function DispatchCard({
  data,
  onConfirm,
  confirmed,
  compact = false,
}: {
  data: DispatchResult;
  onConfirm?: () => void;
  confirmed?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="bg-white border border-obsidian/15 rounded-[3px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-obsidian text-white">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4" />
          <div className="font-mono text-[11px] uppercase tracking-[0.18em]">Dispatch</div>
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/50">
            Pre-Flight Property Intelligence
          </span>
        </div>
        {data.source === "mock" && (
          <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/50">
            Preview data
          </span>
        )}
      </div>

      {/* Victoria summary */}
      <div className="px-5 py-3 border-b border-obsidian/10 bg-sky/10 flex items-start gap-2">
        <Sparkles className="h-3.5 w-3.5 mt-0.5 text-obsidian/70 shrink-0" />
        <div className="text-sm text-obsidian/85 leading-relaxed">{dispatchSummary(data)}</div>
      </div>

      {/* Grid */}
      <div className={`grid ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"} gap-0 divide-y sm:divide-y-0 sm:divide-x divide-obsidian/10`}>
        <Cell icon={<MapPin className="h-3.5 w-3.5" />} label="Jurisdiction">
          <div className="text-sm text-obsidian font-medium">{data.jurisdiction.name}</div>
          <div className="text-xs text-obsidian/60">{data.jurisdiction.county}</div>
          <div className="text-xs text-obsidian/50">{data.jurisdiction.department}</div>
        </Cell>

        <Cell icon={<Waves className="h-3.5 w-3.5" />} label="Flood Zone">
          <div className="text-sm text-obsidian font-medium">
            {data.flood.zone}
            {data.flood.sfha && (
              <span className="ml-2 inline-flex items-center bg-amber-100 text-amber-900 rounded-[3px] px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em]">
                SFHA
              </span>
            )}
          </div>
          <div className="text-xs text-obsidian/60">
            {data.flood.base_flood_elevation_ft != null
              ? `BFE ${data.flood.base_flood_elevation_ft} ft`
              : "No BFE"}
          </div>
          {data.flood.firm_panel && (
            <div className="text-[10px] font-mono text-obsidian/50">FIRM {data.flood.firm_panel}</div>
          )}
        </Cell>

        <Cell icon={<Wind className="h-3.5 w-3.5" />} label="Design Wind Speed">
          <div className="text-sm text-obsidian font-medium">{data.wind.design_wind_speed_mph} mph</div>
          <div className="text-xs text-obsidian/60">Exposure {data.wind.exposure_category} · ASCE 7</div>
          {data.wind.hvhz && (
            <span className="inline-flex items-center bg-red-100 text-red-900 rounded-[3px] px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] mt-1">
              HVHZ
            </span>
          )}
        </Cell>

        <Cell icon={<Home className="h-3.5 w-3.5" />} label="Parcel (FL DOR)">
          <div className="text-[10px] font-mono text-obsidian/70">{data.parcel.parcel_id ?? "—"}</div>
          <div className="text-xs text-obsidian/60">
            Built {data.parcel.year_built ?? "—"} · {data.parcel.living_area_sqft?.toLocaleString() ?? "—"} sqft
          </div>
          <div className="text-xs text-obsidian/60">Assessed {fmtMoney(data.parcel.assessed_value_cents)}</div>
          {data.parcel.owner_name && (
            <div className="text-xs text-obsidian/70">Owner: {data.parcel.owner_name}</div>
          )}
        </Cell>
      </div>

      {/* Permit history */}
      <div className="border-t border-obsidian/10 px-5 py-3">
        <div className="flex items-center gap-2 mb-2">
          <History className="h-3.5 w-3.5 text-obsidian/70" />
          <div className="eyebrow text-obsidian/50">Permit History</div>
        </div>
        {data.permit_history.length === 0 ? (
          <div className="text-xs text-obsidian/50 italic">No prior permits on record for this parcel.</div>
        ) : (
          <div className="divide-y divide-obsidian/5">
            {data.permit_history.map((p) => (
              <div key={p.permit_number} className="py-2 flex items-center justify-between gap-3 text-xs">
                <div className="font-mono text-obsidian/70">{p.permit_number}</div>
                <div className="flex-1 text-obsidian/70 truncate">{p.work_description}</div>
                <div className="text-obsidian/50 shrink-0">{p.issued_date}</div>
                <div className="text-obsidian/50 shrink-0">{p.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {onConfirm && (
        <div className="border-t border-obsidian/10 px-5 py-3 flex items-center justify-end gap-3 bg-obsidian/[0.02]">
          {confirmed && (
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-700">
              Confirmed
            </span>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 bg-obsidian text-white rounded-[3px] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
          >
            {confirmed ? "Re-confirm & Continue" : "Confirm & Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

function Cell({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 space-y-1">
      <div className="flex items-center gap-1.5 text-obsidian/50 font-mono text-[10px] uppercase tracking-[0.14em]">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}
