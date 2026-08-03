#!/usr/bin/env python3
import argparse
import re
import sys

SPEC_RE = re.compile(r'^##\s*Spec\s*$', re.IGNORECASE | re.MULTILINE)


def extract_spec(text: str) -> str:
    m = SPEC_RE.search(text)
    if not m:
        return ""

    start = m.end()
    next_heading = re.search(r'^\#{1,2}\s', text[start:], re.MULTILINE)
    end = start + next_heading.start() if next_heading else len(text)
    return text[start:end].strip()


def main():
    parser = argparse.ArgumentParser(
        description="Extract the ## Spec section from a PR description."
    )
    parser.add_argument("input_file", help="File containing the PR description.")
    parser.add_argument("output_file", help="File to write the extracted spec to.")
    args = parser.parse_args()

    with open(args.input_file, encoding="utf-8") as f:
        body = f.read()

    spec = extract_spec(body)
    with open(args.output_file, "w", encoding="utf-8") as f:
        f.write(spec)

    if not spec:
        print("No ## Spec section found.", file=sys.stderr)


if __name__ == "__main__":
    main()
