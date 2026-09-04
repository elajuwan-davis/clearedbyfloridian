import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

/**
 * Florida-restricted Google Places (New) address autocomplete.
 *
 * Uses the Maps JS API loaded with a project-level VITE_GOOGLE_MAPS_API_KEY.
 * If no key is configured, or the script/API fails for any reason, the
 * component reports itself unavailable via onUnavailable so the parent can
 * render the Census lookup UI instead. It never renders a bare input.
 */
export type ResolvedAddress = {
  /** Formatted street line (number + street) — safe to store in "address". */
  streetLine: string;
  /** City / municipality parsed from address components. May be empty. */
  city: string;
  /** County (administrative_area_level_2), long form e.g. "Palm Beach County". */
  county: string;
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
  /**
   * Called when Google autocomplete cannot work (missing key, script load
   * failure, invalid key / referrer / billing, or a failed suggestion call).
   * The parent must swap in the Census lookup UI — never a bare input.
   */
  onUnavailable?: () => void;
};

// Project-level Google Maps browser key only. No Lovable-managed connector key.
const MAPS_KEY: string | undefined =
  (import.meta.env as Record<string, string | undefined>).VITE_GOOGLE_MAPS_API_KEY;

// Rough bounding box for the state of Florida — used as locationRestriction so
// suggestions never leak out to Georgia / Alabama / the Bahamas.
const FLORIDA_BOUNDS = {
  low: { latitude: 24.396308, longitude: -87.634896 },
  high: { latitude: 31.000968, longitude: -79.974307 },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleNS = any;

let mapsLoader: Promise<GoogleNS> | null = null;

/** Set by Google when the key is invalid / referrer-blocked / unbilled. */
let authFailed = false;
const authFailureListeners = new Set<() => void>();
export function onGoogleMapsAuthFailure(cb: () => void): () => void {
  if (authFailed) { cb(); return () => {}; }
  authFailureListeners.add(cb);
  return () => authFailureListeners.delete(cb);
}
function installAuthFailureHook() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w.__clearedGmAuthHook) return;
  w.__clearedGmAuthHook = true;
  w.gm_authFailure = () => {
    authFailed = true;
    authFailureListeners.forEach((cb) => cb());
    authFailureListeners.clear();
  };
}

function loadMapsJs(): Promise<GoogleNS> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (authFailed) return Promise.reject(new Error("auth-failure"));
  const w = window as unknown as { google?: GoogleNS };
  if (w.google?.maps) return Promise.resolve(w.google);
  if (mapsLoader) return mapsLoader;
  if (!MAPS_KEY) return Promise.reject(new Error("no-key"));
  installAuthFailureHook();
  mapsLoader = new Promise((resolve, reject) => {
    const cbName = `__clearedMapsInit_${Math.random().toString(36).slice(2)}`;
    const timer = setTimeout(() => reject(new Error("maps-load-timeout")), 10000);
    (window as unknown as Record<string, unknown>)[cbName] = () => {
      clearTimeout(timer);
      const g = (window as unknown as { google?: GoogleNS }).google;
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
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => { clearTimeout(timer); reject(new Error("script-load-failed")); };
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
  onUnavailable,
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
  const unavailableRef = useRef(onUnavailable);
  unavailableRef.current = onUnavailable;

  const giveUp = useRef((reason?: unknown) => {
    if (reason !== undefined) {
      console.warn("[AddressAutocomplete] falling back to Census lookup —", reason);
    }
    setSupported(false);
    unavailableRef.current?.();
  }).current;

  useEffect(() => {
    if (!MAPS_KEY) { giveUp("no VITE_GOOGLE_MAPS_API_KEY configured"); return; }
    // Google reports an invalid key / blocked referrer / billing problem
    // asynchronously through gm_authFailure — treat it as unavailable.
    const off = onGoogleMapsAuthFailure(() =>
      giveUp("gm_authFailure — invalid key, blocked referrer, or billing not enabled"),
    );
    loadMapsJs()
      .then(async (g) => {
        const lib = await g.maps.importLibrary("places");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyLib = lib as any;
        // The library loaded — that's the real signal the feature can work.
        // Wire it up immediately, before the probe below, so a hiccup on
        // that one startup call can never block real typing later.
        placesLibRef.current = lib;
        sessionTokenRef.current = new anyLib.AutocompleteSessionToken();
        // Best-effort health check, logged but never fatal — a rejection
        // here used to give up on Google for the whole page even when a
        // real address typed a moment later would have worked fine.
        try {
          await anyLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: "Miami",
            includedRegionCodes: ["us"],
            locationRestriction: FLORIDA_BOUNDS,
          });
        } catch (probeErr) {
          console.warn(
            "[AddressAutocomplete] startup probe call failed (autocomplete stays enabled) —",
            probeErr,
          );
        }
      })
      .catch((err) => giveUp(err));
    return off;
  }, [giveUp]);

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
      } catch (err) {
        // A rejected Places call means the key/API isn't usable — hand over to
        // the Census lookup rather than leaving a silent, dead input.
        setSuggestions([]);
        giveUp(err);
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
        get("sublocality") ||
        get("neighborhood") ||
        get("administrative_area_level_3") ||
        "";
      // Google returns county as e.g. "Palm Beach County" in longText.
      const countyRaw = (() => {
        const c = comps.find((c) => (c.types ?? []).includes("administrative_area_level_2"));
        return c?.longText ?? c?.shortText ?? "";
      })();
      const county = countyRaw
        ? (/county$/i.test(countyRaw) ? countyRaw : `${countyRaw} County`)
        : "";
      const state = get("administrative_area_level_1");
      const postalCode = get("postal_code");
      const formatted: string = place.formattedAddress ?? sug.primary;
      const resolved: ResolvedAddress = {
        streetLine: streetLine || sug.primary,
        city,
        county,
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

  // Never render a bare input: the parent swaps in the Census lookup UI when
  // this component reports itself unavailable.
  if (!supported) return null;

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
                i === activeIdx ? "bg-[#E6E6FA]/25" : "hover:bg-obsidian/[0.04]"
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
