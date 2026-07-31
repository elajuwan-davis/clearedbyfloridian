import { useState } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { AddressAutocomplete, type ResolvedAddress as GoogleResolved } from "@/components/address-autocomplete";
import {
  activeProvider,
  censusLookup,
  type ResolvedAddress,
} from "@/lib/address-lookup";
import { MUNICIPALITIES } from "@/lib/municipalities";

/**
 * Provider-agnostic address field.
 *
 * • With a Google Maps browser key configured → live type-ahead autocomplete.
 * • Without one → free US Census Geocoder: type the full address, press
 *   "Look up", pick the match.
 *
 * Both paths emit the same `ResolvedAddress`, so the swap to Google later needs
 * no changes to the intake form.
 */
type Props = {
  value: string;
  onChange: (v: string) => void;
  onResolved: (r: ResolvedAddress) => void;
  className?: string;
  required?: boolean;
  id?: string;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export function AddressLookupField({ value, onChange, onResolved, className, required, id }: Props) {
  const provider = activeProvider();

  if (provider === "google") {
    return (
      <AddressAutocomplete
        id={id}
        required={required}
        className={className}
        value={value}
        onChange={onChange}
        onResolved={(g: GoogleResolved) => {
          // Google's locality is only a candidate — an unincorporated CDP also
          // returns one. Validate against our incorporated-municipality list.
          const incorporated = !!g.city && MUNICIPALITIES.some((m) => norm(m.name) === norm(g.city));
          onResolved({ ...g, incorporated, provider: "google" });
        }}
      />
    );
  }

  return <CensusField value={value} onChange={onChange} onResolved={onResolved} className={className} required={required} id={id} />;
}

function CensusField({ value, onChange, onResolved, className, required, id }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ResolvedAddress[]>([]);

  async function runLookup() {
    setLoading(true);
    setError(null);
    setMatches([]);
    const { matches: found, error: err } = await censusLookup(value);
    setLoading(false);
    if (err) setError(err);
    if (found.length === 1) {
      pick(found[0]);
    } else if (found.length > 1) {
      setMatches(found);
    }
  }

  function pick(r: ResolvedAddress) {
    setMatches([]);
    onResolved(r);
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          id={id}
          required={required}
          className={className}
          placeholder="1247 Banyan Trail, Ocean Ridge, FL"
          value={value}
          onChange={(e) => { onChange(e.target.value); setError(null); setMatches([]); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runLookup(); } }}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={runLookup}
          disabled={loading || !value.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 border border-obsidian/20 rounded-[3px] text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian hover:bg-obsidian/[0.04] disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Look up
        </button>
      </div>

      {matches.length > 0 && (
        <ul className="mt-2 border border-obsidian/20 rounded-[3px] divide-y divide-obsidian/10 bg-white">
          {matches.map((m, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(m); }}
                className="w-full flex items-start gap-2 px-3 py-2 text-left text-[13px] hover:bg-[#B6DAEA]/25"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-obsidian/50" />
                <div className="min-w-0">
                  <div className="text-obsidian truncate">{m.formatted}</div>
                  <div className="text-[11px] text-obsidian/55 truncate">
                    {m.incorporated ? m.city : `Unincorporated ${m.county}`}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-[11px] text-oxblood">{error}</p>}
    </div>
  );
}
