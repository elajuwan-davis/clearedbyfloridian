import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Send, Inbox, Plus, Loader2, MessageSquare } from "lucide-react";
import { PageShell, SearchInput } from "@/components/ui-kit";
import { useSession } from "@/lib/use-session";
import { useMyIdentity } from "@/lib/profile-api";
import {
  CLEARD_SUPPORT_EMAIL,
  CLEARD_SUPPORT_LABEL,
  listThreads,
  listPosts,
  createThread,
  postReply,
  markThreadRead,
  setThreadStatus,
  RECIPIENT_ROLES,
  type ThreadRow,
  type PostRow,
  type RecipientRole,
  type ThreadRecipient,
} from "@/lib/messages-api";
import { listContacts, type ContactRow } from "@/lib/contacts-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>) => ({
    contact: typeof search.contact === "string" ? search.contact : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Messages — Cleard" },
      { name: "description", content: "Message the Cleard permitting team about any project." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function MessagesPage() {
  const session = useSession();
  const me = useMyIdentity();
  const isAdmin = session.isAdmin;

  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [recipientRole, setRecipientRole] = useState<RecipientRole>("Cleard Support");
  const [recipientContactId, setRecipientContactId] = useState<string>("");
  const { contact: contactParam } = Route.useSearch();

  const authorLabel = me.displayName || session.email || "You";
  /** Address this account's messages go out under. */
  const fromEmail = isAdmin ? CLEARD_SUPPORT_EMAIL : (me.email || session.email || "your account email");

  async function refreshThreads(selectFirst = false) {
    try {
      const rows = await listThreads();
      setThreads(rows);
      if (selectFirst && rows.length > 0) setActiveId((cur) => cur || rows[0].id);
    } catch (e) {
      toast.error(`Could not load messages: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshThreads(true); }, []);

  useEffect(() => {
    listContacts()
      .then(setContacts)
      .catch(() => {/* contacts are optional for messaging */});
  }, []);

  // Deep link from Contacts: /messages?contact=<id> opens the composer for them.
  useEffect(() => {
    if (!contactParam || contacts.length === 0) return;
    const c = contacts.find((x) => x.id === contactParam);
    if (!c) return;
    setRecipientContactId(c.id);
    setRecipientRole(
      (RECIPIENT_ROLES.find((r) => r.toLowerCase() === (c.contact_type ?? "").toLowerCase()) ??
        "Subcontractor") as RecipientRole,
    );
    setNewOpen(true);
  }, [contactParam, contacts]);

  const selectedContact = contacts.find((c) => c.id === recipientContactId) ?? null;
  const recipient: ThreadRecipient = {
    role: recipientRole,
    name: selectedContact?.name ?? null,
    email: selectedContact?.email ?? null,
    phone: selectedContact?.phone ?? null,
    contactId: selectedContact?.id ?? null,
  };

  const active = threads.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    if (!active) { setPosts([]); return; }
    let cancelled = false;
    setPostsLoading(true);
    listPosts(active.id)
      .then((p) => { if (!cancelled) setPosts(p); })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => { if (!cancelled) setPostsLoading(false); });
    const unread = isAdmin ? active.admin_unread : active.client_unread;
    if (unread > 0) {
      markThreadRead(active, isAdmin)
        .then(() => setThreads((prev) => prev.map((t) => (t.id === active.id ? { ...t, ...(isAdmin ? { admin_unread: 0 } : { client_unread: 0 }) } : t))))
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [activeId, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      `${t.subject} ${t.created_by_email ?? ""}`.toLowerCase().includes(q),
    );
  }, [threads, query]);

  async function send() {
    if (!active || !draft.trim()) return;
    setSending(true);
    try {
      await postReply({ thread: active, body: draft.trim(), authorLabel, isAdmin });
      setDraft("");
      const [p] = await Promise.all([listPosts(active.id)]);
      setPosts(p);
      await refreshThreads();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function startThread() {
    if (!newSubject.trim() || !newBody.trim()) {
      toast.error("Add a subject and a message");
      return;
    }
    setCreating(true);
    try {
      const t = await createThread({
        subject: newSubject.trim(),
        body: newBody.trim(),
        authorLabel,
        isAdmin,
        recipient,
      });
      setNewOpen(false);
      setNewSubject("");
      setNewBody("");
      setRecipientRole("Cleard Support");
      setRecipientContactId("");
      await refreshThreads();
      setActiveId(t.id);
      toast.success(
        selectedContact
          ? `Message sent to ${selectedContact.name}`
          : isAdmin
            ? "Thread started"
            : "Message sent to the Cleard team",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus() {
    if (!active) return;
    const next = active.status === "open" ? "closed" : "open";
    try {
      await setThreadStatus(active.id, next);
      setThreads((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: next } : t)));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Workspace" }, { label: "Messages" }]}
        title="Messages"
        meta={isAdmin ? "Client Messaging · Admin" : "Message Cleard"}
        actions={
          <button type="button" onClick={() => setNewOpen(true)} className="p-btn p-btn-primary">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            New message
          </button>
        }
      >
        <div className="grid min-w-0 grid-cols-1 gap-0 overflow-hidden rounded-lg lg:grid-cols-[300px_1fr] p-surface-flat" style={{ height: "calc(100vh - 130px)" }}>
          {/* Thread list */}
          <aside className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r" style={{ borderColor: "var(--p-border)" }}>
            <div className="p-2" style={{ borderBottom: "1px solid var(--p-border)" }}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search conversations…" />
            </div>
            <ul className="flex-1 overflow-y-auto">
              {loading ? (
                <li className="flex items-center justify-center gap-2 p-8 text-[12.5px] text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </li>
              ) : filtered.length === 0 ? (
                <li className="p-8 text-center text-[12.5px] text-muted-foreground">
                  <Inbox className="mx-auto mb-2 h-6 w-6 opacity-40" strokeWidth={1.5} />
                  No conversations yet.
                </li>
              ) : (
                filtered.map((t) => {
                  const unread = isAdmin ? t.admin_unread : t.client_unread;
                  const isActive = t.id === activeId;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(t.id)}
                        className={`block w-full min-w-0 text-left px-3 py-2.5 transition-colors ${
                          isActive ? "bg-[var(--p-card-2)]" : "p-hover-plate"
                        }`}
                        style={{ borderBottom: "1px solid var(--p-border)" }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="truncate text-[12.5px]"
                            style={{ fontWeight: unread ? 600 : 400 }}
                          >
                            {t.subject}
                          </span>
                          {unread > 0 && (
                            <span className="inline-flex h-4.5 min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-medium text-white" style={{ backgroundColor: "var(--p-danger)" }}>
                              {unread}
                            </span>
                          )}
                        </div>
                        {isAdmin && t.created_by_email && (
                          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {t.created_by_email}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{fmt(t.last_message_at)}</span>
                          {t.status === "closed" && <span>· Closed</span>}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* Conversation */}
          <section className="flex min-h-0 flex-col">
            {!active ? (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <MessageSquare className="mx-auto h-8 w-8 opacity-25" strokeWidth={1.5} />
                  <p className="mt-3 text-[12.5px] text-muted-foreground">Select a conversation, or start a new one.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--p-border)" }}>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold">{active.subject}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      Opened {fmt(active.created_at)}
                      {active.created_by_email ? ` · ${active.created_by_email}` : ""}
                      {active.recipient_role
                        ? ` · To ${active.recipient_name ?? active.recipient_role}${
                            active.recipient_email ? ` <${active.recipient_email}>` : ""
                          }${active.recipient_name ? ` (${active.recipient_role})` : ""}`
                        : ""}
                    </div>
                  </div>
                  {isAdmin && (
                    <button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={toggleStatus}>
                      {active.status === "open" ? "Mark resolved" : "Reopen"}
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {postsLoading ? (
                    <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
                    </div>
                  ) : (
                    posts.map((m) => {
                      const senderEmail = m.from_admin
                        ? CLEARD_SUPPORT_EMAIL
                        : m.author_email ?? active.created_by_email ?? "";
                      return (
                      <div key={m.id} className={`flex ${m.from_admin ? "justify-start" : "justify-end"}`}>
                        <div className="max-w-[75%]">
                          <div className="mb-1 flex flex-wrap items-baseline gap-2">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {m.author_label ?? (m.from_admin ? CLEARD_SUPPORT_LABEL : "Client")}
                            </span>
                            {senderEmail && (
                              <span className="text-[10.5px] lowercase text-muted-foreground/70">
                                &lt;{senderEmail}&gt;
                              </span>
                            )}
                            <span className="text-[10.5px] text-muted-foreground/70">{fmt(m.created_at)}</span>
                          </div>
                          <div
                            className="whitespace-pre-wrap rounded-lg px-3 py-2 text-[12.5px] leading-relaxed"
                            style={
                              m.from_admin
                                ? { backgroundColor: "var(--p-card-2)", color: "var(--p-text)" }
                                : { backgroundColor: "var(--p-info)", color: "#fff" }
                            }
                          >
                            {m.body}
                          </div>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3" style={{ borderTop: "1px solid var(--p-border)" }}>
                  <div className="mb-1.5 text-[11px] text-muted-foreground">
                    From <span className="lowercase text-foreground/80">{fromEmail}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      rows={2}
                      placeholder="Write a reply… (Enter to send, Shift+Enter for a new line)"
                      className="min-h-[52px] flex-1 resize-none text-[12.5px]"
                    />
                    <button type="button" onClick={send} disabled={sending} className="p-btn p-btn-primary h-11 gap-1.5">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={1.75} />}
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </PageShell>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isAdmin ? "Message a client" : "Message the Cleard team"}
            </DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "Sent to the client team you are currently viewing."
                : "Our permitting staff is notified right away and will reply here."}
              {" "}Sending from <span className="text-[11.5px] text-foreground/80">{fromEmail}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
                Send to (role)
              </Label>
              <Select value={recipientRole} onValueChange={(v) => setRecipientRole(v as RecipientRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECIPIENT_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
                Person (from Contacts)
              </Label>
              <Select
                value={recipientContactId || "none"}
                onValueChange={(v) => setRecipientContactId(v === "none" ? "" : v)}
              >
                <SelectTrigger><SelectValue placeholder="No specific person" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific person</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.email ? ` · ${c.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedContact && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {selectedContact.email ?? "no email on file"}
                  {selectedContact.phone ? ` · ${selectedContact.phone}` : ""}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
                Subject
              </Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Question on Ocean Ridge inspection"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
                Message
              </Label>
              <Textarea
                rows={5}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="How can we help?"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-[var(--p-border)] pt-3">
            <Button type="button" variant="ghost" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={startThread} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Send message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
