import { createFileRoute, notFound, Link } from "@tanstack/react-router";

import { MarketingShell } from "@/components/marketing-shell";
import { TradePage } from "@/components/trade-page";
import { getTrade, TRADES } from "@/lib/trades";

export const Route = createFileRoute("/trades/$slug")({
  loader: ({ params }) => {
    const trade = getTrade(params.slug);
    if (!trade) throw notFound();
    return { trade };
  },
  head: ({ loaderData }) => {
    const trade = loaderData?.trade;
    if (!trade) {
      return {
        meta: [{ title: "Trade not found — Cleard" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `Cleard for ${trade.navLabel} — Permitting Back Office`;
    return {
      meta: [
        { title },
        { name: "description", content: trade.subhead },
        { property: "og:title", content: trade.headline },
        { property: "og:description", content: trade.subhead },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: TradeNotFound,
  component: TradeRoute,
});

function TradeRoute() {
  const { trade } = Route.useLoaderData();
  return <TradePage trade={trade} />;
}

function TradeNotFound() {
  return (
    <MarketingShell>
      <div style={{ background: "#FFFFFF", color: "#FFFFFF" }}>
        <div className="mx-auto max-w-3xl px-5 py-32 lg:px-8">
          <h1 style={{ fontWeight: 800, fontSize: "2.25rem", letterSpacing: "-0.03em" }}>
            We don't have a page for that trade yet.
          </h1>
          <ul className="mt-8 space-y-2">
            {TRADES.map((t) => (
              <li key={t.slug}>
                <Link
                  to="/trades/$slug"
                  params={{ slug: t.slug }}
                  className="text-[15px] underline"
                  style={{ color: "#9C6B3F" }}
                >
                  {t.navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MarketingShell>
  );
}
