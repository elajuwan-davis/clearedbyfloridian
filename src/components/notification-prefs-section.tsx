import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getPrefs, upsertPrefs, type NotifPrefs } from "@/lib/notifications-api";

const EVENTS: Array<{ key: keyof NotifPrefs; email: keyof NotifPrefs; sms: keyof NotifPrefs; label: string }> = [
  { key: "email_permit_issued", email: "email_permit_issued", sms: "sms_permit_issued", label: "Permit Issued" },
  { key: "email_inspection_passed", email: "email_inspection_passed", sms: "sms_inspection_passed", label: "Inspection Passed" },
  { key: "email_inspection_failed", email: "email_inspection_failed", sms: "sms_inspection_failed", label: "Inspection Failed" },
  { key: "email_action_required", email: "email_action_required", sms: "sms_action_required", label: "Document Missing / Action Required" },
  { key: "email_submission_received", email: "email_submission_received", sms: "sms_submission_received", label: "Submission Received by Ops" },
];

export function NotificationPrefsSection() {
  const [prefs, setPrefs] = useState<Partial<NotifPrefs>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPrefs()
      .then((p) => {
        if (p) setPrefs(p);
      })
      .finally(() => setLoaded(true));
  }, []);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] } as Partial<NotifPrefs>));
  }

  async function save() {
    try {
      await upsertPrefs(prefs);
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <section>
      <div className="mb-5">
        <h2 className="display-serif text-2xl text-obsidian">Notification Preferences</h2>
        <p className="mt-1 text-sm text-obsidian/55">
          Choose which permit events send you alerts. SMS requires a phone number below.
        </p>
      </div>

      <div className="border border-obsidian/15 bg-white rounded-[3px] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian/[0.03] font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60">
            <tr>
              <th className="text-left px-4 py-2.5">Event</th>
              <th className="text-center px-4 py-2.5 w-24">Email</th>
              <th className="text-center px-4 py-2.5 w-24">SMS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian/10">
            {EVENTS.map((e) => (
              <tr key={e.label}>
                <td className="px-4 py-3 text-obsidian">{e.label}</td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(prefs[e.email])}
                    onChange={() => toggle(e.email)}
                    disabled={!loaded}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(prefs[e.sms])}
                    onChange={() => toggle(e.sms)}
                    disabled={!loaded}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 max-w-sm">
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65 mb-1.5">
            Phone Number (SMS)
          </span>
          <input
            value={(prefs.phone_number ?? "") as string}
            onChange={(e) => setPrefs((p) => ({ ...p, phone_number: e.target.value }))}
            placeholder="+1 (561) 555-0100"
            className="w-full border border-obsidian/15 focus:border-obsidian/40 outline-none px-3 py-2 rounded-[3px] text-sm text-obsidian bg-white"
          />
        </label>
        <p className="mt-1 text-xs text-obsidian/45">
          SMS delivery is pending Twilio setup — preferences will apply automatically once configured.
        </p>
      </div>

      <div className="mt-4">
        <button
          onClick={save}
          className="inline-flex items-center gap-2 bg-obsidian text-paper px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px]"
        >
          Save Preferences
        </button>
      </div>
    </section>
  );
}
