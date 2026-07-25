// Statewide Florida municipality hierarchy: Region → County → City

export type Region = "Northwest" | "Northeast" | "Central" | "South";

export type CityEntry = {
  name: string;
  portalUrl?: string;
  deptName?: string;
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

const RAW_TREE: RegionEntry[] = [
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
      { name: "St. Lucie", cities: ["St. Lucie County","Port St. Lucie","Fort Pierce"].map((x) => c(x)) },
      { name: "Indian River", cities: ["Sebastian","Fellsmere","Indian River Shores","Vero Beach","Orchid","Indian River County"].map((x) => c(x)) },
    ],
  },
];

// [countyName, cityNameInTree, deptName, portalUrl | null]
type Override = [string, string, string | null, string | null];

const OVERRIDES: Override[] = [
  // Palm Beach
  ["Palm Beach", "Tequesta", "Village of Tequesta Building Department", "https://bsaonline.com/?uid=2607"],
  ["Palm Beach", "Palm Beach Gardens", "Building Division", "https://www.pbgfl.gov/1215/PBG-Community-Development-Portal"],
  ["Palm Beach", "Jupiter", "Building Department", "https://www.jupiter.fl.us/cds"],
  ["Palm Beach", "Juno Beach", "Town of Juno Beach Building Department", "https://www.mgoconnect.org/"],
  ["Palm Beach", "Lake Park", "Community Development Department", "https://www.capfla.com"],
  ["Palm Beach", "Riviera Beach", "Building & Permits", "https://rivierabeachfl-energovweb.tylerhost.net/apps/SelfService#/home"],
  ["Palm Beach", "Palm Beach", "Planning, Zoning & Building Department", "https://eden.townofpalmbeach.com/Default.aspx?Build=PM.PermitsHome&ShowLogon=ShowLogon"],
  ["Palm Beach", "West Palm Beach", "Building Division", "https://permit-planner.wpb.org/"],
  ["Palm Beach", "Atlantis", "City of Atlantis Building Department", "https://www.atlantisfl.gov/156/Building-Department"],
  ["Palm Beach", "Royal Palm Beach", "Building Department", "https://www.royalpalmbeachfl.gov/308/e-Permits"],
  ["Palm Beach", "Greenacres", "Building Division", "https://esuite.greenacresfl.gov/eSuite.Permits/WelcomePage.aspx/"],
  ["Palm Beach", "Lake Worth Beach", "Building Division", "https://portal.lakeworthbeachfl.gov/online-services/building-permit-application/"],
  ["Palm Beach", "Wellington", "Building Division", "https://accessc2g.wellingtonfl.gov/Click2GovBP/index.html"],
  ["Palm Beach", "Palm Springs", "Planning, Zoning & Building", "https://h9.maintstar.co/palmsprings/portal/"],
  ["Palm Beach", "Pahokee", "Building, Planning & Zoning", "https://pahokee.portal.iworq.net/pahokee/permits/600"],
  ["Palm Beach", "Boca Raton", "Building Department", "https://www.myboca.us/2235/Boca-eHub"],
  ["Palm Beach", "Lantana", "Building Division", "https://www.lantana.org/158/Building-Permits"],
  ["Palm Beach", "Hypoluxo", null, null],
  ["Palm Beach", "Ocean Ridge", "Building Department", "https://bsaonline.com/Contractors/?uid=3051"],
  ["Palm Beach", "Belle Glade", null, null],
  ["Palm Beach", "South Bay", null, null],
  ["Palm Beach", "South Palm Beach", "Building Department", "https://mgoconnect.org/cp/portal"],
  ["Palm Beach", "Boynton Beach", "Building Department", "https://www.boynton-beach.org/permits"],
  ["Palm Beach", "Delray Beach", "Building Division", "https://permitting.delraybeachfl.gov/"],
  ["Palm Beach", "Westlake", "Building Department", "https://cityviewportal.westlakegov.com/"],
  ["Palm Beach", "Haverhill", null, null],
  ["Palm Beach", "Mangonia Park", "Building Department", "https://www.tompfl.com/ds/page/building-permits-applications"],
  ["Palm Beach", "Loxahatchee Groves", "Building Department", "https://www.mgoconnect.org/cp/portal"],
  ["Palm Beach", "Highland Beach", "Building Department", "https://twn-highlandbeach-fl.smartgovcommunity.com/ApplicationPublic/ApplicationHome"],
  ["Palm Beach", "Cloud Lake", null, null],
  ["Palm Beach", "Manalapan", "Building Department", "https://www.mgoconnect.org/cp/portal"],
  ["Palm Beach", "Briny Breezes", null, null],
  ["Palm Beach", "Palm Beach Shores", "Building Department", "https://www.palmbeachshoresfl.us/departments/building_department/apply_online_for_a_permit.php"],
  ["Palm Beach", "Lake Clarke Shores", "Community Development Services", "https://www.mgoconnect.org"],
  ["Palm Beach", "Jupiter Inlet Colony", "Building Department", "https://www.jupiterinletcolony.gov/276/Building-Permits"],

  // Broward
  ["Broward", "Deerfield Beach", "Building Services", "https://deerfieldbeach.geocivix.com/secure/"],
  ["Broward", "Hillsboro Beach", "Building Department", "https://app.communitycore.com/app/public-portal/c98c7b46-2cba-4ba2-bbd5-7a76966f42dd"],
  ["Broward", "Lighthouse Point", "Building & Zoning Department", "https://ci-lighthousepoint-fl.smartgovcommunity.com/"],
  ["Broward", "Pompano Beach", "Building Inspections Division", "https://c2g.pompanobeachfl.gov/Click2GovBP/index.html"],
  ["Broward", "Lauderdale-By-the-Sea", "Building Division", "https://www.lauderdalebythesea-fl.gov/152/Building-Division"],
  ["Broward", "Ft. Lauderdale", "Development Services Department", "https://www.fortlauderdale.gov/lauderbuild"],
  ["Broward", "Dania Beach", "Building Division", "https://cityofdaniabeachfl.nwerp.tylerapp.com/nwprod/eSuite.Permits/"],
  ["Broward", "Hollywood", "Building Division", "https://www.hollywoodfl.org/1201/Broward-County-ePermitsOneStop"],
  ["Broward", "Hallandale Beach", "Building Division", "https://www.hallandalebeachfl.gov/1317/ePermitsOneStop"],
  ["Broward", "Weston", "Building Code Services", "https://aca-prod.accela.com/weston/Default.aspx"],
  ["Broward", "Parkland", "Building Department", "https://www.broward.org/ePermits/Pages/Default.aspx"],
  ["Broward", "Coral Springs", "Building Department", "https://etrakit.coralsprings.gov/etrakit/"],
  ["Broward", "Sunrise", "Building Division", "https://www.sunrisefl.gov/openforbusiness"],
  ["Broward", "Margate", "Building Department", "https://eservices.margatefl.com/Click2GovBP/selectpermit.html"],
  ["Broward", "Davie", "Building Division", "https://esuite.davie-fl.gov/eSuite.Permits/WelcomePage.aspx"],
  ["Broward", "Plantation", "Department of Building Safety", "https://aca.plantation.org/CitizenAccess/Default.aspx"],
  ["Broward", "Lauderdale Lakes", "Building Division", "https://www.lauderdalelakes.org/550/Building-ePermits-OneStop"],
  ["Broward", "Lauderhill", "Building Department", "http://egov.lauderhill-fl.gov/eGovPlus83/permit/perm_status.aspx"],
  ["Broward", "Wilton Manors", "Community Development Services", "https://bsaonline.com/?uid=2309"],
  ["Broward", "Coconut Creek", "Building Department", "https://www.coconutcreek.gov/home/apply-for-a-permit"],
  ["Broward", "Oakland Park", "Building & Permitting Services", "https://oaklandparkfl-energovweb.tylerhost.net/apps/SelfService#/search"],
  ["Broward", "Tamarac", "Building Department", "https://e-gov.tamarac.org/Click2GovBP/index.html"],
  ["Broward", "Southwest Ranches", "Building Permitting and Inspections", "https://www2.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=117"],
  ["Broward", "Pembroke Pines", "Building Department", "https://pembrokepinesfl-energovweb.tylerhost.net/apps/selfservice#/applicationAssistant"],
  ["Broward", "Miramar", "Building Division", "https://mss.miramarfl.gov/css/default.aspx"],
  ["Broward", "Cooper City", "Building Division", "https://aca-prod.accela.com/COOPER/Welcome.aspx"],
  ["Broward", "Pembroke Park", "Building Department", "https://www.tppfl.gov/194/Online-Permitting-System"],
  ["Broward", "West Park", "Building Department", "https://www.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=261"],
  ["Broward", "North Lauderdale", "Community Development Department", "https://nlselfservice.nlauderdale.org/ess/"],

  // Miami-Dade
  ["Miami-Dade", "Sunny Isles Beach", "Building Department", "https://ci-sunnyislesbeach-fl.smartgovcommunity.com/"],
  ["Miami-Dade", "Miami Beach", "Building Department", "https://www.miamibeachfl.gov/business/civicaccess/"],
  ["Miami-Dade", "Aventura", "Building Division", "https://etrakit.cityofaventura.com/etrakit/Search/Permit.aspx"],
  ["Miami-Dade", "Miami Gardens", "Building Services Division", "https://miamigardensfl-energovpub.tylerhost.net/apps/selfservice#/home"],
  ["Miami-Dade", "Hialeah", "Building Department", "https://apps.hialeahfl.gov/building/"],
  ["Miami-Dade", "Miami Lakes", "Building Department", "https://trakit.miamilakes-fl.gov/etrakit/"],
  ["Miami-Dade", "Opa-locka", "Building & Licenses Department", "https://www.opalockafl.gov/73/Building-Licenses"],
  ["Miami-Dade", "Doral", "Building Department", "https://building.cityofdoral.com/"],
  ["Miami-Dade", "Key Biscayne", "Building, Zoning and Planning Department", "https://aca-prod.accela.com/keybiscayne/Default.aspx"],
  ["Miami-Dade", "North Miami", "Building Department", "https://eportal.northmiamifl.gov/Default.aspx?Build=PM.PermitsHome&ShowLogon=ShowLogon"],
  ["Miami-Dade", "South Miami", "Building Division", "https://www.southmiamifl.gov/115/Building-Division"],
  ["Miami-Dade", "Palmetto Bay", "Building & Permitting Department", "https://app.govoutreach.com/palmettobayvillagefl/public/permits/apply"],
  ["Miami-Dade", "Cutler Bay", "Building Division", "https://websrvcs.cutlerbay-fl.gov/Default.aspx?Build=PM.PermitsHome&ShowLogon=ShowLogon"],
  ["Miami-Dade", "Pinecrest", "Building and Planning Department", "https://pine-trk.aspgov.com/eTRAKiT/"],
  ["Miami-Dade", "Coral Gables", "Development Services Department", "https://cgportal.coralgables.com"],
  ["Miami-Dade", "Homestead", "Building Safety Department", "https://cityofhomesteadfl-energovweb.tylerhost.net/apps/selfservice"],
  ["Miami-Dade", "Sweetwater", "Building & Zoning Department", "https://cityofsweetwateresuite.miami/eSuite.Permits/WelcomePage.aspx"],
  ["Miami-Dade", "Florida City", "Building and Zoning Department", "https://inspectionsearch.floridacityfl.gov/"],
  ["Miami-Dade", "Miami", "Building Department", "https://www.miami.gov/Permits-Construction/Apply-for-or-Manage-Building-Permits-iBuild"],
  ["Miami-Dade", "Miami Shores", "Building Department", "https://villageofmiamishoresfl-energovweb.tylerhost.net/apps/selfservice#/home"],
  ["Miami-Dade", "North Miami Beach", "Building Department", "https://www.citynmb.com/1440/Online-Self-Service-Permitting-Portal-eD"],
  ["Miami-Dade", "Miami Springs", "Community Development", "https://mias-trk.aspgov.com/eTRAKiT/"],
  ["Miami-Dade", "Bay Harbor Islands", "Building & Zoning Department", "https://www.citizenserve.com/bhi"],
  ["Miami-Dade", "El Portal", "Building & Zoning Department", "https://cap.idtplans.com/secure/"],
  ["Miami-Dade", "Biscayne Park", "Building, Permits, & Zoning", "https://app.govoutreach.com/biscayneparkvlgfl/public/permits"],
  ["Miami-Dade", "Medley", "Building and Zoning Department", "https://bsaonline.com/?uid=2537"],
  ["Miami-Dade", "Surfside", "Building Department", "https://www.townofsurfsidefl.gov/departments-services/building/customer-self-service-(css)"],
  ["Miami-Dade", "Bal Harbour", "Building Department", "https://vlg-balharbour-fl.smartgovcommunity.com/"],

  // Martin
  ["Martin", "Stuart", "Building Division", "https://stuartfl.portal.opengov.com/"],
  ["Martin", "Jupiter Island", "Building Department", "https://www.townofjupiterisland.com/256/Permits"],
  ["Martin", "Sewall's Point", "Building & Public Works Department", "https://www2.citizenserve.com/Portal/PortalController?Action=showContactUs&ctzPagePrefix=Portal_&installationID=164"],
  ["Martin", "Ocean Breeze Park", "Building & Permitting", "https://townofoceanbreeze.com/building-permitting/"],

  // St. Lucie
  ["St. Lucie", "Port St. Lucie", "Building Department", "https://pandapublicweb.cityofpsl.com/SignIn/StatusPermit.aspx?Tab=SubmitTab&View=Permits"],
  ["St. Lucie", "Fort Pierce", "Building Department", "https://cityoffortpierce.com/737/Online-Permitting"],

  // Indian River
  ["Indian River", "Sebastian", "Building Department", "https://www.mgoconnect.org"],
  ["Indian River", "Fellsmere", null, null],
  ["Indian River", "Indian River Shores", "Building Department", "https://portal.iworq.net/INDIANRIVERSHORES/permits/601"],
  ["Indian River", "Vero Beach", "Building Division", "https://indianriver.clearvillageinc.com/CitizenPortal/DefaultIRC.aspx"],
  ["Indian River", "Orchid", "Building Department", "https://www.townoforchid.com/building/page/building-permits"],

  // Central region
  ["Orange", "Orlando", "Permitting Services Division", "https://digitalpermits.orlando.gov/"],
  ["Orange", "Apopka", "Building Safety Division", "https://apopkafl.portal.opengov.com/search"],
  ["Orange", "Winter Park", "Building & Permitting Services", "https://cityofwinterpark.org/departments/building-permitting-services/"],
  ["Orange", "Maitland", "Community Development Department", "https://maitlandfl-energovpub.tylerhost.net/Apps/SelfService/MaitlandFLProd"],
  ["Orange", "Ocoee", "Building Division", "https://permits.ocoee.org/citizenportal/"],
  ["Orange", "Winter Garden", "Building Division", "https://bsaonline.com/SeekerSite/7/3123"],
  ["Orange", "Windermere", "Building Department Services", "https://pdcsllc.com/cities/windermere/"],
  ["Seminole", "Winter Springs", "Building Division", "https://eservices.winterspringsfl.org/eSuite.Permits/"],
  ["Seminole", "Longwood", "Building Division", "https://ci-longwood-fl.smartgovcommunity.com/"],
  ["Seminole", "Lake Mary", "Building Division", "https://www.lakemaryfl.com/159/Permit-Portal"],
  ["Seminole", "Sanford", "Building Division", "https://www.citizenserve.com/Portal/PortalController?Action=showPermit&ctzPagePrefix=Portal_&installationID=113&original_iid=0&original_contactID=0"],
  ["Seminole", "Altamonte Springs", "Building and Fire Safety Department", "https://www.altamonte.org/1013/Apply-for-Permits-Schedule-Inspections"],
  ["Seminole", "Casselberry", "Building Division", "https://www4.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=221"],
  ["Seminole", "Oviedo", "Building Services", "https://ovdo-egov.aspgov.com/Click2GovBP/index.html"],
  ["Osceola", "Kissimmee", "Building Division", "https://energovweb.kissimmee.gov/EnerGov_Prod/SelfService"],
  ["Osceola", "St Cloud", "Building Department", "https://etrakit.stcloud.org/etrakit/"],
  ["Hillsborough", "Tampa", "Construction Services", "https://aca-prod.accela.com/TAMPA/Default.aspx"],
  ["Hillsborough", "Temple Terrace", "Building Division", "https://temp-egov.aspgov.com/Click2GovBP/index.html"],
  ["Hillsborough", "Plant City", "Building Department", "https://h8.maintstar.co/plantcity/portal/"],
  ["Pinellas", "Clearwater", "Building Division", "https://aca-prod.accela.com/CLEARWATER/Default.aspx"],
  ["Pinellas", "St. Petersburg", "Building & Permitting", "https://stpe-egov.aspgov.com/Click2GovBP/index.html"],
  ["Pinellas", "Largo", "Building Division", "https://www.largo.com/civicaccess/index.php"],
  ["Pinellas", "Dunedin", "Building Division", "https://cityofdunedinfl-energovweb.tylerhost.net/apps/selfservice#/home"],
  ["Pinellas", "Tarpon Springs", "Building Development Department", "https://www.ctsfl.us/309/GoPost-Online-Permit-Application-Portal"],
  ["Pinellas", "Safety Harbor", "Building Division", "https://pinellas.gov/applying-for-a-building-permit/"],
  ["Pinellas", "Pinellas Park", "Building Development Division", "https://egcss.pinellas-park.com/EnerGov_Prod/SelfService#/search"],
  ["Brevard", "Melbourne", "Building Section", "https://energovweb23.mlbfl.org/energov_prod/selfservice/#/home"],
  ["Brevard", "Palm Bay", "Building Permits/Inspections", "https://www.palmbayfl.gov/government/city-departments-a-to-e/building-permits-inspections"],
  ["Brevard", "Cocoa", "Building & Permitting", "https://www.citizenserve.com/Portal/PortalController?Action=showHomePage&ctzPagePrefix=Portal_&installationID=331"],
  ["Brevard", "Cocoa Beach", "Development Services Department", "https://cocoabeachfl.viewpointcloud.com/"],
  ["Brevard", "Titusville", "Building Department", "https://bsaonline.com/?uid=2751"],
  ["Brevard", "Rockledge", null, null],
  ["Lee", "Ft Myers", null, null],
  ["Lee", "Cape Coral", null, null],
  ["Lee", "Bonita Springs", null, null],
  ["Lee", "Estero", null, null],
  ["Lee", "Sanibel", null, null],
  ["Polk", "Lakeland", "Building Inspection Division", "https://ims.lakelandgov.net/"],
  ["Polk", "Bartow", null, null],
  ["Polk", "Haines City", null, null],
  ["Polk", "Davenport", null, null],
  ["Polk", "Auburndale", null, null],
  ["Pasco", "New Port Richey", null, null],
  ["Pasco", "Zephyrhills", null, null],
  ["Pasco", "Dade City", null, null],
  ["Manatee", "Bradenton", null, null],
  ["Manatee", "Palmetto", null, null],
  ["Sarasota", "City of Sarasota", null, null],
  ["Sarasota", "Venice", null, null],
  ["Sarasota", "North Port", "Building Department", "https://aca-prod.accela.com/NORTHPORT/"],
  ["Charlotte", "Punta Gorda", null, null],
  ["Volusia", "Daytona Beach", "Permits & Licensing", "https://daytonabeach.ims16.com/ims"],
  ["Volusia", "Port Orange", null, null],
  ["Volusia", "Ormond Beach", "Neighborhood Improvement Division", "https://ormondbeachfl-energovweb.tylerhost.net/apps/selfservice#/home"],
  ["Volusia", "New Smyrna Beach", "Building & Inspections Department", "https://newsmyrnabeachfl-energovweb.tylerhost.net/apps/SelfService#/home"],
  ["Volusia", "DeLand", null, null],
  ["Volusia", "Deltona", null, null],
];

