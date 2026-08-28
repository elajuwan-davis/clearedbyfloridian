import { createFileRoute } from "@tanstack/react-router";
import { CDS, SkeletonRows, Tag } from "@/components/cds-kit";
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
  CLEARD_INFO_EMAIL,
  CLEARD_RECIPIENT,
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
import { usePlanAccess } from "@/lib/plan-access";
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
  const plan = usePlanAccess();
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
    // A trial plan has no Contacts — it only ever writes to Cleard.
    if (plan.isTrial) return;
    listContacts()
      .then(setContacts)
      .catch(() => {/* contacts are optional for messaging */});
  }, [plan.isTrial]);

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
  // A trial plan can only write to Cleard, so the recipient is fixed rather than chosen.
  const recipient: ThreadRecipient = plan.isTrial
    ? CLEARD_RECIPIENT
    : {
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
        <div
          className="grid min-w-0 grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr]"
          style={{ height: "calc(100vh - 130px)", background: CDS.white, border: `1px solid ${CDS.border}` }}
        >
          {/* Thread list */}
          <aside
            className="flex min-h-0 flex-col"
            style={{ background: CDS.off, borderRight: `1px solid ${CDS.border}` }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              aria-label="Search conversations"
              style={{
                border: "none",
                borderBottom: `1px solid ${CDS.border}`,
                padding: "12px 16px",
                width: "100%",
                fontSize: 13,
                background: CDS.off,
                color: CDS.black,
              }}
            />
            <ul className="flex-1 overflow-y-auto">
              {loading ? (
                <li style={{ padding: 16 }}>
                  <SkeletonRows rows={5} />
                </li>
              ) : filtered.length === 0 ? (
                <li className="p-8 text-center" style={{ fontSize: 12.5, color: CDS.grayLt }}>
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
                        className="block w-full min-w-0 text-left transition-colors hover:bg-[#EFE6D6]"
                        style={{
                          background: isActive ? CDS.off2 : "transparent",
                          borderBottom: `1px solid ${CDS.border}`,
                          padding: "10px 16px",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {unread > 0 && (
                            <span
                              aria-hidden
                              style={{ width: 6, height: 6, background: CDS.teal, display: "inline-block" }}
                            />
                          )}
                          <span
                            className="min-w-0 flex-1 truncate"
                            style={{
                              fontSize: 13,
                              fontWeight: unread ? 700 : 500,
                              color: CDS.black,
                            }}
                          >
                            {t.subject}
                          </span>
                          <span className="shrink-0 tabular-nums" style={{ fontSize: 11, color: CDS.grayLt }}>
                            {fmt(t.last_message_at)}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate" style={{ fontSize: 11.5, color: CDS.gray }}>
                          {isAdmin && t.created_by_email ? t.created_by_email : ""}
                          {t.status === "closed" ? " · Closed" : ""}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* Conversation */}
          <section className="flex min-h-0 flex-col" style={{ background: CDS.white }}>
            {!active ? (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <MessageSquare className="mx-auto h-8 w-8 opacity-25" strokeWidth={1.5} />
                  <p style={{ fontSize: 13, color: CDS.gray, marginTop: 12 }}>
                    Select a conversation, or start a new one.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="flex flex-wrap items-start justify-between gap-3"
                  style={{ borderBottom: `1px solid ${CDS.border}`, padding: "16px 20px" }}
                >
                  <div className="min-w-0">
                    <div className="truncate" style={{ fontSize: 15, fontWeight: 700, color: CDS.black }}>
                      {active.subject}
                    </div>
                    <div style={{ fontSize: 11.5, color: CDS.gray, marginTop: 2 }}>
                      Opened {fmt(active.created_at)}
                      {active.created_by_email ? ` · ${active.created_by_email}` : ""}
                      {active.recipient_role
                        ? ` · To ${active.recipient_name ?? active.recipient_role}${
                            active.recipient_email ? ` <${active.recipient_email}>` : ""
                          }${active.recipient_name ? ` (${active.recipient_role})` : ""}`
                        : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Tag tone={active.status === "open" ? "success" : "neutral"}>
                      {active.status === "open" ? "Open" : "Resolved"}
                    </Tag>
                    {isAdmin && (
                      <button type="button" className="p-btn p-btn-ghost p-btn-sm" onClick={toggleStatus}>
                        {active.status === "open" ? "Mark resolved" : "Reopen"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto" style={{ padding: 20 }}>
                  {postsLoading ? (
                    <SkeletonRows rows={4} />
                  ) : (
                    posts.map((m) => {
                      const senderEmail = m.from_admin
                        ? CLEARD_SUPPORT_EMAIL
                        : m.author_email ?? active.created_by_email ?? "";
                      const own = !m.from_admin;
                      return (
                        <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                          <div className="min-w-0" style={{ maxWidth: "70%" }}>
                            <div
                              className={`mb-0.5 flex flex-wrap items-baseline gap-2 ${own ? "justify-end" : ""}`}
                            >
                              <span
                                style={{ fontSize: 11, fontWeight: 700, color: CDS.grayLt }}
                              >
                                {m.author_label ?? (m.from_admin ? CLEARD_SUPPORT_LABEL : "Client")}
                              </span>
                              {senderEmail && (
                                <span style={{ fontSize: 10.5, color: CDS.grayLt, textTransform: "lowercase" }}>
                                  &lt;{senderEmail}&gt;
                                </span>
                              )}
                              <span style={{ fontSize: 10.5, color: CDS.grayLt }}>{fmt(m.created_at)}</span>
                            </div>
                            <div
                              className="whitespace-pre-wrap"
                              style={{
                                background: own ? CDS.black : CDS.off,
                                color: own ? CDS.white : CDS.black,
                                border: `1px solid ${own ? CDS.black : CDS.border}`,
                                padding: "10px 14px",
                                fontSize: 13,
                                lineHeight: 1.55,
                              }}
                            >
                              {m.body}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ borderTop: `1px solid ${CDS.border}`, padding: "12px 20px" }}>
                  <div style={{ fontSize: 11, color: CDS.grayLt, marginBottom: 6 }}>
                    From <span style={{ textTransform: "lowercase", color: CDS.gray }}>{fromEmail}</span>
                  </div>
                  <div className="flex items-end gap-2.5">
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
                      className="min-h-[52px] flex-1 resize-none text-[13px]"
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
            {plan.isTrial ? (
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.07em] text-muted-foreground">
                  Send to
                </Label>
                <div className="p-surface-flat px-3 py-2 text-[13px]">
                  Cleard Inc{" "}
                  <span className="text-muted-foreground">&lt;{CLEARD_INFO_EMAIL}&gt;</span>
                </div>
              </div>
            ) : (
            <>
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
            </>
            )}
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
