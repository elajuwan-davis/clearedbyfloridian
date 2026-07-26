// Municipality Readiness — surfaces the two blockers that stop a submission
// before docs are uploaded:
//   1. Do we have a permit portal login on file for this municipality?
//   2. Are the required company docs (COI-GL, COI-WC, DBPR, BTR) valid?
//
// Rendered on Pre-Check intake directly under the Dispatch card so the GC
// resolves red items before proceeding to document upload.

import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, ShieldCheck, ShieldAlert, Upload, CheckCircle2, AlertTriangle, XCircle, Loader2, Eye, EyeOff, X, Paperclip } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { savePortalLogin, listPortalLoginFlags } from "@/lib/portal-logins.functions";
import { slugifyMunicipality } from "@/lib/intelligence";
import { btrRequiredForSlug, docStatus, loadGcCompliance, type GcDocKey, type GcDocRecord } from "@/lib/gc-compliance";
import { autoSelectKeys, buildSnapshots, type SubmittalDocSnapshot } from "@/lib/submittal-package";

type LoginFlag = {
  municipality_slug: string;
  city_name: string;
  notes: string | null;
  updated_at: string;
};

export function MunicipalityReadinessPanel({ municipality }: { municipality: string }) {
  const slug = useMemo(() => slugifyMunicipality(municipality), [municipality]);
  const [flags, setFlags] = useState<LoginFlag[] | null>(null);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [docs, setDocs] = useState<GcDocRecord[]>(loadGcCompliance());

  const refreshFlags = () => {
    setLoadingFlags(true);
    (listPortalLoginFlags as any)({})
      .then((r: LoginFlag[]) => setFlags(r ?? []))
      .catch(() => setFlags([]))
      .finally(() => setLoadingFlags(false));
  };

  useEffect(() => {
    refreshFlags();
    const onDocs = () => setDocs(loadGcCompliance());
    window.addEventListener("cleard:gc-compliance-updated", onDocs);
    window.addEventListener("storage", onDocs);
    return () => {
      window.removeEventListener("cleard:gc-compliance-updated", onDocs);
      window.removeEventListener("storage", onDocs);
    };
  }, []);

  if (!municipality || !slug) return null;

  const hasLogin = !!flags?.some((f) => f.municipality_slug === slug);
  const btrRequired = btrRequiredForSlug(slug);
  const shown = docs.filter((d) => (d.key === "btr" ? btrRequired : true));

  return (
    <div className="bg-white border border-obsidian/15 rounded-[3px] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-obsidian text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <div className="font-mono text-[11px] uppercase tracking-[0.18em]">Municipality Readiness</div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/60">{municipality}</span>
      </div>

      {/* Portal login row */}
      <div className="px-5 py-4 border-b border-obsidian/10 flex items-start gap-3">
        <KeyRound className="h-4 w-4 mt-0.5 text-obsidian/60 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="eyebrow text-obsidian/50 mb-1">Permit Portal Login</div>
          {loadingFlags ? (
            <div className="flex items-center gap-2 text-xs text-obsidian/50">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking credentials vault…
            </div>
          ) : hasLogin ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 border border-emerald-600/40 bg-emerald-50 text-emerald-800 rounded-[3px] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em]">
                <CheckCircle2 className="h-3 w-3" /> Portal Login on File
              </span>
              <Link
                to="/building-dept-logins"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian"
              >
                Edit →
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 border border-amber-500/40 bg-amber-50 text-amber-900 rounded-[3px] px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em]">
                <ShieldAlert className="h-3 w-3" /> No login saved for {municipality}
              </span>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-1.5 bg-obsidian text-white rounded-[3px] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
              >
                Add Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Required documents */}
      <div className="px-5 py-4">
        <div className="eyebrow text-obsidian/50 mb-3">Required Documents</div>
        <div className="divide-y divide-obsidian/5">
          {shown.map((d) => (
            <DocRow key={d.key} rec={d} />
          ))}
        </div>
        <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/45">
          Any red item must be resolved before submittal.
        </p>
      </div>

      {addOpen && (
        <AddLoginDialog
          municipality={municipality}
          slug={slug}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            refreshFlags();
          }}
        />
      )}
    </div>
  );
}

function DocRow({ rec }: { rec: GcDocRecord }) {
  const state = docStatus(rec);
  const badge = {
    valid: {
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />,
      cls: "border-emerald-600/40 bg-emerald-50 text-emerald-800",
      label: "Valid",
    },
    warning: {
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />,
      cls: "border-amber-500/40 bg-amber-50 text-amber-900",
      label: "Expiring Soon",
    },
    expired: {
      icon: <XCircle className="h-3.5 w-3.5 text-red-700" />,
      cls: "border-red-500/40 bg-red-50 text-red-900",
      label: "Expired",
    },
    missing: {
      icon: <XCircle className="h-3.5 w-3.5 text-red-700" />,
      cls: "border-red-500/40 bg-red-50 text-red-900",
      label: "Missing",
    },
  }[state];
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-obsidian truncate">{rec.label}</div>
        <div className="text-[11px] font-mono text-obsidian/50">
          {rec.expiration ? `Expires ${rec.expiration}` : "No expiration on file"}
        </div>
      </div>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-[3px] text-[10px] font-mono uppercase tracking-[0.14em] ${badge.cls}`}>
        {badge.icon} {badge.label}
      </span>
      {(state === "expired" || state === "missing") && (
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white text-obsidian rounded-[3px] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-obsidian/5"
        >
          <Upload className="h-3 w-3" /> Upload Now
        </Link>
      )}
    </div>
  );
}

function AddLoginDialog({
  municipality,
  slug,
  onClose,
  onSaved,
}: {
  municipality: string;
  slug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Username and password are required.");
      return;
    }
    setSaving(true);
    try {
      await (savePortalLogin as any)({
        data: {
          municipality_slug: slug,
          city_name: municipality,
          username: username.trim(),
          password: password.trim(),
          notes: notes.trim() || null,
        },
      });
      toast.success(`Portal login saved for ${municipality}.`);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save login.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-obsidian/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-obsidian/15 rounded-[3px] w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 bg-obsidian text-white">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <div className="font-mono text-[11px] uppercase tracking-[0.18em]">Add Portal Login</div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <div className="eyebrow text-obsidian/50 mb-1">Municipality</div>
            <div className="text-sm text-obsidian">{municipality}</div>
          </div>
          <div>
            <label className="eyebrow text-obsidian/55 block mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="portal username or email"
              className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm text-obsidian focus:border-obsidian/40 focus:outline-none rounded-[3px] font-mono"
            />
          </div>
          <div>
            <label className="eyebrow text-obsidian/55 block mb-1">Password</label>
            <div className="flex items-center gap-1 border border-obsidian/20 bg-white rounded-[3px] focus-within:border-obsidian/40">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-obsidian focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="p-2 text-obsidian/45 hover:text-obsidian"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="eyebrow text-obsidian/55 block mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. MFA on Eman's phone"
              className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm text-obsidian focus:border-obsidian/40 focus:outline-none rounded-[3px]"
            />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/45">
            Encrypted at rest with AES-256-GCM. Plaintext never stored.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-obsidian/10">
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-obsidian text-white rounded-[3px] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {saving ? "Saving…" : "Save Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
