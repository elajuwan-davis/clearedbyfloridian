import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PROJECTS, fullAddress } from "@/lib/projects-data";
import { projectStatusMeta } from "@/lib/status-badges";
import { PageShell, SearchInput, StatusChip, TableShell, EmptyState, Panel } from "@/components/ui-kit";

export const Route = createFileRoute("/portal/projects")({
  component: ProjectsPage,
});

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function ProjectsPage() {
  const [q, setQ] = useState("");
  const query = q.toLowerCase();
  const filtered = PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query) ||
      p.address.toLowerCase().includes(query) ||
      p.permit_no.toLowerCase().includes(query) ||
      p.county.toLowerCase().includes(query),
  );

  return (
    <PageShell
      crumbs={[{ label: "Workspace" }, { label: "Projects" }]}
      title="Projects"
      meta={`${filtered.length} of ${PROJECTS.length} shown`}
      toolbar={
        <div className="p-inset min-w-0 flex-1 sm:max-w-sm">
          <SearchInput value={q} onChange={setQ} placeholder="Search project, client, address, county, permit number" />
        </div>
      }
    >
      {filtered.length === 0 ? (
        <Panel padded={false}>
          <EmptyState title="No permits match" description="Adjust your search to see more results." />
        </Panel>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className="w-[120px]">Permit</th>
              <th>Project</th>
              <th className="w-[160px]">Client</th>
              <th className="w-[120px]">Value</th>
              <th className="w-[1%] text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const meta = projectStatusMeta[p.status];
              return (
                <tr key={p.id} className="cursor-pointer">
                  <td className="p-0">
                    <Link to="/portal/projects/$id" params={{ id: p.id }} className="block px-3 py-2.5 text-[11.5px] tabular-nums">
                      {p.permit_no}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link to="/portal/projects/$id" params={{ id: p.id }} className="block min-w-0 px-3 py-2.5">
                      <div className="truncate text-[12.5px] font-medium">{p.name}</div>
                      <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{fullAddress(p)}</div>
                      {p.scope && (
                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{p.scope}</div>
                      )}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link to="/portal/projects/$id" params={{ id: p.id }} className="block px-3 py-2.5 text-[12.5px]">
                      {p.client}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link to="/portal/projects/$id" params={{ id: p.id }} className="block px-3 py-2.5 text-[12.5px] tabular-nums">
                      {fmtMoney(p.value_cents)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link to="/portal/projects/$id" params={{ id: p.id }} className="flex justify-end px-3 py-2.5">
                      <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </PageShell>
  );
}
