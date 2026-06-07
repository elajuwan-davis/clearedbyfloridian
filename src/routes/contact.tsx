import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jurisdictions } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Request Access — Cleared by Flōridian" },
      {
        name: "description",
        content:
          "Active Flōridian client? Request Cleared private-provider permitting access for your GC. West Palm Beach, all of South Florida.",
      },
      { property: "og:title", content: "Request Cleared access" },
      { property: "og:description", content: "Private-provider permitting, by invitation, for Flōridian's GCs." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Request access"
        title="Tell us about the Flōridian project."
        intro="Cleared is offered by invitation to the licensed GCs delivering Flōridian's work. A principal will respond within four business hours to verify your project and begin intake."
      />

      <section className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-7">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitting(true);
              setTimeout(() => {
                setSubmitting(false);
                toast.success("Request received", {
                  description: "A reviewer will respond within 4 business hours.",
                });
                (e.target as HTMLFormElement).reset();
              }, 700);
            }}
            className="space-y-6"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="Your name">
                <Input required name="name" placeholder="Jamie Mendez" className="h-11 rounded-sm" />
              </Field>
              <Field label="GC / Company">
                <Input required name="company" placeholder="Coastline Builders Group" className="h-11 rounded-sm" />
              </Field>
              <Field label="Email">
                <Input required type="email" name="email" placeholder="jamie@atlasbuild.com" className="h-11 rounded-sm" />
              </Field>
              <Field label="Phone">
                <Input required type="tel" name="phone" placeholder="(561) 555-0144" className="h-11 rounded-sm" />
              </Field>
            </div>
            <Field label="Jurisdiction">
              <Select>
                <SelectTrigger className="h-11 rounded-sm w-full">
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictions.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Project address">
              <Input required name="address" placeholder="1217 S Ocean Blvd, Manalapan, FL" className="h-11 rounded-sm" />
            </Field>
            <Field label="Flōridian project / scope">
              <Textarea required name="scope" rows={5} placeholder="Flōridian pool & summer kitchen + new 4,200 sqft SFR. Drawings ready." className="rounded-sm" />
            </Field>
            <div className="flex items-center justify-between pt-2">
              <p className="font-mono text-[11px] text-muted-foreground">
                Demo form · Enable Lovable Cloud to receive submissions.
              </p>
              <Button type="submit" size="lg" className="rounded-sm h-12 px-8" disabled={submitting}>
                {submitting ? "Sending…" : "Send request"}
              </Button>
            </div>
          </form>
        </div>

        <aside className="md:col-span-5 md:pl-8 md:border-l hairline space-y-10">
          <div>
            <div className="label-eyebrow">Office</div>
            <p className="mt-3 leading-relaxed">
              215 Clematis Street<br />Suite 400<br />West Palm Beach, FL 33401
            </p>
          </div>
          <div>
            <div className="label-eyebrow">Phone</div>
            <p className="mt-3 font-mono">+1 (561) 555-0144</p>
          </div>
          <div>
            <div className="label-eyebrow">Email</div>
            <p className="mt-3 font-mono">intake@cleared.build</p>
          </div>
          <div>
            <div className="label-eyebrow">Hours</div>
            <p className="mt-3 font-mono text-sm">Mon–Fri · 7:00–18:00 EST<br />Inspections: weekends by arrangement</p>
          </div>
          <div className="border hairline bg-secondary/40 p-5">
            <div className="label-eyebrow text-accent">Access policy</div>
            <p className="mt-2 text-sm">
              Cleared is offered exclusively to licensed GCs on active
              Flōridian projects. New requests are verified against our
              project ledger before intake begins.
            </p>
          </div>
        </aside>
      </section>
    </MarketingShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="label-eyebrow">{label}</Label>
      {children}
    </div>
  );
}
