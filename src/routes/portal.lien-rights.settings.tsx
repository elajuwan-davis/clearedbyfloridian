import { createFileRoute } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell, Panel } from "@/components/ui-kit";
import {
  getLienSettings,
  saveClaimantProfile,
  setSignwellConnected,
  subscribeLienStore,
  type ClaimantProfile,
} from "@/lib/lien-rights-store";

export const Route = createFileRoute("/portal/lien-rights/settings")({
  head: () => ({
    meta: [
      { title: "Lien Rights Settings — Cleard" },
      {
        name: "description",
        content: "Manage your claimant profile and e-signature connection for lien documents.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LienSettingsPage,
});

function LienSettingsPage() {
  const settings = useSyncExternalStore(subscribeLienStore, getLienSettings, getLienSettings);
  const [form, setForm] = useState<ClaimantProfile>(settings.claimant);
  const [error, setError] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);

  function set<K extends keyof ClaimantProfile>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    const required: Array<[keyof ClaimantProfile, string]> = [
      ["companyName", "Company legal name"],
      ["licenseNumber", "License number"],
      ["licenseType", "License type"],
      ["mailingAddress", "Mailing address"],
      ["noticeEmail", "Email for lien notices"],
      ["phone", "Phone"],
    ];
    const missing = required.filter(([k]) => !String(form[k] ?? "").trim()).map(([, l]) => l);
    if (missing.length) {
      setError(`Required: ${missing.join(", ")}.`);
      return;
    }
    setError(null);
    saveClaimantProfile(form);
    toast.success("Claimant profile saved.");
  }

  return (
    <PageShell title="Lien Rights" meta="Settings">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Claimant Profile">
          <div className="space-y-3 p-4">
            <Field label="Company legal name">
              <Input
                className="rounded-none"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="License number">
                <Input
                  className="rounded-none"
                  value={form.licenseNumber}
                  onChange={(e) => set("licenseNumber", e.target.value)}
                />
              </Field>
              <Field label="License type">
                <Input
                  className="rounded-none"
                  value={form.licenseType}
                  onChange={(e) => set("licenseType", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Mailing address">
              <Input
                className="rounded-none"
                value={form.mailingAddress}
                onChange={(e) => set("mailingAddress", e.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email for lien notices">
                <Input
                  type="email"
                  className="rounded-none"
                  value={form.noticeEmail}
                  onChange={(e) => set("noticeEmail", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  className="rounded-none"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>
            {error && (
              <p className="text-[12px]" style={{ color: "#8C3B3B" }}>
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button size="sm" className="rounded-none" onClick={save}>
                Save
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Signature Settings">
          <div className="p-4">
            <div
              className="border p-4"
              style={{ borderColor: "var(--p-border)", backgroundColor: "var(--p-bg)" }}
            >
              {settings.signwellConnected ? (
                <>
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    <span
                      className="inline-block h-2 w-2"
                      style={{ backgroundColor: "#673147" }}
                      aria-hidden
                    />
                    SignWell connected
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted-foreground">
                    Lien documents can be sent for e-signature from the Documents tab.
                  </p>
                  <button
                    type="button"
                    className="mt-3 text-[12px] underline"
                    onClick={() => {
                      setSignwellConnected(false);
                      toast.success("SignWell disconnected.");
                    }}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <div className="text-[13px] font-medium">SignWell not connected</div>
                  <p className="mt-1.5 text-[12px] text-muted-foreground">
                    Connect SignWell to send lien documents for e-signature.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 rounded-none"
                    onClick={() => {
                      setApiKey("");
                      setKeyError(null);
                      setConnectOpen(true);
                    }}
                  >
                    Connect SignWell
                  </Button>
                </>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-md rounded-none">
          <DialogTitle className="text-[15px] font-semibold">Connect SignWell</DialogTitle>
          <DialogDescription className="text-[12px]">Enter your SignWell API key.</DialogDescription>
          <div className="mt-4">
            <Input
              className="rounded-none"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sw_live_…"
            />
            {keyError && (
              <p className="mt-2 text-[12px]" style={{ color: "#8C3B3B" }}>
                {keyError}
              </p>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-none"
              onClick={() => setConnectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-none"
              onClick={() => {
                if (!apiKey.trim()) {
                  setKeyError("API key is required.");
                  return;
                }
                setSignwellConnected(true);
                setConnectOpen(false);
                toast.success("SignWell connected.");
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
