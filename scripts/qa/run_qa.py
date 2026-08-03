#!/usr/bin/env python3
import argparse
import json
import os
import sys

from anthropic import Anthropic

DEFAULT_MODEL = "claude-haiku-4-5-20251001"

QA_TOOL = {
    "name": "qa_assessment",
    "description": "Return a structured QA assessment of the PR diff against the spec.",
    "input_schema": {
        "type": "object",
        "properties": {
            "pass": {
                "type": "boolean",
                "description": "True only if the diff satisfies the spec with score >= 7 and no critical gaps.",
            },
            "score": {
                "type": "number",
                "description": "Overall quality score from 0 to 10.",
            },
            "summary": {
                "type": "string",
                "description": "Short summary of the QA assessment.",
            },
            "gaps": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Numbered or bulleted list of non-critical gaps.",
            },
            "critical_gaps": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Critical gaps such as missing RLS, plaintext secrets, or wrong table.",
            },
        },
        "required": ["pass", "score", "summary", "gaps", "critical_gaps"],
    },
}

PROMPT = """You are a QA agent reviewing a pull request diff against its specification.

## Spec
{spec}

## Diff
{diff}

Evaluate the diff against the spec. Be strict. Look for:
- Missing RLS (Row Level Security) in database migrations or schema
- Plaintext secrets or credentials
- Wrong table, column, or variable names
- Any other deviation between the spec and implementation

Return a structured assessment using the provided tool. The score must be 0-10. A score >= 7 with NO critical gaps is a pass. If any critical gap is present (e.g., missing RLS, plaintext secrets, wrong table), pass must be false. List gaps as a numbered list of concise, specific issues.
"""


def load_text(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        return f.read()


def run_assessment(diff: str, spec: str, model: str, api_key: str) -> dict:
    client = Anthropic(api_key=api_key)

    # Truncate very large diffs to avoid exceeding context limits.
    max_diff_chars = 180_000
    if len(diff) > max_diff_chars:
        diff = diff[:max_diff_chars] + "\n\n[diff truncated]"

    message = client.messages.create(
        model=model,
        max_tokens=4096,
        temperature=0,
        system="You are a QA code reviewer. Always call the qa_assessment tool.",
        messages=[
            {
                "role": "user",
                "content": PROMPT.format(spec=spec or "(no spec provided)", diff=diff),
            }
        ],
        tools=[QA_TOOL],
        tool_choice={"type": "tool", "name": "qa_assessment"},
    )

    for block in message.content:
        if block.type == "tool_use" and block.name == "qa_assessment":
            return block.input

    raise RuntimeError("No structured QA assessment returned by the model.")


def main():
    parser = argparse.ArgumentParser(
        description="Run QA assessment on a PR diff against a spec."
    )
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--diff", required=True, help="Path to the PR diff file.")
    parser.add_argument("--spec", required=True, help="Path to the extracted spec file.")
    parser.add_argument("--output", required=True, help="Path to write the JSON result.")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY is required", file=sys.stderr)
        sys.exit(1)

    diff = load_text(args.diff)
    spec = load_text(args.spec)

    result = run_assessment(diff, spec, args.model, api_key)

    score = float(result.get("score", 0))
    critical_gaps = result.get("critical_gaps", [])
    result["pass"] = (
        bool(result.get("pass", False)) and score >= 7 and not critical_gaps
    )
    result["score"] = score
    result.setdefault("summary", "")
    result.setdefault("gaps", [])
    result.setdefault("critical_gaps", [])

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
