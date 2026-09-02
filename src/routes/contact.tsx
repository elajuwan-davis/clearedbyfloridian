import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const FL_JURISDICTIONS = [
  "All FL Jurisdictions",
  "Alachua",
  "Baker",
  "Bay",
  "Bradford",
  "Brevard",
  "Broward",
  "Calhoun",
  "Charlotte",
  "Citrus",
  "Clay",
  "Collier",
  "Columbia",
  "DeSoto",
  "Dixie",
  "Duval (Consolidated with the City of Jacksonville)",
  "Escambia",
  "Flagler",
  "Franklin",
  "Gadsden",
  "Gilchrist",
  "Glades",
  "Gulf",
  "Hamilton",
  "Hardee",
  "Hendry",
  "Hernando",
  "Highlands",
  "Hillsborough",
  "Holmes",
  "Indian River",
  "Jackson",
  "Jefferson",
  "Lafayette",
  "Lake",
  "Lee",
  "Leon",
  "Levy",
  "Liberty",
  "Madison",
  "Manatee",
  "Marion",
  "Martin",
  "Miami-Dade",
  "Monroe",
  "Nassau",
  "Okaloosa",
  "Okeechobee",
  "Orange",
  "Osceola",
  "Palm Beach",
  "Pasco",
  "Pinellas",
  "Polk",
  "Putnam",
  "Santa Rosa",
  "Sarasota",
  "Seminole",
  "St. Johns",
  "St. Lucie",
  "Sumter",
  "Suwannee",
  "Taylor",
  "Union",
  "Volusia",
  "Wakulla",
  "Walton",
  "Washington",
] as const;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Get Started — Cleard" },
      {
        name: "description",
        content:
          "Licensed general contractor? Request Cleard private-provider permitting access.",
      },
      { property: "og:title", content: "Request Cleard access" },
      { property: "og:description", content: "Private-provider permitting for leading general contractors." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [jurisdiction, setJurisdiction] = useState("");
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Get started"
        title="Tell us about the Cleard project."
        intro="Tell us about your project. A principal will respond within four business hours."
      />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24 grid md:grid-cols-12 gap-12">
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
                setJurisdiction("");
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
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger className="h-11 rounded-sm w-full">
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {FL_JURISDICTIONS.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="jurisdiction" value={jurisdiction} />
            </Field>
            <Field label="Project address">
              <Input required name="address" placeholder="1217 Main St, Suite 200" className="h-11 rounded-sm" />
            </Field>
            <Field label="Cleard project / scope">
              <Textarea required name="scope" rows={5} placeholder="Cleard pool & summer kitchen + new 4,200 sqft SFR. Drawings ready." className="rounded-sm" />
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
            <div className="label-eyebrow">Phone</div>
            <p className="mt-3 font-mono">(772) 675-3274</p>
          </div>
          <div>
            <div className="label-eyebrow">Email</div>
            <p className="mt-3 font-mono">info@clearedinc.com</p>
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
