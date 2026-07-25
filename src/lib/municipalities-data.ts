// Statewide Florida municipality hierarchy: Region → County → City

export type Region = "Northwest" | "Northeast" | "Central" | "South";

export type CityEntry = {
  name: string;
  portalUrl?: string;
};

export type CountyEntry = {
  name: string;
  cities: CityEntry[];
};

export type RegionEntry = {
  name: Region;
  counties: CountyEntry[];
};

const c = (name: string, portalUrl?: string): CityEntry => ({ name, portalUrl });

export const MUNICIPALITY_TREE: RegionEntry[] = [
  {
    name: "Northwest",
    counties: [
      "Washington","Bay","Calhoun","Escambia","Franklin","Gadsden","Gulf","Holmes",
      "Jackson","Jefferson","Leon","Liberty","Okaloosa","Santa Rosa","Wakulla","Walton",
    ].map((n) => ({ name: n, cities: [] })),
  },
  {
    name: "Northeast",
    counties: [
      { name: "Duval", cities: ["Jacksonville","Atlantic Beach","Neptune Beach","Baldwin","Jacksonville Beach"].map((x) => c(x)) },
      { name: "Nassau", cities: ["Nassau County","Hilliard","Callahan"].map((x) => c(x)) },
      { name: "Flagler", cities: ["Bunnell","Palm Coast","Flagler County","Beverly Beach","Flagler Beach"].map((x) => c(x)) },
      { name: "Alachua", cities: ["High Springs","Newberry","LaCrosse","Waldo","Gainesville","Alachua","Archer","Hawthorne","Micanopy"].map((x) => c(x)) },
      { name: "Marion", cities: ["Belleview","Marion County","Ocala","McIntosh","Reddick","Dunnellon"].map((x) => c(x)) },
      { name: "Volusia", cities: ["Ponce Inlet","Holly Hill","Daytona Beach","Ormond Beach","Daytona Beach Shores","DeBary","New Smyrna Beach","Oak Hill","Edgewater","Deltona","DeLand","Lake Helen","Pierson","Orange City","South Daytona","Port Orange","Volusia County"].map((x) => c(x)) },
    ],
  },
  {
    name: "Central",
    counties: [
      { name: "Orange", cities: ["Apopka","Orlando","Winter Park","Maitland","Belle Isle","Orange County","Ocoee","Winter Garden","Edgewood","Bay Lake","Windermere","Oakland"].map((x) => c(x)) },
      { name: "Seminole", cities: ["Winter Springs","Longwood","Lake Mary","Sanford","Altamonte Springs","Casselberry","Oviedo","Seminole County"].map((x) => c(x)) },
      { name: "Osceola", cities: ["Kissimmee","St Cloud","Osceola County"].map((x) => c(x)) },
      { name: "Lake", cities: ["Lady Lake","Eustis","Fruitland Park","Umatilla","Mt. Dora","Howey In The Hills","Tavares","Leesburg","Oakland","Mascotte","Minneola","Astatula","Groveland","Clermont","Monteverde","Lake County"].map((x) => c(x)) },
      { name: "Polk", cities: ["Frostproof","Polk County","Lake Wales","Ft. Meade","Mulberry","Highland Park","Dundee","Lakeland","Bartow","Eagle Lake","Haines City","Winterhaven","Auburndale","Lake Alfred","Davenport","Polk City","Lake Hamilton"].map((x) => c(x)) },
      { name: "Brevard", cities: ["Titusville","Rockledge","Satellite Beach","Cocoa Beach","Cape Canaveral","Cocoa","Palm Bay","West Melbourne","Indian Harbour Beach","Melbourne","Malabar","Indialantic","Grant","Melbourne Beach","Palm Shores","Brevard County"].map((x) => c(x)) },
      { name: "Hillsborough", cities: ["Tampa","Temple Terrace","Hillsborough County","Plant City","Odessa"].map((x) => c(x)) },
      { name: "Pinellas", cities: ["Seminole","Treasure Island","Pinellas Park","Madeira Beach","Redington Shores","St Pete Beach","Indian Shores","Largo","Indian Rocks Beach","Clearwater","Belleair","Dunedin","Oldsmar","Tarpon Springs","Safety Harbor","Kenneth City","St. Petersburg","Gulfport","South Pasadena","Redington Beach","Belleair Beach","Belleair Bluffs","North Redington Beach","Pinellas County"].map((x) => c(x)) },
      { name: "Pasco", cities: ["New Port Richey","Port Richey","San Antonio","St. Leo","Dade City","Zephyrhills","Pasco County"].map((x) => c(x)) },
      { name: "Hernando", cities: ["Weeki Wachee","Brooksville","Hernando County"].map((x) => c(x)) },
      { name: "Citrus", cities: ["Crystal River","Inverness","Citrus County"].map((x) => c(x)) },
      { name: "Manatee", cities: ["Holmes Beach","Bradenton","Longboat Key","Bradenton Beach","Anna Maria","Manatee County","Palmetto"].map((x) => c(x)) },
      { name: "Sarasota", cities: ["Sarasota County","North Port","City of Sarasota","Venice"].map((x) => c(x)) },
      { name: "Charlotte", cities: ["Charlotte County","Punta Gorda"].map((x) => c(x)) },
      { name: "Lee", cities: ["Ft Myers","Cape Coral","Bonita Springs","Ft Myers Beach","Estero","Lee County","Sanibel"].map((x) => c(x)) },
    ],
  },
  {
    name: "South",
    counties: [
      { name: "Palm Beach", cities: ["Tequesta","Palm Beach Gardens","Jupiter","Juno Beach","Lake Park","Riviera Beach","Palm Beach","West Palm Beach","Atlantis","Royal Palm Beach","Greenacres","Lake Worth Beach","Wellington","Palm Springs","Pahokee","Boca Raton","Lantana","Hypoluxo","Ocean Ridge","Belle Glade","South Bay","South Palm Beach","Boynton Beach","Golf","Delray Beach","Westlake","Haverhill","Mangonia Park","Loxahatchee Groves","Highland Beach","Cloud Lake","Manalapan","Briny Breezes","Palm Beach Shores","Lake Clarke Shores","Jupiter Inlet Colony","Palm Beach County"].map((x) => c(x)) },
      { name: "Broward", cities: ["Deerfield Beach","Hillsboro Beach","Lighthouse Point","Pompano Beach","Lauderdale-By-the-Sea","Sea Ranch Lakes","Ft. Lauderdale","Dania Beach","Hollywood","Hallandale Beach","Weston","Pine Island Ridge","Parkland","Coral Springs","Sunrise","Margate","Davie","Plantation","Lauderdale Lakes","Lauderhill","Lazy Lake","Wilton Manors","Coconut Creek","Oakland Park","Tamarac","Southwest Ranches","Pembroke Pines","Miramar","Cooper City","Pembroke Park","West Park","North Lauderdale"].map((x) => c(x)) },
      { name: "Miami-Dade", cities: ["Sunny Isles Beach","Miami Beach","Aventura","Miami Gardens","Hialeah","Miami Lakes","Opa-locka","Hialeah Gardens","Doral","Virginia Gardens","Key Biscayne","North Miami","South Miami","Palmetto Bay","Cutler Bay","Pinecrest","Coral Gables","Homestead","Sweetwater","Florida City","Layton","Islandia","Key Colony Beach","Marathon","Miami","Miami Shores","North Miami Beach","Key West","Miami Springs","Bay Harbor Islands","Indian Creek","El Portal","Biscayne Park","Medley","North Bay Village","Surfside","Bal Harbour"].map((x) => c(x)) },
      { name: "Martin", cities: ["Stuart","Jupiter Island","Sewall's Point","Martin County","Ocean Breeze Park"].map((x) => c(x)) },
      { name: "St. Lucie", cities: [
        c("St. Lucie County"),
        c("Port St. Lucie", "https://pandapublicweb.cityofpsl.com/SignIn/StatusPermit.aspx?Tab=SubmitTab&View=Permits"),
        c("Fort Pierce"),
      ]},
      { name: "Indian River", cities: ["Sebastian","Fellsmere","Indian River Shores","Vero Beach","Orchid","Indian River County"].map((x) => c(x)) },
    ],
  },
];

export const ICI_DOC_SLOTS = [
  { key: "certificate_of_insurance", label: "Certificate of Insurance" },
  { key: "notice_to_building_official", label: "Notice to Building Official" },
  { key: "qualifications_statement", label: "Qualifications Statement" },
  { key: "duly_authorized_rep_form", label: "Duly Authorized Rep Form" },
  { key: "ici_resumes", label: "ICI Resumes" },
] as const;

export type IciDocKey = (typeof ICI_DOC_SLOTS)[number]["key"];

export function citySlug(regionName: string, countyName: string, cityName: string): string {
  return `${regionName}__${countyName}__${cityName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
