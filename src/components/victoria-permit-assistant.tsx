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
import { ChevronLeft, Mic, RotateCcw, SkipForward, Square, X, Sparkles } from "lucide-react";
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
  | "ownerEntity"
  | "signerEmail"
  | "signerPhone"
  | "architectFirm"
  | "architectContact"
  | "architectLicense"
  | "architectEmail"
  | "engineerFirm"
  | "engineerContact"
  | "engineerLicense"
  | "engineerEmail"
  | "additionalNotes";

/** Subcontractor row keys Victoria can fill, per selected scope. */
export type VictoriaSubField = "companyName" | "licenseNumber" | "contactName" | "contactEmail";

type Step =
  | { kind: "field"; key: VictoriaPermitField; prompt: string; label: string }
  | { kind: "scopes"; prompt: string; label: string }
  | { kind: "sub"; scope: string; field: VictoriaSubField; prompt: string; label: string };

/** Everything before the scope picker — the project itself. */
const PROJECT_STEPS: Step[] = [
  { kind: "field", key: "projectName", prompt: "What's the project called?", label: "Project name" },
  { kind: "field", key: "address", prompt: "What's the property address?", label: "Property address" },
  {
    kind: "field",
    key: "municipality",
    prompt: "Which city or municipality is it in?",
    label: "Municipality",
  },
  {
    kind: "field",
    key: "totalProjectValue",
    prompt: "What's the total project value, in dollars?",
    label: "Project value",
  },
  {
    kind: "field",
    key: "description",
    prompt: "In a sentence or two, what are we building? For example: new pool, spa and paver deck at a single-family residence.",
    label: "Scope description",
  },
  {
    kind: "scopes",
    prompt: "Scope of work — you can search and select them yourself on the form, or just tell me which ones apply.",
    label: "Scope of work",
  },
];

/**
 * The scope step reads the real catalog out loud, so a first-time user hears the exact
 * options instead of a blank field they have to guess at.
 */
function scopesPrompt(options: string[]): string {
  if (!options.length) return PROJECT_STEPS[PROJECT_STEPS.length - 1]!.prompt;
  const list = options.join(", ");
  return `Scope of work — select all that apply. The options are: ${list}. You can pick them yourself from the buttons here, or just tell me which ones to select. When you\u2019re done, say next field.`;
}

/** Everything after the subcontractor rows — owner, contacts, design pros, notes. */
const TAIL_STEPS: Step[] = [
  { kind: "field", key: "ownerName", prompt: "Who is the property owner?", label: "Owner name" },
  {
    kind: "field",
    key: "ownerEntity",
    prompt: "Is the owner an entity or trust? Say the name, or say skip.",
    label: "Owner entity",
  },
  { kind: "field", key: "signerEmail", prompt: "What's the contact email?", label: "Contact email" },
  { kind: "field", key: "signerPhone", prompt: "And the contact phone number?", label: "Contact phone" },
  { kind: "field", key: "architectFirm", prompt: "Which architecture firm is on the job? Say skip if none.", label: "Architect firm" },
  { kind: "field", key: "architectContact", prompt: "Who's the architect contact?", label: "Architect contact" },
  { kind: "field", key: "architectLicense", prompt: "What's the architect's license number?", label: "Architect license" },
  { kind: "field", key: "architectEmail", prompt: "And the architect's email?", label: "Architect email" },
  { kind: "field", key: "engineerFirm", prompt: "Which engineering firm is on the job? Say skip if none.", label: "Engineer firm" },
  { kind: "field", key: "engineerContact", prompt: "Who's the engineer contact?", label: "Engineer contact" },
  { kind: "field", key: "engineerLicense", prompt: "What's the engineer's license number?", label: "Engineer license" },
  { kind: "field", key: "engineerEmail", prompt: "And the engineer's email?", label: "Engineer email" },
  {
    kind: "field",
    key: "additionalNotes",
    prompt: "Anything else Cleard should know about this permit?",
    label: "Additional notes",
  },
];

