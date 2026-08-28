// The browser's own speech-to-text, wrapped just enough to be usable twice: the /join
// voice-fill and the permit-form assistant. Deliberately not an AI feature — no LLM, no
// transcription service, nothing new on the backend. Where the API is missing
// (Safari/Firefox) callers render nothing and the user types, as always.

/** Minimal shape of the Web Speech API surface we use; the DOM lib doesn't ship it. */
export type RecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
export type RecognitionErrorEvent = { error?: string };

export type SpeechRecognitionLike = {
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

export function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speak(text: string) {
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

/** Dictated email arrives as prose: "jane at cleard dot com". */
export function tidyEmail(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+at\s+/g, "@")
    .replace(/\s+(?:dot|period)\s+/g, ".")
    .replace(/\s+underscore\s+/g, "_")
    .replace(/\s+dash\s+|\s+hyphen\s+/g, "-")
    .replace(/\s+/g, "");
}

export function tidyPhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "");
}

/** "skip"/"next"/"pass" leaves a field alone instead of dictating a value into it. */
export function isSkip(raw: string): boolean {
  return /^(skip|next|pass|skip it|leave it|leave blank|none)\.?$/i.test(raw.trim());
}
