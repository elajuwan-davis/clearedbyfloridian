import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

/**
 * Florida-restricted Google Places (New) address autocomplete.
 *
 * Uses the Maps JS API loaded with the Lovable-managed Google Maps browser
 * key (or a project-level VITE_GOOGLE_MAPS_API_KEY fallback). If no key is
 * configured the component silently degrades to a plain text input so the
 * intake form is never blocked.
 */
export type ResolvedAddress = {
  /** Formatted street line (number + street) — safe to store in "address". */
  streetLine: string;
  /** City / municipality parsed from address components. May be empty. */
  city: string;
  /** Two-letter US state (should be "FL" for restricted results). */
  state: string;
  /** 5-digit ZIP. May be empty. */
  postalCode: string;
  /** Full formatted address string from Places. */
  formatted: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onResolved: (r: ResolvedAddress) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
};

// Prefer the Lovable-managed connector key; fall back to a project secret if
// the workspace hasn't linked the connector yet.
const MAPS_KEY: string | undefined =
  (import.meta.env as Record<string, string | undefined>).VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ||
  (import.meta.env as Record<string, string | undefined>).VITE_GOOGLE_MAPS_API_KEY;

const TRACKING_ID: string | undefined =
  (import.meta.env as Record<string, string | undefined>).VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

// Rough bounding box for the state of Florida — used as locationRestriction so
// suggestions never leak out to Georgia / Alabama / the Bahamas.
const FLORIDA_BOUNDS = {
  low: { latitude: 24.396308, longitude: -87.634896 },
  high: { latitude: 31.000968, longitude: -79.974307 },
};

let mapsLoader: Promise<typeof google> | null = null;
function loadMapsJs(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as unknown as { google?: typeof google }).google?.maps) {
    return Promise.resolve((window as unknown as { google: typeof google }).google);
  }
  if (mapsLoader) return mapsLoader;
  if (!MAPS_KEY) return Promise.reject(new Error("no-key"));
  mapsLoader = new Promise((resolve, reject) => {
    const cbName = `__lovableMapsInit_${Math.random().toString(36).slice(2)}`;
    (window as unknown as Record<string, unknown>)[cbName] = () => {
      const g = (window as unknown as { google?: typeof google }).google;
      if (g?.maps) resolve(g);
      else reject(new Error("maps-not-ready"));
      delete (window as unknown as Record<string, unknown>)[cbName];
    };
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: MAPS_KEY,
      v: "weekly",
      loading: "async",
      libraries: "places",
      callback: cbName,
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("script-load-failed"));
    document.head.appendChild(s);
  });
  return mapsLoader;
}

type Suggestion = {
  placeId: string;
  primary: string;
  secondary: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlacesLib = any;

export function AddressAutocomplete({
  value,
  onChange,
  onResolved,
  className,
  placeholder,
  required,
  id,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState<boolean>(!!MAPS_KEY);
  const [activeIdx, setActiveIdx] = useState(0);
  const placesLibRef = useRef<PlacesLib | null>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!MAPS_KEY) { setSupported(false); return; }
    loadMapsJs()
      .then(async (g) => {
        const lib = await g.maps.importLibrary("places");
        placesLibRef.current = lib;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessionTokenRef.current = new (lib as any).AutocompleteSessionToken();
      })
      .catch(() => setSupported(false));
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const inputId = useMemo(() => id ?? `addr-${Math.random().toString(36).slice(2)}`, [id]);

  function scheduleFetch(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 3 || !placesLibRef.current) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const lib = placesLibRef.current;
        if (!lib) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { suggestions: raw } = await (lib as any).AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: sessionTokenRef.current,
          includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
          includedRegionCodes: ["us"],
          locationRestriction: FLORIDA_BOUNDS,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: Suggestion[] = (raw ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((s: any) => {
            const p = s.placePrediction;
            if (!p) return null;
            return {
              placeId: p.placeId,
              primary: p.mainText?.text ?? p.text?.text ?? "",
              secondary: p.secondaryText?.text ?? "",
            };
          })
          .filter(Boolean) as Suggestion[];
        setSuggestions(list);
        setActiveIdx(0);
        setOpen(list.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 220);
  }

  async function selectSuggestion(sug: Suggestion) {
    setOpen(false);
    const lib = placesLibRef.current;
    if (!lib) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const place = new (lib as any).Place({ id: sug.placeId, requestedLanguage: "en" });
      await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comps: any[] = place.addressComponents ?? [];
      const get = (type: string) => {
        const c = comps.find((c) => (c.types ?? []).includes(type));
        return c?.shortText ?? c?.longText ?? "";
      };
      const streetNumber = get("street_number");
      const route = get("route");
      const streetLine = [streetNumber, route].filter(Boolean).join(" ").trim();
      const city =
        get("locality") ||
        get("postal_town") ||
        get("sublocality_level_1") ||
        get("administrative_area_level_3") ||
        "";
      const state = get("administrative_area_level_1");
      const postalCode = get("postal_code");
      const formatted: string = place.formattedAddress ?? sug.primary;
      const resolved: ResolvedAddress = {
        streetLine: streetLine || sug.primary,
        city,
        state,
        postalCode,
        formatted,
      };
      onChange(resolved.streetLine);
      onResolved(resolved);
      // Rotate session token after a successful selection (Places API billing).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionTokenRef.current = new (lib as any).AutocompleteSessionToken();
    } catch {
      // Fallback to just filling the primary line.
      onChange(sug.primary);
    }
  }

  if (!supported) {
    return (
      <input
        id={inputId}
        required={required}
        className={className}
        placeholder={placeholder ?? "Street address"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={inputId}
          required={required}
          className={className}
          placeholder={placeholder ?? "Start typing a Florida address…"}
          value={value}
          onChange={(e) => { onChange(e.target.value); scheduleFetch(e.target.value); }}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); selectSuggestion(suggestions[activeIdx]); }
            else if (e.key === "Escape") { setOpen(false); }
          }}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-obsidian/40" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-auto bg-white border border-obsidian/20 rounded-[3px] shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-start gap-2 px-3 py-2 cursor-pointer text-[13px] ${
                i === activeIdx ? "bg-[#B6DAEA]/25" : "hover:bg-obsidian/[0.04]"
              }`}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-obsidian/50" />
              <div className="min-w-0">
                <div className="text-obsidian truncate">{s.primary}</div>
                <div className="text-[11px] text-obsidian/55 truncate">{s.secondary}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
