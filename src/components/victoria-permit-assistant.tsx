// "Victoria" on the New Permit form: a floating mic in the bottom-right corner that reads
// each field out, listens, and writes what it heard into the form.
//
// Same deliberate non-AI design as the /join voice-fill (src/lib/victoria-speech.ts): the
// browser's own speech-to-text against a fixed field script. There is no free-form "say a
// field name and a value" grammar — dictation is matched to the field Victoria just asked
// for, which is what makes it reliable without a parsing model behind it. Say "skip" to
// leave a field alone.
//
// Values are normalised per field: an address stays prose, money becomes digits, and a
// municipality is matched against the same MUNICIPALITIES catalog the picker uses so a
// spoken city lands on the exact option the form expects.

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square, X, Sparkles } from "lucide-react";
import { MUNICIPALITIES } from "@/lib/municipalities";
import {
  getRecognitionCtor,
  isSkip,
  speak,
  tidyEmail,
  tidyPhone,
  type RecognitionErrorEvent,
  type RecognitionResultEvent,
  type SpeechRecognitionLike,
} from "@/lib/victoria-speech";

/** Permit-form keys Victoria can fill — all plain text/number inputs on the form. */
export type VictoriaPermitField =
  | "projectName"
  | "address"
  | "municipality"
  | "totalProjectValue"
  | "description"
  | "ownerName"
  | "signerEmail"
  | "signerPhone";

const SCRIPT: { key: VictoriaPermitField; prompt: string; label: string }[] = [
  { key: "projectName", prompt: "What's the project called?", label: "Project name" },
  { key: "address", prompt: "What's the property address?", label: "Property address" },
  { key: "municipality", prompt: "Which city or municipality is it in?", label: "Municipality" },
  {
    key: "totalProjectValue",
    prompt: "What's the total project value, in dollars?",
    label: "Project value",
  },
  { key: "description", prompt: "Describe the scope of work.", label: "Scope description" },
  { key: "ownerName", prompt: "Who is the property owner?", label: "Owner name" },
  { key: "signerEmail", prompt: "What's the contact email?", label: "Contact email" },
  { key: "signerPhone", prompt: "And the contact phone number?", label: "Contact phone" },
];