const SUB_PROMPTS: Record<VictoriaSubField, (scope: string) => string> = {
  companyName: (scope) => `Which company is doing the ${scope.toLowerCase()} work?`,
  licenseNumber: (scope) => `What's the ${scope.toLowerCase()} contractor's license number?`,
  contactName: (scope) => `Who's the contact at the ${scope.toLowerCase()} contractor?`,
  contactEmail: (scope) => `And their email address?`,
};

const SUB_LABELS: Record<VictoriaSubField, string> = {
  companyName: "Company",
  licenseNumber: "License #",
  contactName: "Contact",
  contactEmail: "Contact email",
};

const SUB_FIELD_ORDER: VictoriaSubField[] = [
  "companyName",
  "licenseNumber",
  "contactName",
  "contactEmail",
];

/** The full script: project fields, then a sub block per selected scope, then the tail. */
function buildSteps(scopes: string[], scopeOptions: string[] = []): Step[] {
  const project = PROJECT_STEPS.map((s) =>
    s.kind === "scopes" ? { ...s, prompt: scopesPrompt(scopeOptions) } : s,
  );
  const subSteps: Step[] = [];
  for (const scope of scopes) {
    for (const field of SUB_FIELD_ORDER) {
      subSteps.push({
        kind: "sub",
        scope,
        field,
        prompt: SUB_PROMPTS[field](scope),
        label: `${scope} · ${SUB_LABELS[field]}`,
      });
    }
  }
  return [...project, ...subSteps, ...TAIL_STEPS];
}

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

/**
 * "Pool and spa, electrical and plumbing" → the exact scope options the form offers.
 * Each spoken fragment is matched against the catalog; unmatched words are dropped
 * rather than invented, since the picker only accepts real scopes.
 */
export function matchScopes(raw: string, options: string[]): string[] {
  const said = raw.toLowerCase();
  const picked: string[] = [];
  for (const option of options) {
    const words = normalize(option)
      .split(" ")
      .filter((w) => w.length > 2);
    const hit = words.some((w) => normalize(said).includes(w));
    if (hit) picked.push(option);
  }
  return picked;
}

