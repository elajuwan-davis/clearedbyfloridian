import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Copy, Check } from "lucide-react";
import { getPCN, setPCN, appraiserForCounty } from "@/lib/project-pcn";
import type { Project } from "@/lib/projects-data";

export function PCNLookupDialog({
  open,
  onOpenChange,
  project,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
  onSaved?: (pcn: string) => void;
}) {
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(getPCN(project.id));
      setCopied(false);
    }
  }, [open, project.id]);

  const appraiser = appraiserForCounty(project.county);
  const fullAddr = `${project.address}, ${project.city}, ${project.state} ${project.zip ?? ""}`.trim();

  function copyAddr() {
    navigator.clipboard.writeText(fullAddr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function save() {
    setPCN(project.id, value);
    onSaved?.(value.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Look Up PCN</DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          Parcel Control Number (Tax ID) from the county property appraiser.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1.5">
              Property Address
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-paper-warm border border-obsidian/12 rounded-[3px] px-3 py-2 text-sm text-obsidian">
                {fullAddr}
              </div>
              <Button variant="outline" size="sm" className="rounded-[3px]" onClick={copyAddr}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {appraiser ? (
            <div className="border border-obsidian/12 rounded-[3px] p-4 bg-paper-warm">
              <div className="text-sm font-semibold text-obsidian">{appraiser.name}</div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                {project.county} County
              </div>
              <ol className="mt-3 space-y-1.5 text-xs text-obsidian/75 leading-relaxed list-decimal ml-4">
                <li>Open the property appraiser search below.</li>
                <li>Paste the address above and locate the parcel.</li>
                <li>Copy the Parcel Control Number back to this form.</li>
              </ol>
              <Button
                variant="dark"
                size="sm"
                className="rounded-[3px] mt-4"
                onClick={() => window.open(appraiser.url, "_blank", "noopener")}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open {project.county} Appraiser
              </Button>
            </div>
          ) : (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-[3px] p-3 text-sm text-amber-800">
              No property appraiser lookup on file for county "{project.county}". Enter the PCN manually below.
            </div>
          )}

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 block mb-1.5">
              Parcel Control Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-obsidian/40" strokeWidth={1.5} />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 00-42-43-01-01-000-0000"
                className="rounded-[3px] pl-9 font-mono"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-obsidian/50">
              Saved to this project and used to auto-fill the NTBO form.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="dark" className="rounded-[3px]" onClick={save}>
            Save PCN
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
