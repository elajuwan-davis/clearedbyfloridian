import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { INVESTOR_ADMIN_PASSWORD } from "@/lib/investor-admin-password";
import {
  investorAddDomain,
  investorAdminData,
  investorGenerateCode,
  investorRemoveDomain,
} from "@/lib/investor-admin.functions";

export const Route = createFileRoute("/investor_/admin")({
  head: () => ({
    meta: [
      { title: "Investor Access Admin — Cleard" },
      { name: "description", content: "Manage investor deck access domains and one-time codes." },
      { property: "og:title", content: "Investor Access Admin — Cleard" },
      { property: "og:description", content: "Manage investor deck access domains and one-time codes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvestorAdminPage,
});

const BG = "#000000";
const SURFACE = "#000000";
const BORDER = "#3F5C5A";
const TEAL = "#E6E6FA";
const OFF = "#F6F6F6";
const MUTED = "rgba(255,255,255, 0.62)";
const SANS = "'Instrument Sans', sans-serif";
const MONO = "ui-monospace, Menlo, Monaco, monospace";
const SESSION_KEY = "investor_admin_ok";

type Domain = { id: string; domain: string; label: string; created_at: string };
type Code = {
  id: string;
  code: string;
  label: string;
  used: boolean;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const inputStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  color: OFF,
  borderRadius: 0,
};

const btnStyle: React.CSSProperties = {
  background: TEAL,
  color: "#FFFFFF",
  borderRadius: 0,
};

function fmt(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString();
}

function InvestorAdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        setPassword(sessionStorage.getItem(SESSION_KEY));
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (!ready) return <div style={{ background: BG, minHeight: "100vh" }} />;
  if (!password)
    return (
      <PasswordCard
        onOk={(pw) => {
          try {
            sessionStorage.setItem(SESSION_KEY, pw);
          } catch {
            /* ignore */
          }
          setPassword(pw);
        }}
      />
    );
  return <AdminConsole password={password} />;
}

function PasswordCard({ onOk }: { onOk: (pw: string) => void }) {
  const [value, setValue] = useState("");
  const [bad, setBad] = useState(false);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: BG, color: OFF, fontFamily: SANS }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value === INVESTOR_ADMIN_PASSWORD) onOk(value);
          else setBad(true);
        }}
        className="w-full max-w-[360px] p-6"
        style={{ border: `1px solid ${BORDER}`, background: SURFACE, borderRadius: 0 }}
      >
        <div
          className="text-[11px] uppercase tracking-[0.22em]"
          style={{ fontFamily: MONO, color: TEAL }}
        >
          Admin Access
        </div>
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setBad(false);
          }}
          placeholder="Password"
          className="mt-5 w-full px-4 py-3 text-[14px] outline-none"
          style={{ ...inputStyle, border: `1px solid ${bad ? "#C0392B" : BORDER}`, background: BG }}
        />
        <button type="submit" className="mt-3 w-full px-4 py-3 text-[14px] font-semibold" style={btnStyle}>
          Enter →
        </button>
        {bad && (
          <p className="mt-3 text-[12px]" style={{ color: "#C0392B" }}>
            Incorrect password.
          </p>
        )}
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-[18px] font-extrabold tracking-[-0.02em]" style={{ color: OFF }}>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-3 py-2 text-left text-[11px] uppercase tracking-[0.16em] font-medium"
      style={{ fontFamily: MONO, color: MUTED, borderBottom: `1px solid ${BORDER}` }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-3 text-[13px]" style={{ borderBottom: `1px solid ${BORDER}`, color: OFF }}>
      {children}
    </td>
  );
}

function codeStatus(c: Code) {
  if (c.used) return { label: "Used", color: "rgba(255,255,255,0.62)" };
  if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now())
    return { label: "Expired", color: "#C0392B" };
  return { label: "Active", color: TEAL };
}

