/** Canonical municipality slug used by the credentials vault (gc_portal_logins). */
export function slugifyCity(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
