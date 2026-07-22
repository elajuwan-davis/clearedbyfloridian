import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Check } from "lucide-react";

export const EQUIPMENT_SPECS: { title: string; url: string }[] = [
  { title: "Jandy Gas Heater Specs", url: "https://drive.google.com/file/d/19rwjw5fhHIvKNDY836WaumolMQMLTiEm/view" },
  { title: "Jandy Pump 1.65 Specs", url: "https://drive.google.com/file/d/1_bZ0Fl6-E_mvlF0Co8wwaP6g1iXKQFsU/view" },
  { title: "Jandy Pump 2.7 Specs", url: "https://drive.google.com/file/d/1qojZbCxO3ErmOtoFN3hBVTceJlZZthVC/view" },
  { title: "Jandy E-Pump 3.8", url: "https://drive.google.com/file/d/1BVGivAamDxAHEgDl3kqLUh6O_5hHhm9p/view" },
  { title: "Jandy Pump 1.85 Specs", url: "https://drive.google.com/file/d/1VviC455zkA89Kbbm8tKBBAEGfyQP53bV/view" },
  { title: "Jandy Filter Small Specs", url: "https://drive.google.com/file/d/1Bv4DS4Dne2QUhvAWVT2z2ISwnsaArId3/view" },
  { title: "Jandy Blower", url: "https://drive.google.com/file/d/1qwE3iUsvgvKukOAGRdS7dk1tlbzvmG0A/view" },
  { title: "Jandy Automation", url: "https://drive.google.com/file/d/10Wx7QU_01dgk5awn9wShhyHajlEQyQyD/view" },
  { title: "Jandy TruClear", url: "https://drive.google.com/file/d/1Ewqnc7H4O3iwfA_KVreZNIJH-MY9oQbB/view" },
  { title: "Jandy Heat Pump Specs", url: "https://drive.google.com/file/d/17-bTRgxQ0vI2y1ESwrYuJ0DydT5P5aEK/view" },
  { title: "In-Ground Pool Alarm", url: "https://drive.google.com/file/d/1pejNmrT2_XoiPqT6t77zCHMw9cJtid5N/view" },
  { title: "Jandy Nicheless Light", url: "https://drive.google.com/file/d/1d9hjBcaKsofqu4rA-ebdxMVovA1EHjsl/view" },
];

export function EquipmentLibraryDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (specs: { title: string; url: string }[]) => void | Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  async function attach() {
    const chosen = EQUIPMENT_SPECS.filter((s) => selected.has(s.url));
    if (chosen.length === 0) return;
    await onSelect(chosen);
    setSelected(new Set());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Equipment Specs Library</DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          Select one or more manufacturer spec sheets to attach to this document field.
        </DialogDescription>

        <div className="mt-4 max-h-[400px] overflow-y-auto grid gap-2 sm:grid-cols-2">
          {EQUIPMENT_SPECS.map((spec) => {
            const isSel = selected.has(spec.url);
            return (
              <button
                key={spec.url}
                type="button"
                onClick={() => toggle(spec.url)}
                className={`text-left flex items-start gap-2 border rounded-[3px] p-3 transition-colors ${
                  isSel ? "border-obsidian bg-obsidian/5" : "border-obsidian/15 hover:bg-obsidian/[0.02]"
                }`}
              >
                <div className="rounded-[3px] border border-obsidian/15 bg-white p-1.5 shrink-0">
                  {isSel ? <Check className="h-4 w-4 text-obsidian" /> : <FileText className="h-4 w-4 text-obsidian/60" />}
                </div>
                <div className="text-sm text-obsidian leading-snug">{spec.title}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/55">
            {selected.size} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="dark" className="rounded-[3px]" disabled={selected.size === 0} onClick={attach}>
              Attach {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
