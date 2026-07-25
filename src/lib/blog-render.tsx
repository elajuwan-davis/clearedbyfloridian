import type { ReactNode } from "react";

// Very small, safe inline formatter: escapes HTML, then applies **bold**, *italic*, and [text](url) links.
function renderInline(text: string): ReactNode[] {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const tokens: ReactNode[] = [];
  const regex =
    /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(escaped)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(escaped.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      tokens.push(<strong key={`b-${key++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      tokens.push(<em key={`i-${key++}`}>{match[2]}</em>);
    } else if (match[3] && match[4]) {
      tokens.push(
        <a
          key={`a-${key++}`}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:opacity-80"
        >
          {match[3]}
        </a>,
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < escaped.length) tokens.push(escaped.slice(lastIndex));
  return tokens;
}

export function RenderedBody({ body }: { body: string }) {
  const paragraphs = body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-6 text-[15px] leading-[1.75] text-foreground">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}
