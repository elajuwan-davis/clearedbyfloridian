export type County = {
  slug: string;
  /** Display name without the word "County". */
  name: string;
  /** How the county is referred to in copy, e.g. "Miami-Dade County". */
  label: string;
  region: string;
  seats: string;
  /** One-line, county-specific note. Replace with real local copy when available. */
  note: string;
};

export const COUNTIES: County[] = [
  {
    slug: "miami-dade",
    name: "Miami-Dade",
    label: "Miami-Dade County",
    region: "Southeast Florida",
    seats: "Miami, Coral Gables, Hialeah, Homestead",
    note: "High-volume review queues and HVHZ product-approval requirements on nearly every submittal.",
  },
  {
    slug: "broward",
    name: "Broward",
    label: "Broward County",
    region: "Southeast Florida",
    seats: "Fort Lauderdale, Hollywood, Pembroke Pines",
    note: "Dozens of municipal building departments, each with its own intake rules and portals.",
  },
  {
    slug: "palm-beach",
    name: "Palm Beach",
    label: "Palm Beach County",
    region: "Southeast Florida",
    seats: "West Palm Beach, Boca Raton, Jupiter",
    note: "Heavy custom-residential and pool work across county and municipal jurisdictions.",
  },
  {
    slug: "martin",
    name: "Martin",
    label: "Martin County",
    region: "Treasure Coast",
    seats: "Stuart, Palm City, Hobe Sound",
    note: "Waterfront and environmental review layers on top of standard building permits.",
  },
  {
    slug: "st-lucie",
    name: "St. Lucie",
    label: "St. Lucie County",
    region: "Treasure Coast",
    seats: "Port St. Lucie, Fort Pierce",
    note: "Fast-growing residential volume with long municipal review cycles at peak.",
  },
  {
    slug: "indian-river",
    name: "Indian River",
    label: "Indian River County",
    region: "Treasure Coast",
    seats: "Vero Beach, Sebastian",
    note: "Smaller departments where a single reviewer absence can stall a project for a week.",
  },
  {
    slug: "sarasota",
    name: "Sarasota",
    label: "Sarasota County",
    region: "Southwest Florida",
    seats: "Sarasota, Venice, North Port",
    note: "Coastal construction control line and flood requirements on shoreline work.",
  },
  {
    slug: "collier",
    name: "Collier",
    label: "Collier County",
    region: "Southwest Florida",
    seats: "Naples, Marco Island, Immokalee",
    note: "Luxury residential scopes with layered zoning, HOA and county approvals.",
  },
  {
    slug: "orange",
    name: "Orange",
    label: "Orange County",
    region: "Central Florida",
    seats: "Orlando, Winter Garden, Apopka",
    note: "Dense permit volume across county and city jurisdictions in the Orlando metro.",
  },
  {
    slug: "hillsborough",
    name: "Hillsborough",
    label: "Hillsborough County",
    region: "Tampa Bay",
    seats: "Tampa, Plant City, Temple Terrace",
    note: "Multi-trade residential and commercial work split across three city departments.",
  },
  {
    slug: "duval",
    name: "Duval",
    label: "Duval County",
    region: "Northeast Florida",
    seats: "Jacksonville, Jacksonville Beach",
    note: "Consolidated city-county permitting with heavy new-construction throughput.",
  },
  {
    slug: "lee",
    name: "Lee",
    label: "Lee County",
    region: "Southwest Florida",
    seats: "Fort Myers, Cape Coral, Bonita Springs",
    note: "Sustained rebuild and remodel demand keeping review queues full.",
  },
  {
    slug: "pinellas",
    name: "Pinellas",
    label: "Pinellas County",
    region: "Tampa Bay",
    seats: "St. Petersburg, Clearwater, Largo",
    note: "Two dozen municipalities in a small footprint, each with separate submittal rules.",
  },
  {
    slug: "leon",
    name: "Leon",
    label: "Leon County",
    region: "North Florida",
    seats: "Tallahassee",
    note: "Growing residential activity with limited in-house plan review capacity.",
  },
  {
    slug: "escambia",
    name: "Escambia",
    label: "Escambia County",
    region: "Northwest Florida",
    seats: "Pensacola",
    note: "Panhandle wind-load and coastal requirements on most residential scopes.",
  },
];

export function findCounty(slug: string): County | undefined {
  return COUNTIES.find((c) => c.slug === slug);
}