function tidy(key: VictoriaPermitField, raw: string): string {
  const text = raw.trim();
  switch (key) {
    case "municipality":
      return matchMunicipality(text);
    case "totalProjectValue":
      return parseMoney(text);
    case "signerEmail":
    case "architectEmail":
    case "engineerEmail":
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
  onScopes,
  onSubField,
  scopeOptions = [],
  openSignal = 0,
}: {
  /** Writes one value into the permit form; the form stays fully editable by hand. */
  onField: (field: VictoriaPermitField, value: string) => void;
  /** Selects the spoken trades on the form (adds their subcontractor rows). */
  onScopes?: (scopes: string[]) => void;
  /** Writes one value onto the first subcontractor row of a selected scope. */
  onSubField?: (scope: string, field: VictoriaSubField, value: string) => void;
  /** The scope catalog the form offers, so spoken trades land on real options. */
  scopeOptions?: string[];
  /** Bump this to open Victoria and start the script from outside (e.g. the intro prompt). */
  openSignal?: number;
}) {
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<{ label: string; value: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [steps, setSteps] = useState<Step[]>(() => buildSteps([], scopeOptions));
  const stepsRef = useRef<Step[]>(steps);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const advance = useRef<number | null>(null);

  const setScript = useCallback(
    (scopes: string[]) => {
      const next = buildSteps(scopes, scopeOptions);
      stepsRef.current = next;
      setSteps(next);
    },
    [scopeOptions],
  );

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

  /**
   * Manual step control, for when dictation stalls or the user would rather type one field:
   * jumps the script without waiting on speech, and stops cleanly at the end.
   */
  const goTo = useCallback(
    (step: number) => {
      const total = stepsRef.current.length;
      if (step < 0) return;
      if (step >= total) {
        teardown();
        setNotice("That's the form — review it, add your documents, then continue.");
        return;
      }
      listenForRef.current?.(step);
    },
    [teardown],
  );

  const listenForRef = useRef<((step: number) => void) | null>(null);

  const listenFor = useCallback(
    (step: number) => {
      const Ctor = getRecognitionCtor();
      const field = stepsRef.current[step];
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
          if (n >= stepsRef.current.length) {
            setNotice("That's the form — review it, add your documents, then continue.");
            return;
          }
          listenFor(n);
        }, delay);
      };

      rec.onresult = (e: RecognitionResultEvent) => {
        const transcript = e.results?.[0]?.[0]?.transcript ?? "";
        // "next field" / "next" is the spoken twin of the Next field button.
        if (/^\s*(next|next field|move on)\s*$/i.test(transcript.trim())) {
          setHeard(null);
          next(200);
          return;
        }
        if (isSkip(transcript)) {
          setHeard(null);
          setNotice(`Skipped ${field.label.toLowerCase()}.`);
          next(300);
          return;
        }

        // Trades: one utterance can name several, and each one adds its own
        // subcontractor block to the rest of the script.
        if (field.kind === "scopes") {
          const spoken = matchScopes(transcript, scopeOptions);
          if (!spoken.length) {
            setNotice(
              "Didn't catch a trade — name them again, tap one below, or pick them on the form.",
            );
            return;
          }
          onScopes?.(spoken);
          setPicked(spoken);
          setScript(spoken);
          setHeard({ label: field.label, value: spoken.join(", ") });
          next(1400);
          return;
        }

        if (field.kind === "sub") {
          const value =
            field.field === "contactEmail" ? tidyEmail(transcript) : transcript.trim();
          if (!value) {
            setNotice("Didn't catch that — say it again, or type it in.");
            return;
          }
          onSubField?.(field.scope, field.field, value);
          setHeard({ label: field.label, value });
          next(1400);
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
    [onField, onScopes, onSubField, scopeOptions, setScript, teardown],
  );

  const start = useCallback(() => {
    setOpen(true);
    setHeard(null);
    setNotice(null);
    setPicked([]);
    setScript([]);
    listenFor(0);
  }, [listenFor, setScript]);

  // Opened from the intro prompt on the New Permit page.
  useEffect(() => {
    if (openSignal > 0) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);

  useEffect(() => {
    listenForRef.current = listenFor;
  }, [listenFor]);

  // No Web Speech API (Safari/Firefox): show nothing rather than a button that can't work.
  if (!supported) return null;

  const current = steps[index];

  if (!open) {
    return (
      <button
        type="button"
        data-tour="victoria-permit"
        onClick={start}
        title="Fill this permit by voice"
        className="p-btn p-btn-primary fixed bottom-6 right-6 z-40 inline-flex items-center gap-2"
      >
        <Mic className="h-4 w-4" strokeWidth={1.75} />
        Fill with Victoria
      </button>
    );
  }

  return (
    <div
      data-tour="victoria-permit"
      className="fixed bottom-6 right-6 z-40 w-[21rem] rounded-[3px] border border-obsidian/20 bg-white p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">
          <Sparkles className="h-3.5 w-3.5" /> Victoria · {index + 1} of {steps.length}
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

      {current?.kind === "scopes" && scopeOptions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {scopeOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const all = picked.includes(s) ? picked : [...picked, s];
                setPicked(all);
                onScopes?.([s]);
                setScript(all);
                setHeard({ label: "Scope of work", value: all.join(", ") });
              }}
              className="rounded-[3px] border border-obsidian/20 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:bg-obsidian/5"
            >
              {s}
            </button>
          ))}
        </div>
      )}


      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
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
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/50 hover:text-obsidian disabled:opacity-40"
        >
          <ChevronLeft className="h-3 w-3" strokeWidth={2} /> Back
        </button>
        <button
          type="button"
          onClick={() => {
            setHeard(null);
            goTo(index + 1);
          }}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/50 hover:text-obsidian"
        >
          <SkipForward className="h-3 w-3" strokeWidth={2} /> Next field
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
        {notice ??
          "Say your answer out loud — say “skip”, or use Next field to move on and type that one yourself."}
      </div>
    </div>
  );
}
