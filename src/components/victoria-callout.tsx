import { Sparkles } from "lucide-react";

/** Shared Victoria AI informational callout card. */
export function VictoriaCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-start gap-3 rounded-[3px] border border-obsidian/10 bg-obsidian/[0.03] p-5">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-obsidian/60" />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/50">
          Victoria AI
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-obsidian/70">{children}</p>
      </div>
    </div>
  );
}
