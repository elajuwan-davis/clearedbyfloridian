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
/* Design system lockdown: one system font stack app-wide — no webfont imports. */
import { Toaster } from "@/components/ui/sonner";
import { PermitsOnlyBoundary } from "@/components/permits-only-boundary";
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
      { title: "Cleard — Private Provider Permitting & Contractor Back Office" },
      {
        name: "description",
        content:
          "Cleard is the private-provider permitting partner for licensed general contractors — plan review, inspections, and permit coordination on a documented clock.",
      },
      { name: "author", content: "Cleard" },
      { property: "og:title", content: "Cleard — Private Provider Permitting & Contractor Back Office" },
      {
        property: "og:description",
        content:
          "Private-provider plan review and inspections, license management, insurance compliance, and Victoria.AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Cleard — Private Provider Permitting & Contractor Back Office" },
      { name: "description", content: "Cleard is a full-stack permitting portal and marketing website for residential builders." },
      { property: "og:description", content: "Cleard is a full-stack permitting portal and marketing website for residential builders." },
      { name: "twitter:description", content: "Cleard is a full-stack permitting portal and marketing website for residential builders." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/60e26fdd-43f6-4b23-a843-5d92cc1e18e2/id-preview-3cf4a0b5--0b3e81be-56ac-4636-ba0c-f0ab606037c7.lovable.app-1780806677456.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/60e26fdd-43f6-4b23-a843-5d92cc1e18e2/id-preview-3cf4a0b5--0b3e81be-56ac-4636-ba0c-f0ab606037c7.lovable.app-1780806677456.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
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
        {/* Design system lockdown: single light palette — dark class never applied. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{document.documentElement.classList.remove('dark')}catch(e){}",
          }}
        />
        {/* Supabase recovery links may land on the site root; forward them to the reset form. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var h=location.hash||'';var s=location.search||'';var isRec=h.indexOf('type=recovery')>-1||s.indexOf('type=recovery')>-1;if(isRec&&location.pathname!=='/reset-password-confirm'){location.replace('/reset-password-confirm'+s+h)}}catch(e){}",
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
      <ViewModeProvider>
        <PermitsOnlyBoundary>
          <Outlet />
        </PermitsOnlyBoundary>
      </ViewModeProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
