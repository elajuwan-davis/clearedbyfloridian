// Dispatch — pre-flight property intelligence.
//
// Calls the live dispatch-flood-zone and dispatch-parcel edge functions for
// real FEMA flood zone and PAPA parcel data. Falls back to deterministic mock
// data if either call fails (e.g., functions not deployed or upstream APIs
// unavailable) so the UI always has a stable shape.

export type DispatchFloodZone = "AE" | "X" | "VE" | "A" | "AO" | "D" | "X (shaded)";

export type DispatchPriorPermit = {
  permit_number: string;
  issued_date: string;
  work_description: string;
  status: string;
};

export type DispatchResult = {
  address: string;
  fetched_at: string;
  source: "mock" | "live";
  jurisdiction: {
    name: string;
    county: string;
    department: string;
    portal_url?: string;
  };
  flood: {
    zone: DispatchFloodZone;
    sfha: boolean;
    base_flood_elevation_ft: number | null;
    firm_panel: string | null;
  };
  wind: {
    design_wind_speed_mph: number;
    exposure_category: "B" | "C" | "D";
    hvhz: boolean;
  };
  parcel: {
    parcel_id: string | null;
    owner_name: string | null;
    year_built: number | null;
    assessed_value_cents: number | null;
    living_area_sqft: number | null;
    /** Which system answered: 'papa', 'fdor_statewide', 'unavailable', or null for mock. */
    source?: string | null;
    /** Tax roll the valuation came from — the statewide source is a roll behind. */
    assessment_year?: number | null;
  };
  permit_history: DispatchPriorPermit[];
};

const env = import.meta as any;
const SUPABASE_URL =
  env?.env?.VITE_SUPABASE_URL ??
  env?.env?.SUPABASE_URL ??
  (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);

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

function buildMock(input: {
  address: string;
  city: string | null;
  county: string;
}): DispatchResult {
  const key = `${input.address}|${input.city ?? ""}|${input.county}`.toLowerCase();
  const h = hash(key);

  const county = input.county.trim() || "Palm Beach County";
  const city = (input.city && input.city.trim()) || "West Palm Beach";
  const isHVHZ = /miami-dade|broward/i.test(county);

  const zone = FLOOD_ZONES[h % FLOOD_ZONES.length];
  const sfha = zone === "AE" || zone === "VE" || zone === "A" || zone === "AO";
  const bfe = sfha ? 7 + ((h >> 3) % 8) : null;

  const windBase = isHVHZ ? 175 : 165;
  const windSpeed = windBase + ((h >> 5) % 15);

  const parcelId = [
    String(((h >> 2) % 90) + 10).padStart(2, "0"),
    String(((h >> 6) % 90) + 10).padStart(2, "0"),
    String(((h >> 10) % 90) + 10).padStart(2, "0"),
    String(((h >> 14) % 90) + 10).padStart(2, "0"),
    String(((h >> 18) % 9000) + 1000),
  ].join("-");

  const yearBuilt = 1965 + ((h >> 7) % 55);
  const assessed = 450_000_00 + ((h >> 11) % 2_500_000) * 100;
  const livingArea = 2200 + ((h >> 9) % 3800);

  const priorCount = (h >> 13) % 4;
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
    const year = 2018 + ((h >> (i + 2)) % 7);
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

export async function runDispatch(input: {
  address: string;
  city?: string | null;
  county?: string | null;
}): Promise<DispatchResult> {
  const county = (input.county ?? "Palm Beach County").replace(/\s*county\s*$/i, "").trim();
  const city = input.city?.trim() ?? "";

  const base = SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    return buildMock({ address: input.address, city, county });
  }

  try {
    const [floodResp, parcelResp] = await Promise.all([
      fetch(
        `${base}/functions/v1/dispatch-flood-zone?address=${encodeURIComponent(input.address)}`,
      ).catch(() => null),
      fetch(
        `${base}/functions/v1/dispatch-parcel?address=${encodeURIComponent(input.address)}&county=${encodeURIComponent(county)}`,
      ).catch(() => null),
    ]);

    let flood: {
      flood_zone?: string;
      in_sfha?: boolean;
      base_flood_elev?: number | null;
      fetched_at?: string;
    } | null = null;
    let parcel: {
      parcel_id?: string | null;
      owner_name?: string | null;
      year_built?: number | null;
      assessed_value?: number | string | null;
      living_area_sqft?: number | null;
      parcel_source?: string | null;
      assessment_year?: number | null;
      fetched_at?: string;
    } | null = null;

    if (floodResp && floodResp.ok) {
      flood = await floodResp.json();
    } else if (floodResp) {
      const body = await floodResp.text().catch(() => "");
      console.warn(`[runDispatch] dispatch-flood-zone returned ${floodResp.status}:`, body);
    }

    if (parcelResp && parcelResp.ok) {
      parcel = await parcelResp.json();
    } else if (parcelResp) {
      const body = await parcelResp.text().catch(() => "");
      console.warn(`[runDispatch] dispatch-parcel returned ${parcelResp.status}:`, body);
    }

    if (!flood || !parcel) {
      console.warn("[runDispatch] falling back to mock — one or both live calls failed");
      return buildMock({ address: input.address, city, county });
    }

    const fetchedAt = new Date().toISOString();

    return {
      ...buildMock({ address: input.address, city, county }),
      source: "live",
      fetched_at: fetchedAt,
      flood: {
        zone: (flood?.flood_zone as DispatchFloodZone) ?? "X",
        sfha: flood?.in_sfha ?? false,
        base_flood_elevation_ft: flood?.base_flood_elev ?? null,
        firm_panel: null,
      },
      parcel: {
        parcel_id: parcel?.parcel_id ?? null,
        owner_name: parcel?.owner_name ?? null,
        year_built: parcel?.year_built ?? null,
        // The appraiser reports whole dollars; the UI counts in cents.
        assessed_value_cents:
          parcel?.assessed_value == null ? null : Math.round(Number(parcel.assessed_value) * 100),
        living_area_sqft: parcel?.living_area_sqft ?? null,
        source: parcel?.parcel_source ?? null,
        assessment_year: parcel?.assessment_year ?? null,
      },
    };
  } catch (err) {
    console.warn("[runDispatch] exception calling live functions:", err);
    return buildMock({ address: input.address, city, county });
  }
}

export function dispatchSummary(d: DispatchResult): string {
  return `Dispatch complete — ${d.jurisdiction.name}, Flood Zone ${d.flood.zone}, design wind speed ${d.wind.design_wind_speed_mph} mph.`;
}
