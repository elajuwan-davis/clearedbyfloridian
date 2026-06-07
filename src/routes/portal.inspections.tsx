import { createFileRoute } from "@tanstack/react-router";
import { inspections } from "@/lib/mock-data";
import { StatusBadge } from "./portal.index";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/inspections")({
  component: InspectionsPage,
});

function InspectionsPage() {
  const sorted = [...inspections].sort(
    (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="label-eyebrow">◇ Inspections</div>
          <h1 className="mt-4 font-display text-4xl tracking-tight">Schedule & history</h1>
        </div>
        <Button size="sm" className="rounded-sm">+ Request inspection</Button>
      </div>

      <div className="border hairline divide-y">
        {sorted.map((i) => {
          const d = new Date(i.scheduledFor);
          return (
            <div key={i.id} className="p-6 grid md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-2">
                <div className="font-display text-2xl tracking-tight">
                  {d.toLocaleDateString("en-US", { day: "numeric" })}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
                <div className="mt-1 font-mono text-xs text-accent">
                  {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
              <div className="md:col-span-4">
                <div className="font-medium">{i.type}</div>
                <div className="text-xs text-muted-foreground mt-1">{i.address}</div>
              </div>
              <div className="md:col-span-3 font-mono text-xs">
                <div className="text-muted-foreground">Inspector</div>
                <div className="mt-1">{i.inspector}</div>
              </div>
              <div className="md:col-span-3 md:text-right space-y-2">
                <StatusBadge status={i.status} />
                <div>
                  <Button size="sm" variant="ghost" className="font-mono text-[11px]">
                    View report →
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
