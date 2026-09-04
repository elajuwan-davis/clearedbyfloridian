import type { NTBOFields } from "@/lib/private-provider-forms";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-obsidian/10 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-obsidian/45">
        {label}
      </div>
      <div className="text-[13px] text-obsidian/90 leading-snug">{value?.trim() || "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4 first:pt-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian border-b-2 border-obsidian pb-1 mb-1">
        {title}
      </div>
      {children}
    </div>
  );
}

/** Mirrors generateNTBO()'s section order. The private-provider identity is
 *  Cleard's own and doesn't vary by permit — only Project Information does. */
export function NTBOLivePreview({ fields }: { fields: NTBOFields }) {
  return (
    <div className="bg-white border border-obsidian/15 rounded-[3px] overflow-hidden text-obsidian">
      <div className="bg-obsidian text-white px-5 py-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-sky/90">
          Cleared Private Provider
        </div>
        <div className="text-lg font-semibold mt-1">Notice to Building Official</div>
        <div className="text-[10px] text-white/70 mt-1">
          Use of Private Provider — Form 61G20-2.005 · FL Statute §553.791
        </div>
      </div>
      <div className="px-5 py-4">
        <Section title="Project Information">
          <Field label="Project Name" value={fields.projectName} />
          <Field label="Parcel Tax ID (PCN)" value={fields.parcelTaxId} />
        </Section>
        <Section title="Services Retained">
          <div className="flex items-center gap-6 text-[13px] pt-1">
            <span>{fields.services.plansReview ? "☑" : "☐"} Plans Review</span>
            <span>{fields.services.inspections ? "☑" : "☐"} Inspections</span>
          </div>
        </Section>
        <Section title="Private Provider">
          <Field label="Private Provider Firm" value={fields.firmName} />
          <Field label="Private Provider (Individual)" value={fields.privateProvider} />
          <Field label="Address" value={`${fields.addressLine1}, ${fields.addressLine2}`} />
          <Field label="Telephone" value={fields.telephone} />
          <Field label="Email" value={fields.email} />
          <Field label="Florida License #" value={fields.licenseNumber} />
        </Section>
        <Section title="Signatory">
          <Field label="Signatory Type" value={fields.signatoryType} />
          <Field label="Print Name (Corporation)" value={fields.printNameCorporation} />
          <Field label="Representative Name" value={fields.representativeName} />
        </Section>
        <div className="pt-4 mt-2 border-t border-dashed border-obsidian/20 text-[10px] text-obsidian/40 font-mono uppercase tracking-[0.14em]">
          Signature — on the generated PDF
        </div>
      </div>
    </div>
  );
}
