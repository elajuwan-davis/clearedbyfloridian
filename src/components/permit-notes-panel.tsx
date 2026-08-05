import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { addNote, deleteNote, listNotes, type ProjectNote } from "@/lib/project-notes";

export function PermitNotesPanel({ permitId }: { permitId: string }) {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    const refresh = () => { void listNotes(permitId).then(setNotes); };
    refresh();
    window.addEventListener("project-notes:changed", refresh);
    return () => window.removeEventListener("project-notes:changed", refresh);
  }, [permitId]);

  async function post() {
    if (!body.trim()) return;
    const author = localStorage.getItem("cleared_demo_user") || "Team";
    await addNote(permitId, author, body);
    setBody("");
  }

  return (
    <div className="space-y-4">
      <div className="border border-obsidian/10 bg-white p-4 rounded-[3px]">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
          Project notes · Visible to your team
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Leave a note about this permit…"
          className="mt-2 block w-full resize-none border border-obsidian/15 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none"
        />
        <Button variant="dark" size="sm" className="mt-3 rounded-[3px]" disabled={!body.trim()} onClick={() => { void post(); }}>
          Post note
        </Button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-obsidian/45">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="border border-obsidian/10 bg-paper-warm/40 p-3 rounded-[3px]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-obsidian">{n.author}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-obsidian/45">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-obsidian/80 whitespace-pre-wrap">{n.body}</p>
              <button
                type="button"
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-red-700/80 hover:text-red-800"
                onClick={() => { if (confirm("Delete this note?")) void deleteNote(n.id); }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