function AdminConsole({ password }: { password: string }) {
  const load = useServerFn(investorAdminData);
  const addDomain = useServerFn(investorAddDomain);
  const removeDomain = useServerFn(investorRemoveDomain);
  const genCode = useServerFn(investorGenerateCode);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [dLabel, setDLabel] = useState("");
  const [dDomain, setDDomain] = useState("");
  const [cLabel, setCLabel] = useState("");
  const [cExpires, setCExpires] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await load({ data: { password } });
      setDomains(res.domains);
      setCodes(res.codes);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    }
  }, [load, password]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
    setBusy(false);
    await refresh();
  }

  const usedCodes = codes.filter((c) => c.used);

  return (
    <div className="min-h-screen px-6 py-16 lg:px-10" style={{ background: BG, color: OFF, fontFamily: SANS }}>
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-[11px] uppercase tracking-[0.22em]" style={{ fontFamily: MONO, color: TEAL }}>
          Cleard · Investor Access
        </div>
        <h1 className="mt-4 text-[30px] font-extrabold tracking-[-0.03em]">Access Administration</h1>
        {error && (
          <p className="mt-5 px-4 py-3 text-[13px]" style={{ border: `1px solid #C0392B`, color: "#C0392B" }}>
            {error}
          </p>
        )}

        {/* 1. Allowed Domains */}
        <Section title="Allowed Domains">
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!dLabel.trim() || !dDomain.trim()) return;
              void run(async () => {
                await addDomain({ data: { password, label: dLabel.trim(), domain: dDomain.trim() } });
                setDLabel("");
                setDDomain("");
              });
            }}
          >
            <input
              value={dLabel}
              onChange={(e) => setDLabel(e.target.value)}
              placeholder="Firm name"
              className="min-w-[180px] flex-1 px-4 py-3 text-[14px] outline-none"
              style={inputStyle}
            />
            <input
              value={dDomain}
              onChange={(e) => setDDomain(e.target.value)}
              placeholder="firm.com"
              className="min-w-[180px] flex-1 px-4 py-3 text-[14px] outline-none"
              style={{ ...inputStyle, fontFamily: MONO }}
            />
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-3 text-[14px] font-semibold disabled:opacity-60"
              style={btnStyle}
            >
              Add →
            </button>
          </form>

          <table className="mt-6 w-full border-collapse" style={{ border: `1px solid ${BORDER}` }}>
            <thead>
              <tr>
                <Th>Label</Th>
                <Th>Domain</Th>
                <Th>Date Added</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {domains.length === 0 && (
                <tr>
                  <Td>No domains yet.</Td>
                  <Td> </Td>
                  <Td> </Td>
                  <Td> </Td>
                </tr>
              )}
              {domains.map((d) => (
                <tr key={d.id}>
                  <Td>{d.label}</Td>
                  <Td>
                    <span style={{ fontFamily: MONO, color: TEAL }}>{d.domain}</span>
                  </Td>
                  <Td>{fmt(d.created_at)}</Td>
                  <Td>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!confirm(`Remove ${d.domain}?`)) return;
                        void run(() => removeDomain({ data: { password, id: d.id } }));
                      }}
                      className="px-3 py-1.5 text-[12px]"
                      style={{ border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 0 }}
                    >
                      Remove
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 2. Access Codes */}
        <Section title="Access Codes">
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!cLabel.trim()) return;
              void run(async () => {
                const res = await genCode({
                  data: { password, label: cLabel.trim(), expiresAt: cExpires || null },
                });
                setNewCode(res.code);
                setCLabel("");
                setCExpires("");
              });
            }}
          >
            <input
              value={cLabel}
              onChange={(e) => setCLabel(e.target.value)}
              placeholder="Who is this for?"
              className="min-w-[220px] flex-1 px-4 py-3 text-[14px] outline-none"
              style={inputStyle}
            />
            <input
              type="date"
              value={cExpires}
              onChange={(e) => setCExpires(e.target.value)}
              className="px-4 py-3 text-[14px] outline-none"
              style={{ ...inputStyle, fontFamily: MONO }}
            />
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-3 text-[14px] font-semibold disabled:opacity-60"
              style={btnStyle}
            >
              Generate →
            </button>
          </form>

          <table className="mt-6 w-full border-collapse" style={{ border: `1px solid ${BORDER}` }}>
            <thead>
              <tr>
                <Th>Label</Th>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th>Used At</Th>
                <Th>Expires At</Th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 && (
                <tr>
                  <Td>No codes yet.</Td>
                  <Td> </Td>
                  <Td> </Td>
                  <Td> </Td>
                  <Td> </Td>
                </tr>
              )}
              {codes.map((c) => {
                const s = codeStatus(c);
                return (
                  <tr key={c.id}>
                    <Td>{c.label}</Td>
                    <Td>
                      <span style={{ fontFamily: MONO, letterSpacing: "0.14em" }}>{c.code}</span>
                    </Td>
                    <Td>
                      <span
                        className="px-2 py-1 text-[11px] uppercase tracking-[0.14em]"
                        style={{ fontFamily: MONO, border: `1px solid ${s.color}`, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </Td>
                    <Td>{fmt(c.used_at)}</Td>
                    <Td>{fmt(c.expires_at)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>

        {/* 3. Access Log */}
        <Section title="Access Log">
          <table className="w-full border-collapse" style={{ border: `1px solid ${BORDER}` }}>
            <thead>
              <tr>
                <Th>Label</Th>
                <Th>Code</Th>
                <Th>Used At</Th>
              </tr>
            </thead>
            <tbody>
              {usedCodes.length === 0 && (
                <tr>
                  <Td>No codes redeemed yet.</Td>
                  <Td> </Td>
                  <Td> </Td>
                </tr>
              )}
              {usedCodes
                .slice()
                .sort((a, b) => (b.used_at ?? "").localeCompare(a.used_at ?? ""))
                .map((c) => (
                  <tr key={c.id}>
                    <Td>{c.label}</Td>
                    <Td>
                      <span style={{ fontFamily: MONO, letterSpacing: "0.14em" }}>{c.code}</span>
                    </Td>
                    <Td>{fmt(c.used_at)}</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Section>
      </div>

      {newCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(6,8,6,0.82)" }}
        >
          <div
            className="w-full max-w-[420px] p-6"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 0 }}
          >
            <p className="text-[13px]" style={{ color: MUTED }}>
              Copy this code — it will not be shown again:
            </p>
            <div
              className="mt-4 px-4 py-4 text-center text-[22px] font-semibold"
              style={{ fontFamily: MONO, letterSpacing: "0.2em", color: TEAL, border: `1px solid ${TEAL}` }}
            >
              {newCode}
            </div>
            <button
              type="button"
              className="mt-5 w-full px-4 py-3 text-[14px] font-semibold"
              style={btnStyle}
              onClick={() => {
                void navigator.clipboard?.writeText(newCode).catch(() => undefined);
                setNewCode(null);
              }}
            >
              Copy &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
