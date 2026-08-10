import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="label-eyebrow">Error · 404</div>
        <h1 className="mt-4 font-display text-6xl tracking-tight text-foreground">Not found.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          That page isn't on the plan set.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="label-eyebrow">Error · 500</div>
        <h1 className="mt-4 font-display text-3xl tracking-tight">Something didn't load.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Try again, or head back to the index page.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-sm border hairline bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cleard — Private Provider Permitting for South Florida" },
      {
        name: "description",
        content:
          "Cleard is the private-provider permitting partner for South Florida's elite general contractors — plan review, inspections, and permit coordination on a statutory clock.",
      },
      { name: "author", content: "Cleard" },
      { property: "og:title", content: "Cleard — Private Provider Permitting for South Florida" },
      {
        property: "og:description",
        content:
          "Private-provider plan review and inspections under FL Statute 553.791. Broward through the Treasure Coast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Cleard — Private Provider Permitting for South Florida" },
      { name: "description", content: "Clëared is a full-stack permitting portal and marketing website for residential builders." },
      { property: "og:description", content: "Clëared is a full-stack permitting portal and marketing website for residential builders." },
      { name: "twitter:description", content: "Clëared is a full-stack permitting portal and marketing website for residential builders." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/60e26fdd-43f6-4b23-a843-5d92cc1e18e2/id-preview-3cf4a0b5--0b3e81be-56ac-4636-ba0c-f0ab606037c7.lovable.app-1780806677456.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/60e26fdd-43f6-4b23-a843-5d92cc1e18e2/id-preview-3cf4a0b5--0b3e81be-56ac-4636-ba0c-f0ab606037c7.lovable.app-1780806677456.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Restore saved theme before first paint; default to dark */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('cleard-theme');document.documentElement.classList.toggle('dark',t!=='light')}catch(e){document.documentElement.classList.add('dark')}",
          }}
        />
        {/* Supabase recovery links may land on the site root; forward them to the reset page. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var h=location.hash||'';if(h.indexOf('type=recovery')>-1&&location.pathname!=='/reset-password'){location.replace('/reset-password'+location.search+h)}}catch(e){}",
          }}
        />

      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