const SPOKEN_DIGITS: Record<string, string> = {
  zero: "0",
  oh: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

/**
 * "two fifty thousand" is beyond a fixed grammar, but "$250,000", "250000" and
 * "250 thousand" all turn up in dictation, so handle digits plus a thousand/million suffix.
 */
function parseMoney(raw: string): string {
  const text = raw.toLowerCase().replace(/[$,]/g, " ");
  const m = text.match(/(\d+(?:\.\d+)?)\s*(thousand|k|million|m)?/);
  if (!m) return "";
  let value = Number(m[1]);
  if (!Number.isFinite(value)) return "";
  if (m[2] === "thousand" || m[2] === "k") value *= 1_000;
  if (m[2] === "million" || m[2] === "m") value *= 1_000_000;
  return String(Math.round(value));
}

/** Spoken street numbers come through as words often enough to be worth normalising. */
function tidyAddress(raw: string): string {
  return raw
    .trim()
    .replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/gi, (w) =>
      w.length <= 5 ? (SPOKEN_DIGITS[w.toLowerCase()] ?? w) : w,
    )
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(city|town|village) of\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Match a spoken city onto the catalog: exact first, then a contains match either way
 * ("Miami Beach" heard as "the city of Miami Beach"). Falls back to the raw words, which
 * the picker accepts as freeform.
 */
export function matchMunicipality(raw: string): string {
  const said = normalize(raw);
  if (!said) return "";
  const names = MUNICIPALITIES.map((m) => m.name);
  const exact = names.find((n) => normalize(n) === said);
  if (exact) return exact;
  const contains = names.find((n) => {
    const t = normalize(n);
    return t.includes(said) || said.includes(t);
  });
  return contains ?? raw.trim();
}

function tidy(key: VictoriaPermitField, raw: string): string {
  const text = raw.trim();
  switch (key) {
    case "municipality":
      return matchMunicipality(text);
    case "totalProjectValue":
      return parseMoney(text);
    case "signerEmail":
      return tidyEmail(text);
    case "signerPhone":
      return tidyPhone(text);
    case "address":
      return tidyAddress(text);
    default:
      return text;
  }
}

export function VictoriaPermitAssistant({
  onField,
}: {
  /** Writes one value into the permit form; the form stays fully editable by hand. */
  onField: (field: VictoriaPermitField, value: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<{ label: string; value: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const advance = useRef<number | null>(null);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  const teardown = useCallback(() => {
    if (advance.current) window.clearTimeout(advance.current);
    advance.current = null;
    try {
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
    } catch {
      // already stopped
    }
    recognition.current = null;
    setListening(false);
  }, []);

  useEffect(() => teardown, [teardown]);

  const listenFor = useCallback(
    (step: number) => {
      const Ctor = getRecognitionCtor();
      const field = SCRIPT[step];
      if (!Ctor || !field) return;

      teardown();
      setNotice(null);
      setIndex(step);
      speak(field.prompt);

      const rec = new Ctor();
      recognition.current = rec;
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = false;

      const next = (delay: number) => {
        advance.current = window.setTimeout(() => {
          const n = step + 1;
          if (n >= SCRIPT.length) {
            setNotice("That's the form — review it, add your documents, then continue.");
            return;
          }
          listenFor(n);
        }, delay);
      };

      rec.onresult = (e: RecognitionResultEvent) => {
        const transcript = e.results?.[0]?.[0]?.transcript ?? "";
        if (isSkip(transcript)) {
          setHeard(null);
          setNotice(`Skipped ${field.label.toLowerCase()}.`);
          next(300);
          return;
        }
        const value = tidy(field.key, transcript);
        if (!value) {
          setNotice("Didn't catch that — say it again, or type it in.");
          return;
        }
        onField(field.key, value);
        setHeard({ label: field.label, value });
        next(1400);
      };

      rec.onerror = (e: RecognitionErrorEvent) => {
        const code = e.error;
        setListening(false);
        setNotice(
          code === "not-allowed" || code === "service-not-allowed"
            ? "Microphone blocked — allow it in your browser, or just type the form."
            : "Voice input stopped — tap Redo to retry, or type it.",
        );
      };

      rec.onend = () => setListening(false);

      try {
        rec.start();
        setListening(true);
      } catch {
        setNotice("Voice input couldn't start — type the form instead.");
      }
    },
    [onField, teardown],
  );

  // No Web Speech API (Safari/Firefox): show nothing rather than a button that can't work.
  if (!supported) return null;

  const current = SCRIPT[index];

  if (!open) {
    return (
      <button
        type="button"
        data-tour="victoria-permit"
        onClick={() => {
          setOpen(true);
          setHeard(null);
          setNotice(null);
          listenFor(0);
        }}
        title="Fill this permit by voice"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-obsidian px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper shadow-[0_18px_40px_-16px_rgba(47,79,79,0.65)] hover:bg-obsidian/90"
      >
        <Mic className="h-4 w-4" strokeWidth={1.75} />
        Fill with Victoria
      </button>
    );
  }

  return (
    <div
      data-tour="victoria-permit"
      className="fixed bottom-6 right-6 z-40 w-[21rem] rounded-[3px] border border-obsidian/20 bg-white p-4 shadow-[0_24px_60px_-20px_rgba(47,79,79,0.5)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">
          <Sparkles className="h-3.5 w-3.5" /> Victoria · {index + 1} of {SCRIPT.length}
        </div>
        <button
          type="button"
          onClick={() => {
            teardown();
            setOpen(false);
          }}
          title="Close"
          className="text-obsidian/50 hover:text-obsidian"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2.5 text-[15px] leading-snug text-obsidian">{current?.prompt}</div>

      <div className="mt-3 flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] ${listening ? "text-obsidian" : "text-obsidian/50"}`}
        >
          <Mic className="h-3.5 w-3.5" strokeWidth={1.75} />
          {listening ? "Listening…" : "Paused"}
        </span>
        <button
          type="button"
          onClick={() => listenFor(index)}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/50 hover:text-obsidian"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} /> Redo
        </button>
        <button
          type="button"
          onClick={() => {
            teardown();
            setNotice("Stopped — the form is yours to type.");
          }}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/50 hover:text-obsidian"
        >
          <Square className="h-3 w-3" strokeWidth={2} /> Stop
        </button>
      </div>

      {heard && (
        <div className="mt-3 text-[13px] text-obsidian">
          {heard.label}: <span className="font-mono">{heard.value}</span>
        </div>
      )}
      <div className="mt-2 text-[11.5px] leading-relaxed text-obsidian/50">
        {notice ?? "Say your answer out loud — or say “skip” to leave a field for later."}
      </div>
    </div>
  );
}
