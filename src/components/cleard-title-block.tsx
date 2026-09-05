import wordmark from "@/assets/cleard-wordmark-copper.png.asset.json";

const COPPER = "#9C6B3F";

/** TODO: update Cleard address — placeholder until the real office address is confirmed. */
export const CLEARD_TITLE_BLOCK_FIRM = {
  addressLine1: "123 Cleard Way, Suite 100",
  addressLine2: "Miami, FL 33131",
  website: "clearedinc.com",
  preparedBy: "Cleard Engineering Services",
};

/** Document types that carry a Cleard-branded title block. */
export const ENGINEERING_DOC_KEYWORDS = [
  "engineer's letter",
  "engineers letter",
  "engineer letter",
  "pool structural",
  "screen enclosure",
  "new construction structural",
  "structural",
];

export function isEngineeringDeliverable(label?: string | null) {
  const l = (label ?? "").toLowerCase();
  return ENGINEERING_DOC_KEYWORDS.some((k) => l.includes(k));
}

export function CleardTitleBlock({
  projectName,
  projectAddress,
  documentType,
  documentDate,
  jobNo,
  sealImageUrl,
  className,
}: {
  projectName: string;
  projectAddress?: string;
  documentType: string;
  documentDate?: string;
  jobNo?: string;
  /** Populated once the assigned engineer's sealed document is delivered. */
  sealImageUrl?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`border border-black/15 bg-white p-5 ${className ?? ""}`}
      style={{ borderRadius: 3 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <img src={wordmark.url} alt="Cleard" className="h-7 w-auto" />
          <div className="mt-3 space-y-0.5 text-[12px] leading-snug text-black/70">
            <p>{CLEARD_TITLE_BLOCK_FIRM.addressLine1}</p>
            <p>{CLEARD_TITLE_BLOCK_FIRM.addressLine2}</p>
            <p style={{ color: COPPER }}>{CLEARD_TITLE_BLOCK_FIRM.website}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">Job No</p>
          <p className="mt-1 font-mono text-[13px] font-semibold text-black">{jobNo || "—"}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
            Date
          </p>
          <p className="mt-1 text-[13px] text-black">{documentDate || "—"}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Row label="Project">{projectName || "—"}</Row>
        <Row label="Address">{projectAddress || "—"}</Row>
        <Row label="Document type">{documentType}</Row>
        <Row label="Prepared by">{CLEARD_TITLE_BLOCK_FIRM.preparedBy}</Row>
      </dl>

      <div className="mt-4 border-t border-black/10 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">PE Stamp</p>
        <div
          className="mt-2 flex h-32 w-32 items-center justify-center border border-dashed"
          style={{ borderColor: COPPER, borderRadius: 3 }}
        >
          {sealImageUrl ? (
            <img src={sealImageUrl} alt="Engineer's Seal" className="h-full w-full object-contain" />
          ) : (
            <span className="px-2 text-center text-[10px] uppercase tracking-[0.14em] text-black/45">
              Engineer's Seal
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-black/50">
          Sealed by the assigned Florida-licensed professional engineer on delivery.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">{label}</dt>
      <dd className="mt-1 text-[13px] text-black">{children}</dd>
    </div>
  );
}

export default CleardTitleBlock;
