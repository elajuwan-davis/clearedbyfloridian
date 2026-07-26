// Dispatch — pre-flight property intelligence.
//
// Runs on address entry during Pre-Check intake and surfaces jurisdiction,
// flood zone, wind speed, parcel/owner/year built/assessed value, and any
// prior permit history *before* documents are uploaded.
//
// Live data sources will be wired by backend later:
//   - Jurisdiction: FGDL / county GIS point-in-polygon
//   - Flood zone / BFE: FEMA National Flood Hazard Layer (NFHL)
//   - Wind speed: ASCE 7 hazard tool (700yr MRI)
//   - Parcel / owner / year built / assessed: FL DOR NAL, county PAPA
//   - Permit history: county permit search (varies)
//
// For now this returns deterministic mock data keyed off the address so the
// UI can render immediately and the persisted intake_payload.dispatch field
// keeps a stable shape across environments.

export type DispatchFloodZone = "AE" | "X" | "VE" | "A" | "AO" | "D" | "X (shaded)";

export type DispatchPriorPermit = {
  permit_number: string;
  issued_date: string;    // yyyy-mm-dd
  work_description: string;
  status: string;
};

export type DispatchResult = {
  address: string;
  fetched_at: string;
  source: "mock" | "live";
  jurisdiction: {
    name: string;              // e.g. "City of West Palm Beach"
    county: string;            // e.g. "Palm Beach County"
    department: string;        // e.g. "Building Department"
    portal_url?: string;
  };
  flood: {
    zone: DispatchFloodZone;
    sfha: boolean;                 // Special Flood Hazard Area
    base_flood_elevation_ft: number | null;
    firm_panel: string | null;     // e.g. "12099C0975F"
  };
  wind: {
    design_wind_speed_mph: number; // 700yr MRI per ASCE 7
    exposure_category: "B" | "C" | "D";
    hvhz: boolean;                 // High Velocity Hurricane Zone
  };
  parcel: {
    parcel_id: string | null;
    owner_name: string | null;
    year_built: number | null;
    assessed_value_cents: number | null;
    living_area_sqft: number | null;
  };
  permit_history: DispatchPriorPermit[];
};

/** Cheap deterministic hash so mock output stays stable per address. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FLOOD_ZONES: DispatchFloodZone[] = ["X", "X", "X", "AE", "AE", "VE", "X (shaded)"];

/**
 * Return mock dispatch data for an address. Deterministic — the same address
 * always yields the same result so the UI is stable across renders.
 *
 * Backend will replace this with a server function that calls FEMA NFHL,
 * FL DOR NAL, and county PAPA endpoints; the return shape stays identical.
 */
export function runDispatch(input: {
  address: string;
  city?: string | null;
  county?: string | null;
}): DispatchResult {
  const key = `${input.address}|${input.city ?? ""}|${input.county ?? ""}`.toLowerCase();
  const h = hash(key);

  const county = (input.county && input.county.trim()) || "Palm Beach County";
  const city = (input.city && input.city.trim()) || "West Palm Beach";
  const isHVHZ = /miami-dade|broward/i.test(county);

  const zone = FLOOD_ZONES[h % FLOOD_ZONES.length];
  const sfha = zone === "AE" || zone === "VE" || zone === "A" || zone === "AO";
  const bfe = sfha ? 7 + ((h >> 3) % 8) : null;

  const windBase = isHVHZ ? 175 : 165;
  const windSpeed = windBase + ((h >> 5) % 15);

  const parcelId = [
    String((h >> 2) % 90 + 10).padStart(2, "0"),
    String((h >> 6) % 90 + 10).padStart(2, "0"),
    String((h >> 10) % 90 + 10).padStart(2, "0"),
    String((h >> 14) % 90 + 10).padStart(2, "0"),
    String((h >> 18) % 9000 + 1000),
  ].join("-");

  const yearBuilt = 1965 + ((h >> 7) % 55);
  const assessed = 450_000_00 + ((h >> 11) % 2_500_000) * 100;
  const livingArea = 2200 + ((h >> 9) % 3800);

  const priorCount = (h >> 13) % 4; // 0-3
  const permit_history: DispatchPriorPermit[] = [];
  const kinds = [
    { desc: "Re-roof (asphalt shingle to metal)", status: "Closed" },
    { desc: "Pool equipment replacement", status: "Closed" },
    { desc: "Electrical service upgrade 200A", status: "Closed" },
    { desc: "Impact window replacement", status: "Closed" },
    { desc: "HVAC changeout", status: "Final Inspection" },
  ];
  for (let i = 0; i < priorCount; i++) {
    const k = kinds[(h + i) % kinds.length];
    const year = 2018 + (((h >> (i + 2)) % 7));
    permit_history.push({
      permit_number: `B${year}-${String(((h >> (i + 4)) % 90000) + 10000)}`,
      issued_date: `${year}-${String(((h >> (i + 5)) % 12) + 1).padStart(2, "0")}-15`,
      work_description: k.desc,
      status: k.status,
    });
  }

  return {
    address: input.address,
    fetched_at: new Date().toISOString(),
    source: "mock",
    jurisdiction: {
      name: `City of ${city}`,
      county,
      department: "Building Department",
    },
    flood: {
      zone,
      sfha,
      base_flood_elevation_ft: bfe,
      firm_panel: sfha ? `12099C${String(((h >> 8) % 9000) + 1000)}F` : null,
    },
    wind: {
      design_wind_speed_mph: windSpeed,
      exposure_category: isHVHZ ? "D" : "C",
      hvhz: isHVHZ,
    },
    parcel: {
      parcel_id: parcelId,
      owner_name: null,
      year_built: yearBuilt,
      assessed_value_cents: assessed,
      living_area_sqft: livingArea,
    },
    permit_history,
  };
}

export function dispatchSummary(d: DispatchResult): string {
  return `Dispatch complete — ${d.jurisdiction.name}, Flood Zone ${d.flood.zone}, design wind speed ${d.wind.design_wind_speed_mph} mph.`;
}
