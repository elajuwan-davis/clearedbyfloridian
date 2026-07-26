// Snapshot of GC compliance documents attached to a specific permit
// submittal. Persisted on the permit at `intake_payload.compliance_submittal`
// so that later updates to a doc (new COI mid-project, license renewal, etc.)
// don't retroactively rewrite what was sent with earlier submissions.

import { docStatus, loadGcCompliance, type GcDocKey, type GcDocRecord } from "./gc-compliance";

export type SubmittalDocSnapshot = {
  key: GcDocKey;
  label: string;
  fileName: string | null;
  expiration: string | null;
  /** Snapshot of the doc's updatedAt at the moment it was attached — acts as the version stamp. */
  version: string;
  /** When the GC attached (or re-attached) this doc to the submittal. */
  capturedAt: string;
};

/** Docs valid or expiring-soon default to attached; expired/missing never do. */
export function autoSelectKeys(docs: GcDocRecord[]): GcDocKey[] {
  return docs
    .filter((d) => {
      const s = docStatus(d);
      return s === "valid" || s === "warning";
    })
    .map((d) => d.key);
}

export function snapshotFromDoc(rec: GcDocRecord, existing?: SubmittalDocSnapshot): SubmittalDocSnapshot {
  return {
    key: rec.key,
    label: rec.label,
    fileName: rec.fileName ?? null,
    expiration: rec.expiration,
    version: rec.updatedAt ?? new Date().toISOString(),
    capturedAt: existing?.capturedAt ?? new Date().toISOString(),
  };
}

export function buildSnapshots(
  keys: GcDocKey[],
  docs: GcDocRecord[],
  previous: SubmittalDocSnapshot[] = [],
): SubmittalDocSnapshot[] {
  return keys
    .map((k) => {
      const rec = docs.find((d) => d.key === k);
      if (!rec) return null;
      const prior = previous.find((p) => p.key === k);
      // If the prior snapshot still matches the current on-file version, keep
      // its capturedAt so the UI shows "originally attached at X".
      if (prior && prior.version === (rec.updatedAt ?? prior.version)) {
        return { ...prior, label: rec.label, fileName: rec.fileName ?? null, expiration: rec.expiration };
      }
      return snapshotFromDoc(rec, prior);
    })
    .filter((x): x is SubmittalDocSnapshot => x !== null);
}

/** Pull the current on-file version for a single key so a GC can re-attach mid-project. */
export function refreshSnapshot(key: GcDocKey): SubmittalDocSnapshot | null {
  const rec = loadGcCompliance().find((d) => d.key === key);
  if (!rec || !rec.onFile) return null;
  return snapshotFromDoc(rec);
}