function applyOverrides(tree: RegionEntry[]): RegionEntry[] {
  const map = new Map<string, { deptName?: string; portalUrl?: string }>();
  for (const [county, city, dept, url] of OVERRIDES) {
    map.set(`${county}::${city}`, {
      deptName: dept ?? undefined,
      portalUrl: url ?? undefined,
    });
  }
  return tree.map((region) => ({
    ...region,
    counties: region.counties.map((county) => ({
      ...county,
      cities: county.cities.map((city) => {
        const key = `${county.name}::${city.name}`;
        const o = map.get(key);
        if (!o) return city;
        return { ...city, deptName: o.deptName, portalUrl: o.portalUrl };
      }),
    })),
  }));
}

export const MUNICIPALITY_TREE: RegionEntry[] = applyOverrides(RAW_TREE);

export const ICI_DOC_SLOTS = [
  { key: "certificate_of_insurance", label: "Certificate of Insurance" },
  { key: "notice_to_building_official", label: "Notice to Building Official" },
  { key: "qualifications_statement", label: "Qualifications Statement" },
  { key: "duly_authorized_rep_form", label: "Duly Authorized Rep Form" },
  { key: "ici_resumes", label: "Resumes" },
] as const;

export type IciDocKey = (typeof ICI_DOC_SLOTS)[number]["key"];

export function citySlug(regionName: string, countyName: string, cityName: string): string {
  return `${regionName}__${countyName}__${cityName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
