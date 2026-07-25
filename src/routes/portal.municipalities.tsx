import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ExternalLink, Eye, MapPin, Search, Trash2, Upload } from "lucide-react";
import { MUNICIPALITY_TREE, ICI_DOC_SLOTS, citySlug, type CityEntry, type IciDocKey } from "@/lib/municipalities-data";
import {
  getCityDocs,
  removeCityDoc,
  subscribeCityDocs,
  uploadCityDoc,
  viewCityDoc,
  type CityDocs,
} from "@/lib/municipality-docs-store";
import { toast } from "sonner";
import { MunicipalityMapHero } from "@/components/municipality-map";

export const Route = createFileRoute("/portal/municipalities")({
  head: () => ({
    meta: [
      { title: "Municipalities — Cleared by Flōridian" },
      { name: "description", content: "Statewide Florida building department portals and private-provider documents by region, county, and city." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MunicipalitiesPage,
});

const OBSIDIAN = "#153157";
const OBSIDIAN_SOFT = "#2a4770";

function MunicipalitiesPage() {
  const [query, setQuery] = useState("");
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set());
  const [openCounties, setOpenCounties] = useState<Set<string>>(new Set());

  // When a search is active, auto-expand all matches
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return MUNICIPALITY_TREE;
    return MUNICIPALITY_TREE.map((r) => ({
      ...r,
      counties: r.counties
        .map((co) => ({
          ...co,
          cities: co.cities.filter((ci) => ci.name.toLowerCase().includes(q)),
        }))
        .filter((co) => co.cities.length > 0 || co.name.toLowerCase().includes(q)),
    })).filter((r) => r.counties.length > 0 || r.name.toLowerCase().includes(q));
  }, [q]);

  const forceOpen = q.length > 0;

  const toggle = (set: Set<string>, key: string, updater: (s: Set<string>) => void) => {
    const n = new Set(set);
    n.has(key) ? n.delete(key) : n.add(key);
    updater(n);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
          Statewide Directory
        </div>
        <h1 className="display-serif text-3xl md:text-4xl leading-tight">Municipalities</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Region → County → City. Access each building department portal and manage the five private-provider documents required per jurisdiction.
        </p>
      </header>

      <MunicipalityMapHero />


      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cities, counties, regions…"
          className="w-full pl-10 pr-4 py-3 text-sm bg-background border border-border rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[color:var(--sky)]/40"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((region) => {
          const rkey = region.name;
          const rOpen = forceOpen || openRegions.has(rkey);
          const totalCities = region.counties.reduce((n, co) => n + co.cities.length, 0);
          return (
            <div key={rkey} className="border border-border rounded-[3px] overflow-hidden">
              <button
                onClick={() => toggle(openRegions, rkey, setOpenRegions)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors"
                style={{ backgroundColor: OBSIDIAN, color: "#fff" }}
              >
                <div className="flex items-center gap-3">
                  {rOpen ? <ChevronDown className="h-4 w-4" strokeWidth={1.5} /> : <ChevronRight className="h-4 w-4" strokeWidth={1.5} />}
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-75">Region</div>
                    <div className="text-lg display-serif">{region.name}</div>
                  </div>
                </div>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-80">
                  {region.counties.length} counties · {totalCities} cities
                </div>
              </button>

              {rOpen && (
                <div className="p-3 space-y-2 bg-background">
                  {region.counties.map((county) => {
                    const ckey = `${rkey}::${county.name}`;
                    const cOpen = forceOpen || openCounties.has(ckey);
                    return (
                      <div key={ckey} className="border border-border/60 rounded-[3px] overflow-hidden">
                        <button
                          onClick={() => toggle(openCounties, ckey, setOpenCounties)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
                          style={{ backgroundColor: OBSIDIAN_SOFT, color: "#fff" }}
                        >
                          <div className="flex items-center gap-2.5">
                            {cOpen ? <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} /> : <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />}
                            <div className="font-medium tracking-wide">{county.name}</div>
                          </div>
                          <div className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-80">
                            {county.cities.length === 0 ? "Coming soon" : `${county.cities.length} cities`}
                          </div>
                        </button>

                        {cOpen && (
                          <div className="p-3">
                            {county.cities.length === 0 ? (
                              <div className="text-xs text-muted-foreground italic px-2 py-3">
                                City-level data coming soon for {county.name} County.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {county.cities.map((city) => (
                                  <CityCard
                                    key={`${ckey}::${city.name}`}
                                    slug={citySlug(rkey, county.name, city.name)}
                                    city={city}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            No jurisdictions match &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}

function CityCard({ slug, city }: { slug: string; city: CityEntry }) {
  const [docs, setDocs] = useState<CityDocs>(() => getCityDocs(slug));
  useEffect(() => subscribeCityDocs(() => setDocs(getCityDocs(slug))), [slug]);

  const portalUrl = city.portalUrl && city.portalUrl !== "#" ? city.portalUrl : null;

  return (
    <div className="border border-border rounded-[3px] p-4 bg-card">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.5} style={{ color: OBSIDIAN }} />
          <div className="min-w-0">
            <div className="font-medium truncate">{city.name}</div>
            {city.deptName && (
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                {city.deptName}
              </div>
            )}
          </div>
        </div>
        {portalUrl ? (
          <a
            href={portalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-[3px] transition-opacity shrink-0"
            style={{ backgroundColor: OBSIDIAN, color: "#fff" }}
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            Building Dept
          </a>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-[3px] shrink-0"
            style={{
              backgroundColor: "transparent",
              color: OBSIDIAN,
              border: `1px solid color-mix(in oklab, ${OBSIDIAN} 20%, transparent)`,
            }}
          >
            Contact Dept.
          </span>
        )}
      </div>


      <div className="pt-3 border-t border-border/60">
        <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted-foreground mb-2">
          Private Provider Docs
        </div>
        <div className="space-y-1.5">
          {ICI_DOC_SLOTS.map((slot) => (
            <DocRow key={slot.key} slug={slug} slotKey={slot.key} label={slot.label} record={docs[slot.key]} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DocRow({
  slug,
  slotKey,
  label,
  record,
}: {
  slug: string;
  slotKey: IciDocKey;
  label: string;
  record: CityDocs[IciDocKey];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadCityDoc(slug, slotKey, file);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onView() {
    if (!record?.path) return;
    try {
      const url = await viewCityDoc(record.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open file");
    }
  }

  async function onRemove() {
    setBusy(true);
    try {
      await removeCityDoc(slug, slotKey);
      toast.success(`${label} removed`);
    } catch {
      toast.error("Remove failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 text-[12px]">
      <div className="min-w-0 flex-1">
        <div className="truncate">{label}</div>
        <div className="text-[10px] text-muted-foreground truncate">
          {record ? record.filename : "Not uploaded"}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {record ? (
          <>
            <button
              onClick={onView}
              className="p-1.5 rounded-[3px] hover:bg-secondary"
              title="View"
              aria-label="View"
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              onClick={onRemove}
              disabled={busy}
              className="p-1.5 rounded-[3px] hover:bg-secondary disabled:opacity-50"
              title="Remove"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-[3px] border border-border hover:bg-secondary disabled:opacity-50"
          >
            <Upload className="h-3 w-3" strokeWidth={1.5} />
            {busy ? "Uploading…" : "Upload"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onFile}
          accept="application/pdf,image/*"
        />
      </div>
    </div>
  );
}
