import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jurisdictions } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/new-permit")({
  component: NewPermit,
});

const scopes = [
  "New SFR construction",
  "Addition / remodel",
  "Interior remodel only",
  "Roof replacement",
  "Impact windows & doors",
  "Pool / spa",
  "Seawall / dock",
  "Demolition",
];

function NewPermit() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <div className="label-eyebrow">◇ New permit · Step {step} of 3</div>
        <h1 className="mt-4 font-display text-4xl tracking-tight">Submit a permit request</h1>
        <p className="mt-2 text-muted-foreground">
          Drawings can be uploaded after intake. Most submissions are reviewed within 5–7 business days.
        </p>
      </div>

      <div className="flex gap-px bg-border border hairline">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`flex-1 p-4 ${step >= n ? "bg-background" : "bg-secondary/40"}`}>
            <div className={`label-eyebrow ${step >= n ? "text-accent" : ""}`}>
              {String(n).padStart(2, "0")} · {n === 1 ? "Project" : n === 2 ? "Scope" : "Review"}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) {
            setStep(step + 1);
            return;
          }
          toast.success("Permit submitted", {
            description: "Project FLO-2026-0199 created. A reviewer has been assigned.",
          });
          navigate({ to: "/portal/projects" });
        }}
        className="space-y-8"
      >
        {step === 1 && (
          <div className="space-y-6">
            <Field label="Project address">
              <Input required className="h-11 rounded-sm" placeholder="412 Hibiscus Ln, Coral Gables, FL" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="Jurisdiction">
                <Select>
                  <SelectTrigger className="h-11 rounded-sm w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map((j) => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estimated valuation (USD)">
                <Input required type="number" className="h-11 rounded-sm" placeholder="612000" />
              </Field>
            </div>
            <Field label="Owner name">
              <Input required className="h-11 rounded-sm" placeholder="R. Sanders" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Field label="Scope">
              <Select>
                <SelectTrigger className="h-11 rounded-sm w-full">
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  {scopes.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Scope narrative">
              <Textarea required rows={5} className="rounded-sm" placeholder="Two-story addition to existing SFR, 1,840 sqft, impact-rated windows throughout, new mechanical, new electrical service to 400A." />
            </Field>
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="Architect of record">
                <Input className="h-11 rounded-sm" placeholder="Studio Aire" />
              </Field>
              <Field label="Structural engineer">
                <Input className="h-11 rounded-sm" placeholder="Coastal Structures Inc." />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="border hairline p-8 bg-secondary/30 space-y-4">
            <div className="label-eyebrow">Review & submit</div>
            <p className="text-sm text-muted-foreground">
              On submission we'll create the project, assign a licensed reviewer, and email
              an intake confirmation with the next-step checklist for drawings, calcs, and
              product approvals.
            </p>
            <ul className="text-sm space-y-2 mt-4">
              <li className="flex gap-3"><span className="font-mono text-accent">→</span> Reviewer assignment within 4 business hours</li>
              <li className="flex gap-3"><span className="font-mono text-accent">→</span> Fixed-fee proposal within 1 business day</li>
              <li className="flex gap-3"><span className="font-mono text-accent">→</span> Plan review begins on document acceptance</li>
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t hairline">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            ← Back
          </Button>
          <Button type="submit" size="lg" className="rounded-sm h-12 px-8">
            {step < 3 ? "Continue →" : "Submit permit"}
          </Button>
        </div>
      </form>
    </div>
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
