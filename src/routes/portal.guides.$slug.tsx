import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Printer,
  Download,
  FileText,
  ClipboardCheck,
  ShieldAlert,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { getPortalGuide, type PortalGuide } from "@/lib/portal-guides-data";
import { generateNTBO, generateOwnerAuth, downloadPdf } from "@/lib/private-provider-forms";
import { FLORIDIAN_FIRM } from "@/lib/floridian-firm";

export const Route = createFileRoute("/portal/guides/$slug")({
  head: () => ({
    meta: [
      { title: "Project Guide — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }: { params: { slug: string } }) => {
    const guide = getPortalGuide(params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  notFoundComponent: () => (
    <PortalShell>
      <div className="text-center py-20 text-sm text-obsidian/60">Guide not found.</div>
    </PortalShell>
  ),
  component: GuideDetail,
});

function GuideDetail() {
  const { guide } = Route.useLoaderData() as { guide: PortalGuide };

  return (
    <PortalShell>
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-6 md:-mt-10 print:mx-0 print:mt-0">
        {/* Obsidian header */}
        <section
          className="px-4 sm:px-6 md:px-10 py-10 md:py-14 text-paper print:bg-white print:text-black print:py-6"
          style={{ backgroundColor: "var(--obsidian)" }}
        >
          <div className="mx-auto max-w-5xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] print:hidden"
                 style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}>
              <Link to="/portal/guides" className="hover:text-paper inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" strokeWidth={1.5} /> Project Guides
              </Link>
              <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              <span style={{ color: "var(--sky)" }}>{guide.category}</span>
            </nav>

            <div className="mt-5 inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] rounded-[2px] border"
                 style={{ borderColor: "color-mix(in oklab, var(--sky) 40%, transparent)", color: "var(--sky)", backgroundColor: "color-mix(in oklab, var(--sky) 10%, transparent)" }}>
              {guide.category}
            </div>

            <h1 className="display-serif mt-4 text-4xl md:text-5xl leading-tight print:text-3xl">
              {guide.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em]"
                 style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}>
              <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" strokeWidth={1.5}/> Docs {guide.docCount}</span>
              <span className="inline-flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" strokeWidth={1.5}/> Inspections {guide.inspectionCount}</span>
              <span>{guide.lastUpdated}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 print:hidden">
              <Button
                onClick={() => window.print()}
                className="rounded-[3px] bg-white text-obsidian hover:bg-white/90"
              >
                <Printer className="h-4 w-4 mr-2" strokeWidth={1.75} /> Print Guide
              </Button>
            </div>

            {/* Disclaimer */}
            <div
              className="mt-8 p-4 border rounded-[3px] flex gap-3 text-sm leading-relaxed"
              style={{
                borderColor: "color-mix(in oklab, var(--sky) 30%, transparent)",
                backgroundColor: "color-mix(in oklab, var(--sky) 8%, transparent)",
                color: "color-mix(in oklab, var(--paper) 82%, transparent)",
              }}
            >
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--sky)" }} strokeWidth={1.5}/>
              <div>
                <div className="font-semibold text-paper mb-1">Reference only</div>
                Requirements vary by jurisdiction. Confirm scope with your Flōridian permit
                coordinator before submitting. This guide reflects the private provider
                workflow under FL Statute §553.791.
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <div className="px-4 sm:px-6 md:px-10 py-12 md:py-16 print:py-6">
          <div className="mx-auto max-w-5xl space-y-14 print:space-y-8">

            {/* SECTION 1 — Required Documents */}
            <Section eyebrow="01" icon={FileText} title="Required Documents" subtitle="Submit these with your initial project package.">
              <SubGroup label="Always required">
                <ul className="space-y-4">
                  {guide.documents.filter(d => d.required === "always").map((d, i) => (
                    <DocRow key={d.name} idx={i + 1} name={d.name} description={d.description} required />
                  ))}
                </ul>
              </SubGroup>
              <SubGroup label="As applicable">
                <ul className="space-y-4">
                  {guide.documents.filter(d => d.required === "conditional").map((d, i) => (
                    <DocRow key={d.name} idx={i + 1} name={d.name} description={d.description} />
                  ))}
                </ul>
              </SubGroup>

              {guide.downloads.length > 0 && (
                <div className="mt-8">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-obsidian/55 mb-3">
                    Downloadable Forms
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {guide.downloads.map((f) => {
                      const isNTBO = /ntbo|notice to building/i.test(f.title);
                      const isOwner = /owner auth/i.test(f.title);
                      const genHandler = async () => {
                        if (isNTBO) {
                          const bytes = await generateNTBO({
                            projectName: "",
                            parcelTaxId: "",
                            services: { plansReview: true, inspections: true },
                            signatoryType: "Corporation",
                            firmName: FLORIDIAN_FIRM.firmName,
                            privateProvider: FLORIDIAN_FIRM.privateProvider,
                            addressLine1: FLORIDIAN_FIRM.addressLine1,
                            addressLine2: FLORIDIAN_FIRM.addressLine2,
                            telephone: FLORIDIAN_FIRM.telephone,
                            email: FLORIDIAN_FIRM.email,
                            licenseNumber: FLORIDIAN_FIRM.licenseNumber,
                            printNameCorporation: FLORIDIAN_FIRM.printNameCorporation,
                            representativeName: FLORIDIAN_FIRM.representativeName,
                          });
                          downloadPdf(bytes, "NTBO_Template.pdf");
                        } else if (isOwner) {
                          const bytes = await generateOwnerAuth({
                            propertyAddress: "",
                            permitProjectNo: "",
                            firmName: FLORIDIAN_FIRM.firmName,
                            privateProvider: FLORIDIAN_FIRM.privateProvider,
                            telephone: FLORIDIAN_FIRM.telephone,
                            email: FLORIDIAN_FIRM.email,
                            licenseNumber: FLORIDIAN_FIRM.licenseNumber,
                          });
                          downloadPdf(bytes, "OwnerAuth_Template.pdf");
                        } else if (f.href) {
                          window.open(f.href, "_blank");
                        }
                      };
                      const canGen = isNTBO || isOwner || !!f.href;
                      return (
                        <div key={f.title} className="border border-obsidian/12 rounded-[3px] p-4 bg-paper-warm flex flex-col">
                          <div className="text-sm font-semibold text-obsidian leading-snug">{f.title}</div>
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">{f.meta}</div>
                          <Button
                            disabled={!canGen}
                            variant="outline"
                            className="rounded-[3px] mt-4 self-start"
                            onClick={genHandler}
                          >
                            <Download className="h-4 w-4 mr-2" strokeWidth={1.75} />
                            {isNTBO || isOwner ? "Generate Pre-Filled PDF" : (f.href ? "Download PDF" : "PDF pending")}
                          </Button>
                          {(isNTBO || isOwner) && (
                            <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-obsidian/45">
                              Firm details pre-filled · edit per project from the Documents tab
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            {/* SECTION 2 — Plan Review */}
            <Section eyebrow="02" icon={BookOpen} title="Plan Review" subtitle="What Flōridian reviews before approving your permit application.">
              <ol className="space-y-5">
                {guide.planReview.map((p) => (
                  <li key={p.n} className="flex gap-5 border-t border-obsidian/10 pt-5 first:border-0 first:pt-0">
                    <div className="font-mono text-[11px] tabular-nums text-obsidian/45 pt-0.5 w-8 shrink-0">
                      #{p.n}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-obsidian text-[15px]">{p.title}</h3>
                        {p.tags.map((t) => <TagPill key={t} label={t} />)}
                      </div>
                      <p className="text-sm text-obsidian/75 leading-relaxed">{p.description}</p>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">{p.code}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            {/* SECTION 3 — Inspections */}
            <Section eyebrow="03" icon={ClipboardCheck} title="Inspections" subtitle="Required field inspections in sequence.">
              <div className="space-y-4">
                {guide.inspections.map((p) => (
                  <details key={p.code} open className="border border-obsidian/12 rounded-[3px] bg-white group">
                    <summary className="cursor-pointer list-none px-5 py-4 flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-8 min-w-[3rem] items-center justify-center bg-obsidian px-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-paper rounded-[3px]">
                        {p.code}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-obsidian/50">{p.phase}</div>
                        <div className="font-semibold text-obsidian">{p.title}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.tags.map((t) => <TagPill key={t} label={t} />)}
                      </div>
                    </summary>
                    <div className="px-5 pb-5 pt-1 border-t border-obsidian/8">
                      <ul className="space-y-2 mt-3">
                        {p.checks.map((c, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-obsidian/80 leading-relaxed">
                            <span className="font-mono text-[10px] text-obsidian/40 tabular-nums mt-1 w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">{p.refs}</div>
                    </div>
                  </details>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

function Section({
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  icon: typeof FileText;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start gap-4 mb-6 pb-4 border-b border-obsidian/15">
        <div className="grid place-items-center h-10 w-10 rounded-[3px] shrink-0" style={{ backgroundColor: "color-mix(in oklab, var(--sky) 18%, transparent)", color: "var(--obsidian)" }}>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-obsidian/50">
            Section {eyebrow}
          </div>
          <h2 className="display-serif text-2xl md:text-3xl text-obsidian leading-tight">{title}</h2>
          <p className="mt-1 text-sm text-obsidian/65 italic">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SubGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-obsidian/55 mb-3">{label}</div>
      {children}
    </div>
  );
}

function DocRow({ idx, name, description, required }: { idx: number; name: string; description: string; required?: boolean }) {
  return (
    <li className="flex gap-4">
      <div className="font-mono text-[11px] tabular-nums text-obsidian/45 pt-0.5 w-6 shrink-0">{String(idx).padStart(2, "0")}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-obsidian">{name}</span>
          {required && <TagPill label="Required" tone="green" />}
        </div>
        <p className="text-sm text-obsidian/70 leading-relaxed mt-1">{description}</p>
      </div>
    </li>
  );
}

function TagPill({ label, tone = "default" }: { label: string; tone?: "default" | "green" }) {
  const l = label.toLowerCase();
  let style: React.CSSProperties;
  if (tone === "green" || l === "required") {
    style = { color: "oklch(0.45 0.14 145)", borderColor: "oklch(0.62 0.14 145 / 0.4)", backgroundColor: "oklch(0.62 0.14 145 / 0.1)" };
  } else if (l.includes("life safety") || l === "critical") {
    style = { color: "var(--oxblood, #7a1e1e)", borderColor: "color-mix(in oklab, var(--oxblood, #7a1e1e) 40%, transparent)", backgroundColor: "color-mix(in oklab, var(--oxblood, #7a1e1e) 8%, transparent)" };
  } else if (l === "electrical" || l === "plumbing" || l === "structural") {
    style = { color: "var(--obsidian)", borderColor: "color-mix(in oklab, var(--obsidian) 25%, transparent)", backgroundColor: "color-mix(in oklab, var(--sky) 14%, transparent)" };
  } else {
    style = { color: "var(--obsidian)", borderColor: "color-mix(in oklab, var(--obsidian) 20%, transparent)", backgroundColor: "color-mix(in oklab, var(--obsidian) 5%, transparent)" };
  }
  return (
    <span
      className="inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] rounded-[2px] border"
      style={style}
    >
      {label}
    </span>
  );
}
