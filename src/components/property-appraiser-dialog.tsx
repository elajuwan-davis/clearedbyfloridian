import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, ExternalLink, CheckCircle2 } from "lucide-react";
import type { Project } from "@/lib/projects-data";
import {
  fetchAppraiserRecord, saveAppraiser, getAppraiser,
  COUNTY_APPRAISERS, type AppraiserRecord,
} from "@/lib/property-appraiser";
import { setPCN } from "@/lib/project-pcn";

export function PropertyAppraiserDialog({
  open, onOpenChange, project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
}) {
  const adapter = COUNTY_APPRAISERS[project.county];
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState<AppraiserRecord | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setRec(getAppraiser(project.id));
      setSaved(false);
    }
  }, [open, project.id]);

  async function run() {
    setBusy(true);
    try {
      const r = await fetchAppraiserRecord(project.address, project.city, project.county, project.client);
      setRec(r);
    } finally { setBusy(false); }
  }

  function save() {
    if (!rec) return;
    saveAppraiser(project.id, rec);
    void setPCN({ projectId: project.id }, rec.pcn);
    setSaved(true);
    setTimeout(() => onOpenChange(false), 700);
  }

  function upd<K extends keyof AppraiserRecord>(k: K, v: AppraiserRecord[K]) {
    setRec((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">
          Auto-Fill from Property Appraiser
        </DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          {adapter
            ? <>Querying <span className="font-mono">{adapter.host}</span> for {project.address}, {project.city}.</>
            : <>No appraiser adapter for county "{project.county}". Enter values manually below.</>}
        </DialogDescription>

        <div className="mt-4 flex items-center gap-2">
          <Button variant="dark" size="sm" className="rounded-[3px]" onClick={run} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
            {rec ? "Re-Fetch" : "Fetch Parcel Data"}
          </Button>
          {adapter && (
            <a href={adapter.url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-xs text-obsidian/70 hover:text-obsidian">
              <ExternalLink className="h-3 w-3" /> Open {adapter.name}
            </a>
          )}
        </div>

        {rec && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <F label="Owner of Record" value={rec.owner_of_record} onChange={(v) => upd("owner_of_record", v)} full />
            <F label="Parcel Control Number (PCN)" value={rec.pcn} onChange={(v) => upd("pcn", v)} mono />
            <F label="Year Built" value={rec.year_built} onChange={(v) => upd("year_built", v)} mono />
            <F label="Lot Size" value={rec.lot_size} onChange={(v) => upd("lot_size", v)} />
            <F label="Flood Zone" value={rec.flood_zone} onChange={(v) => upd("flood_zone", v)} mono />
            <F label="Legal Description" value={rec.legal_description} onChange={(v) => upd("legal_description", v)} full />
            <div className="sm:col-span-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
              Source: {rec.source} · Fetched {new Date(rec.fetched_at).toLocaleString()}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="dark" className="rounded-[3px]" onClick={save} disabled={!rec || busy}>
            {saved ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Saved</> : "Save & Auto-Fill Forms"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, value, onChange, mono, full }: {
  label: string; value: string; onChange: (v: string) => void; mono?: boolean; full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1 block">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className={`rounded-[3px] ${mono ? "font-mono" : ""}`} />
    </div>
  );
}
