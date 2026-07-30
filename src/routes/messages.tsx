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
  type ThreadRow,
  type PostRow,
} from "@/lib/messages-api";

export const Route = createFileRoute("/messages")({
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
      });
      setNewOpen(false);
      setNewSubject("");
      setNewBody("");
      await refreshThreads();
      setActiveId(t.id);
      toast.success(isAdmin ? "Thread started" : "Message sent to the Cleard team");
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
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-obsidian/10 pb-6 mb-6">
          <div className="eyebrow text-obsidian/50">{isAdmin ? "Client Messaging · Admin" : "Message Cleard"}</div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
            <div className="min-w-0">
              <h1 className="display-serif text-4xl sm:text-5xl text-obsidian">Messages</h1>
              <p className="mt-2 max-w-xl text-sm text-obsidian/60">
                {isAdmin
                  ? "Every client conversation lands here. Replies notify the client team instantly."
                  : "Ask our permitting team anything — we reply here and notify you in the portal."}
              </p>
            </div>
            <Button type="button" variant="dark" onClick={() => setNewOpen(true)} className="shrink-0 h-11 rounded-[3px] gap-2">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              New message
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] border border-obsidian/15 bg-white min-h-[620px]">
          {/* Thread list */}
          <aside className="border-b lg:border-b-0 lg:border-r border-obsidian/10 flex flex-col">
            <div className="p-3 border-b border-obsidian/10">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian/40" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations…"
                  className="h-10 rounded-[3px] border-obsidian/15 bg-paper-warm pl-9"
                />
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto max-h-[620px]">
              {loading ? (
                <li className="flex items-center justify-center gap-2 p-10 text-sm text-obsidian/50">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </li>
              ) : filtered.length === 0 ? (
                <li className="p-10 text-center text-sm text-obsidian/50">
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
                        className={`block w-full text-left px-4 py-3.5 border-b border-obsidian/5 transition-colors ${
                          isActive ? "bg-paper-warm" : "hover:bg-paper-warm/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="truncate text-[15px] text-obsidian"
                            style={{ fontFamily: "var(--font-subline)", fontWeight: unread ? 600 : 400 }}
                          >
                            {t.subject}
                          </span>
                          {unread > 0 && (
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-oxblood px-1 font-mono text-[10px] text-white">
                              {unread}
                            </span>
                          )}
                        </div>
                        {isAdmin && t.created_by_email && (
                          <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                            {t.created_by_email}
                          </div>
                        )}
                        <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
                          <span>{fmt(t.last_message_at)}</span>
                          {t.status === "closed" && <span className="text-obsidian/35">· Closed</span>}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* Conversation */}
          <section className="flex flex-col min-h-[620px]">
            {!active ? (
              <div className="flex-1 grid place-items-center p-8 text-center">
                <div>
                  <MessageSquare className="mx-auto h-8 w-8 text-obsidian/25" strokeWidth={1.5} />
                  <p className="mt-3 text-sm text-obsidian/60">Select a conversation, or start a new one.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-obsidian/10 bg-paper-warm/40 p-4">
                  <div className="min-w-0">
                    <div className="display-serif text-2xl text-obsidian">{active.subject}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                      Opened {fmt(active.created_at)}
                      {active.created_by_email ? ` · ${active.created_by_email}` : ""}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button type="button" variant="outline" size="sm" className="rounded-[3px]" onClick={toggleStatus}>
                      {active.status === "open" ? "Mark resolved" : "Reopen"}
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-paper p-4 sm:p-6">
                  {postsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-obsidian/50">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
                    </div>
                  ) : (
                    posts.map((m) => {
                      const senderEmail = m.from_admin
                        ? CLEARD_SUPPORT_EMAIL
                        : m.author_email ?? active.created_by_email ?? "";
                      return (
                      <div key={m.id} className={`flex ${m.from_admin ? "justify-start" : "justify-end"}`}>
                        <div className="max-w-[80%]">
                          <div className="mb-1 flex flex-wrap items-baseline gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/60">
                              {m.author_label ?? (m.from_admin ? CLEARD_SUPPORT_LABEL : "Client")}
                            </span>
                            {senderEmail && (
                              <span className="font-mono text-[10px] lowercase tracking-[0.04em] text-obsidian/45">
                                &lt;{senderEmail}&gt;
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-obsidian/40">{fmt(m.created_at)}</span>
                          </div>
                          <div
                            className="whitespace-pre-wrap rounded-[3px] px-4 py-3 text-[15px] leading-relaxed"
                            style={
                              m.from_admin
                                ? { backgroundColor: "var(--obsidian)", color: "var(--paper)" }
                                : { backgroundColor: "color-mix(in oklab, var(--sky) 22%, white)", color: "var(--obsidian)" }
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

                <div className="border-t border-obsidian/10 bg-white p-3">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                    From <span className="lowercase tracking-[0.04em] text-obsidian/65">{fromEmail}</span>
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
                      className="min-h-[52px] flex-1 resize-none rounded-[3px] border-obsidian/15 bg-paper-warm text-[15px]"
                    />
                    <Button type="button" variant="dark" onClick={send} disabled={sending} className="h-11 gap-1.5 rounded-[3px]">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={1.75} />}
                      Send
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="rounded-[3px] border-obsidian/15 bg-white sm:max-w-lg">
          <DialogHeader>
            <div className="eyebrow text-obsidian/50">New Message</div>
            <DialogTitle className="display-serif text-2xl text-obsidian">
              {isAdmin ? "Message a client" : "Message the Cleard team"}
            </DialogTitle>
            <DialogDescription className="text-sm text-obsidian/55">
              {isAdmin
                ? "Sent to the client team you are currently viewing."
                : "Our permitting staff is notified right away and will reply here."}
              {" "}Sending from <span className="font-mono text-[11px] text-obsidian/75">{fromEmail}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                Subject
              </Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Question on Ocean Ridge inspection"
                className="h-11 rounded-[3px] border-obsidian/15"
              />
            </div>
            <div>
              <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                Message
              </Label>
              <Textarea
                rows={5}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="How can we help?"
                className="rounded-[3px] border-obsidian/15 text-[15px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="rounded-[3px]" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="dark" className="rounded-[3px]" onClick={startThread} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Send message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
