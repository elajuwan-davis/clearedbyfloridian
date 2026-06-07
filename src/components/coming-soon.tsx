import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  eyebrow,
  title,
  body,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="border-b border-obsidian/10 pb-8 mb-10">
        <div className="eyebrow text-obsidian/50">{eyebrow}</div>
        <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">{title}</h1>
      </div>

      <div className="border border-obsidian/15 bg-white p-8 sm:p-12 text-center">
        <div className="h-14 w-14 mx-auto grid place-items-center border border-obsidian/15 bg-paper-warm rounded-[3px] mb-6">
          <Icon className="h-6 w-6 text-obsidian/65" strokeWidth={1.5} />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sky mb-3">
          Coming Soon
        </div>
        <p className="text-base text-obsidian/75 leading-relaxed max-w-xl mx-auto">{body}</p>
      </div>
    </div>
  );
}
