import type { NOCFields } from "@/lib/private-provider-forms";

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

/** Mirrors generateNOC()'s section order exactly so this reads like a live
 *  preview of the PDF, not a different form. Instant on every keystroke —
 *  no PDF generation involved; "Preview PDF" runs the real generator. */
export function NOCLivePreview({ fields }: { fields: NOCFields }) {
  return (
    <div className="bg-white border border-obsidian/15 rounded-[3px] overflow-hidden text-obsidian">
      <div className="bg-black text-white px-6 py-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#C08A55]">
          Cleared Private Provider
        </div>
        <div className="text-xl font-semibold mt-1">Notice of Commencement</div>
        <div className="text-[10px] text-white/70 mt-1">
          Florida Statute §713.13 — Record with County Clerk before first inspection
        </div>
      </div>
      <div className="px-6 py-5">
        <Section title="1. Property">
          <Field label="Property Address" value={fields.propertyAddress} />
          <Field label="Parcel / Tax ID (PCN)" value={fields.parcelTaxId} />
          <Field label="Legal Description" value={fields.legalDescription} />
        </Section>
        <Section title="2. Description of Improvement">
          <Field label="General Description" value={fields.improvementDescription} />
        </Section>
        <Section title="3. Owner Information">
          <Field label="Owner Name / Interest" value={fields.ownerName} />
          <Field label="Owner Address" value={fields.ownerAddress} />
        </Section>
        <Section title="4. Contractor">
          <Field label="Contractor Name" value={fields.contractorName} />
          <Field label="Contractor Address" value={fields.contractorAddress} />
          <Field label="Contractor License #" value={fields.contractorLicense} />
          <Field label="Contractor Phone" value={fields.contractorPhone} />
        </Section>
        <Section title="5. Surety (if any)">
          <Field label="Surety Name" value={fields.suretyName || "N/A"} />
          <Field label="Surety Address" value={fields.suretyAddress || "N/A"} />
          <Field label="Bond Amount" value={fields.suretyBondAmount || "N/A"} />
        </Section>
        <Section title="6. Lender (if any)">
          <Field label="Lender Name" value={fields.lenderName || "N/A"} />
          <Field label="Lender Address" value={fields.lenderAddress || "N/A"} />
        </Section>
        <Section title="7. Persons Designated to Receive Notices">
          <Field label="Designee" value={fields.designProfessional || "See owner above"} />
          <Field label="Designee Address" value={fields.designProfessionalAddress} />
        </Section>
        <Section title="8. Expiration">
          <p className="text-[11px] text-obsidian/60 leading-relaxed pt-1">
            Expires one (1) year from the date of recording unless a different date is specified.
            Must be recorded and posted on the job site before the first inspection.
          </p>
        </Section>
        <div className="pt-4 mt-2 border-t border-dashed border-obsidian/20 text-[10px] text-obsidian/40 font-mono uppercase tracking-[0.14em]">
          Signature · Notary Acknowledgment — on the generated PDF
        </div>
      </div>
    </div>
  );
}
