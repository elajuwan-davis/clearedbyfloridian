import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileUp, FileText, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { getPermit } from "@/lib/permits-api";
import {
  createHoaSubmittal,
  checklistForType,
  type HoaSource,
} from "@/lib/hoa-submittals";

type NewSearch = { permitId?: string };

export const Route = createFileRoute("/portal/hoa-submittals/new")({
  validateSearch: (search: Record<string, unknown>): NewSearch => ({
    permitId: typeof search.permitId === "string" ? search.permitId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New HOA Submittal — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewHoaSubmittal,
});

function NewHoaSubmittal() {
  const navigate = useNavigate();
  const { permitId } = useSearch({ from: "/portal/hoa-submittals/new" });
  const session = useSession();
  const [busy, setBusy] = useState<HoaSource | null>(null);
  const [uploaded, setUploaded] = useState<{ path: string; filename: string } | null>(null);

  async function prefillFromPermit() {
    if (!permitId) return {};
    try {
      const p = await getPermit(permitId);
      if (!p) return {};
      return {
        permit_id: p.id,
        applicant_name: p.owner_name || p.poc || "",
        applicant_email: p.poc_email || "",
        applicant_phone: p.poc_phone || "",
        property_address: p.job_address,
        contractor_name: p.contractor_company,
        contractor_license: p.license_number,
        scope_of_work: p.description ?? "",
        project_description: p.description ?? "",
      };
    } catch {
      return {};
    }
  }

  async function startBoilerplate() {
    if (busy) return;
    setBusy("boilerplate");
    try {
      const prefill = await prefillFromPermit();
      const row = await createHoaSubmittal({
        source: "boilerplate",
        status: "draft",
        tenant_id: session.effectiveTenantId,
        created_by: session.userId,
        checklist: checklistForType(null),
        documents: [],
        missing_fields: [],
        extracted_fields: {},
        ...prefill,
      });
      toast.success("Draft HOA submittal created");
      navigate({ to: "/portal/hoa-submittals/$id", params: { id: row.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create HOA submittal");
      setBusy(null);
    }
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (busy) return;
    setBusy("uploaded_form");
    try {
      const tempKey = `hoa-uploads/${crypto.randomUUID()}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error } = await supabase.storage
        .from("permit-files")
        .upload(tempKey, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      setUploaded({ path: tempKey, filename: file.name });
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
      setBusy(null);
    }
  }

  async function startFromUpload() {
    if (!uploaded) return;
    try {
      const prefill = await prefillFromPermit();
      const row = await createHoaSubmittal({
        source: "uploaded_form",
        status: "draft",
        tenant_id: session.effectiveTenantId,
        created_by: session.userId,
        uploaded_form_path: uploaded.path,
        checklist: checklistForType(null),
        documents: [],
        // Auto-fillable fields from project — the GC completes the rest in the editor.
        extracted_fields: {
          note: "Cleard auto-fills applicant, address, phone, email, and scope from your project. Complete Village, Model Type, and any HOA-specific fields in the next screen.",
        },
        missing_fields: ["village_name", "model_type", "project_description"],
        ...prefill,
      });
      toast.success("Uploaded HOA form — auto-fill applied");
      navigate({ to: "/portal/hoa-submittals/$id", params: { id: row.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start submittal");
      setBusy(null);
    }
  }

  return (
    <PortalShell>
      <div className="space-y-8 max-w-4xl">
        <div>
          <Link to="/portal/hoa-submittals" className="inline-flex items-center gap-1 text-xs text-obsidian/60 hover:text-obsidian">
            <ArrowLeft className="h-3 w-3" /> HOA Submittals
          </Link>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-obsidian">New HOA Submittal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Two ways to start: upload the HOA's own ARC form for pre-fill, or use the Cleard boilerplate template.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Path 1 — upload */}
          <section className="border border-obsidian/10 rounded-[3px] bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-obsidian/70" />
              <h2 className="font-display text-2xl text-obsidian">Upload HOA Form</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Attach the HOA's ARC / architectural review PDF. Cleard pre-fills applicant, address, contact, and scope from your
              project. You fill in the remaining HOA-specific fields (Village, Model Type, etc.) in the editor.
            </p>
            {!uploaded ? (
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={onFilePicked}
                  disabled={busy !== null}
                />
                <span className="inline-flex items-center gap-2 border border-obsidian/20 hover:bg-obsidian/5 px-4 py-2 text-sm rounded-[3px]">
                  {busy === "uploaded_form" ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><FileUp className="h-4 w-4" /> Choose PDF</>}
                </span>
              </label>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-obsidian/80">
                  Uploaded: <span className="font-medium">{uploaded.filename}</span>
                </div>
                <Button variant="dark" className="rounded-[3px]" onClick={startFromUpload}>
                  Continue with auto-fill →
                </Button>
              </div>
            )}
          </section>

          {/* Path 2 — boilerplate */}
          <section className="border border-obsidian/10 rounded-[3px] bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-obsidian/70" />
              <h2 className="font-display text-2xl text-obsidian">Use Boilerplate</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Cleard's generic ARC submittal template covers the standard fields required by most South Florida HOAs and master
              associations. We generate a clean PDF for review and signature on submit.
            </p>
            <Button variant="dark" className="rounded-[3px]" onClick={startBoilerplate} disabled={busy !== null}>
              {busy === "boilerplate" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Start boilerplate →"}
            </Button>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
