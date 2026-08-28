// "Victoria" voice-fill for the /join form.
//
// Deliberately NOT an AI feature: this is the browser's own speech-to-text, walking the
// fields one at a time with hardcoded prompts. No LLM, no parsing service, nothing new
// on the backend. Typing the form is always the default path — if the browser has no
// speech recognition (Safari/Firefox), this renders nothing at all.

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";

export type VictoriaField = "name" | "company" | "license_number" | "email" | "phone";

const SCRIPT: { key: VictoriaField; prompt: string; label: string }[] = [
  { key: "name", prompt: "What's your full name?", label: "Full name" },
  { key: "company", prompt: "What's your company name?", label: "Company name" },
  {
    key: "license_number",
    prompt: "What's your contractor license number?",
    label: "License number",
  },
  { key: "email", prompt: "What's your email address?", label: "Email" },
  { key: "phone", prompt: "And your phone number?", label: "Phone" },
];

// Minimal shape of the Web Speech API surface we use; the DOM lib doesn't ship it.
type RecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
type RecognitionErrorEvent = { error?: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Dictated email/phone arrive as prose ("jane at cleard dot com", "five five five…"). */
function tidy(key: VictoriaField, raw: string): string {
  const text = raw.trim();
  if (key === "email") {
    return text
      .toLowerCase()
      .replace(/\s+at\s+/g, "@")
      .replace(/\s+dot\s+/g, ".")
      .replace(/\s+underscore\s+/g, "_")
      .replace(/\s+dash\s+|\s+hyphen\s+/g, "-")
      .replace(/\s+/g, "");
  }
  if (key === "phone") return text.replace(/[^\d+]/g, "");
  if (key === "license_number") return text.toUpperCase().replace(/\s+/g, "");
  return text;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    // Speech synthesis is a nicety; never let it break the flow.
  }
}

const OBSIDIAN = "#2F4F4F";
const MUTED = `color-mix(in oklab, ${OBSIDIAN} 55%, transparent)`;

export function VictoriaVoiceSignup({
  onField,
  disabled,
}: {
  onField: (field: VictoriaField, value: string) => void;
  disabled?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
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
      setHeard(null);
      setNotice(null);
      speak(field.prompt);

      const rec = new Ctor();
      recognition.current = rec;
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (e: RecognitionResultEvent) => {
        const transcript = e.results?.[0]?.[0]?.transcript ?? "";
        const value = tidy(field.key, transcript);
        if (!value) {
          setNotice("Didn't catch that — try again.");
          return;
        }
        onField(field.key, value);
        setHeard(value);
        advance.current = window.setTimeout(() => {
          const next = step + 1;
          if (next >= SCRIPT.length) {
            setRunning(false);
            setHeard(null);
            setNotice("All set — check the fields and submit.");
            return;
          }
          setIndex(next);
          listenFor(next);
        }, 1400);
      };

      rec.onerror = (e: RecognitionErrorEvent) => {
        const code = e.error;
        setListening(false);
        setNotice(
          code === "not-allowed" || code === "service-not-allowed"
            ? "Microphone blocked — just type the form instead."
            : "Voice input stopped — tap the mic to retry, or type it.",
        );
        if (code === "not-allowed" || code === "service-not-allowed") setRunning(false);
      };

      rec.onend = () => setListening(false);

      try {
        rec.start();
        setListening(true);
      } catch {
        setNotice("Voice input couldn't start — type the form instead.");
        setRunning(false);
      }
    },
    [onField, teardown],
  );

  if (!supported) return null;

  const current = SCRIPT[index];

  if (!running) {
    return (
      <div className="mb-8">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setRunning(true);
            setIndex(0);
            listenFor(0);
          }}
          className="inline-flex items-center gap-2 px-4 h-11 font-mono text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ border: `1px solid ${OBSIDIAN}`, color: OBSIDIAN, borderRadius: 0 }}
        >
          <Mic className="h-3.5 w-3.5" strokeWidth={1.75} /> Fill with Victoria
        </button>
        <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
          {notice ?? "Say each answer out loud and Victoria fills the form for you."}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 p-4" style={{ border: `1px solid ${OBSIDIAN}` }}>
      <div className="flex items-center justify-between gap-4">
        <div
          className="font-mono text-[10px] uppercase"
          style={{ color: MUTED, letterSpacing: "0.2em" }}
        >
          Victoria · {index + 1} of {SCRIPT.length}
        </div>
        <button
          type="button"
          onClick={() => {
            teardown();
            setRunning(false);
            setNotice("Stopped — you can keep typing.");
          }}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color: MUTED }}
        >
          <Square className="h-3 w-3" strokeWidth={2} /> Stop
        </button>
      </div>

      <div className="mt-3 text-[15px]" style={{ color: OBSIDIAN }}>
        {current?.prompt}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color: listening ? OBSIDIAN : MUTED }}
        >
          <Mic className="h-3.5 w-3.5" strokeWidth={1.75} />
          {listening ? "Listening…" : "Paused"}
        </span>
        <button
          type="button"
          onClick={() => listenFor(index)}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] hover:opacity-80"
          style={{ color: MUTED }}
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} /> Redo
        </button>
      </div>

      {heard && (
        <div className="mt-3 text-[13px]" style={{ color: OBSIDIAN }}>
          Got it: <span className="font-mono">{heard}</span>
        </div>
      )}
      {notice && (
        <div className="mt-3 text-[12px]" style={{ color: MUTED }}>
          {notice}
        </div>
      )}
    </div>
  );
}
