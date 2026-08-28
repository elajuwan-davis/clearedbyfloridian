import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Send, Sparkle, X, ExternalLink } from "lucide-react";
import { mockReply, renderInline } from "@/lib/victoria-mock";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Persistent Ask Victoria launcher. `variant="nav"` renders an inline icon button
 * meant to sit in the portal top bar (the default floating bubble is kept for
 * any surface that still wants a corner launcher).
 */
export function AskVictoriaDock({ variant = "float" }: { variant?: "float" | "nav" } = {}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function send(text: string) {
    const t = text.trim();
    if (!t || thinking) return;
    setMessages((m) => [...m, { id: uid(), role: "user", content: t }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: mockReply(t) }]);
      setThinking(false);
      inputRef.current?.focus();
    }, 500);
  }

  const isNav = variant === "nav";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ask Victoria"
        title="Ask Victoria"
        className={
          isNav
            ? "grid h-8 w-8 place-items-center rounded-lg transition hover:bg-[var(--rail-hover)]"
            : "fixed bottom-5 right-5 z-[60] grid h-11 w-11 place-items-center rounded-full shadow-lg transition hover:opacity-90"
        }
        style={
          isNav
            ? { color: "var(--muted-foreground)" }
            : { backgroundColor: "var(--obsidian)", color: "var(--paper)" }
        }
      >
        <Sparkle className={isNav ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className={
            isNav
              ? "fixed right-4 top-14 z-[60] flex h-[520px] max-h-[calc(100vh-5rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border shadow-2xl"
              : "fixed bottom-20 right-5 z-[60] flex h-[520px] max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border shadow-2xl"
          }

          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
        >
          <header
            className="flex items-center justify-between rounded-t-xl px-4 py-3"
            style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkle className="h-4 w-4" strokeWidth={1.5} />
              <div>
                <div className="text-[13px] font-medium">Ask Victoria</div>
                <div className="text-[10.5px] leading-snug opacity-75">
                  AI that oversees your permits and helps you at every step of the way to get
                  them cleared.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/ask-victoria"
                onClick={() => setOpen(false)}
                aria-label="Open full Ask Victoria"
                className="opacity-80 hover:opacity-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="opacity-80 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="pt-8 text-center">
                <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                  Ask about FS §553.791, county fees, timelines or inspections.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {["What counties do you serve?", "What are the fees?", "How long does review take?"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-[3px] border px-2 py-1 text-[11px]"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div
                      className="max-w-[85%] rounded-[3px] px-3 py-2 text-[13px]"
                      style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
                    >
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>
                    {renderInline(m.content)}
                  </div>
                ),
              )
            )}
            {thinking && (
              <div className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>
                Victoria is thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t p-3"
            style={{ borderColor: "var(--border)" }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask Victoria…"
              className="max-h-28 flex-1 resize-none rounded-[3px] border bg-transparent px-3 py-2 text-[13px] focus:outline-none"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <button
              type="submit"
              aria-label="Send"
              className="grid h-9 w-9 place-items-center rounded-[3px]"
              style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
