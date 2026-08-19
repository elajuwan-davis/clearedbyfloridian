"""One-off: map the legacy palettes onto Nordic Luxury tokens across the app.

Kept out of the build; run with `python3 scripts/theme-sweep.py` from the repo root.
"""

import pathlib
import re
import sys

# legacy hex -> Nordic Luxury replacement
HEX = {
    # near-black / navy inks
    "#111110": "#2F4F4F",
    "#0F1E2E": "#2F4F4F",
    "#0B1726": "#233C3C",
    "#0C1B2B": "#233C3C",
    "#153157": "#2F4F4F",
    "#0A1B2E": "#1A2E2E",
    "#0B1220": "#233C3C",
    "#111827": "#2A4444",
    "#1A2436": "#1E3434",
    "#1F2937": "#1E3434",
    "#0F2030": "#1E3434",
    "#132133": "#2A4444",
    "#07101C": "#1A2E2E",
    "#040C14": "#142424",
    "#1E3448": "rgba(250,243,230,0.14)",
    "#1A3448": "rgba(250,243,230,0.18)",
    "#2B1620": "#2F4F4F",
    "#55575D": "#5C7370",
    # teal / blue / green brand marks
    "#00B4A8": "#673147",
    "#009088": "#52243A",
    "#1B84D4": "#673147",
    "#1268AC": "#52243A",
    "#1D4ED8": "#673147",
    "#3B82F6": "#673147",
    "#2F73DB": "#52243A",
    "#60A5FA": "#673147",
    "#7DB3FB": "#8E4B67",
    "#B6DAEA": "#E6E6FA",
    "#12A05C": "#4E6B5C",
    "#0D8049": "#3F5749",
    "#16A34A": "#3F5749",
    "#22C55E": "#4E6B5C",
    "#4ADE80": "#7FA98F",
    "#A78BFA": "#7A5C8A",
    "#C4B5FD": "#C7B7E8",
    # ambers
    "#E8861A": "#9A7B2E",
    "#F59E0B": "#9A7B2E",
    "#FBBF24": "#D2B15C",
    # reds
    "#EF4444": "#8C3B3B",
    "#DC2626": "#8C3B3B",
    "#C03030": "#8C3B3B",
    "#F87171": "#D08585",
    # second pass: leftovers from the older marketing + CDS layers
    "#111310": "#2F4F4F",
    "#0B0D0B": "#FAF3E6",
    "#2A2E2C": "#3F5C5A",
    "#9A8E7C": "#8B9A97",
    "#B42318": "#8C3B3B",
    "#D24B4B": "#8C3B3B",
    "#D14343": "#8C3B3B",
    "#7A1E1E": "#8C3B3B",
    "#D98A8A": "#D08585",
    "#0E8C84": "#673147",
    "#005FA3": "#673147",
    "#6040A0": "#7A5C8A",
    "#B4842A": "#9A7B2E",
    # third pass
    "#3A3A33": "#2F4F4F",
    "#8E8B82": "#8B9A97",
    "#0C0D0B": "#2F4F4F",
    "#007C74": "#4E6B5C",
    "#00917F": "#4E6B5C",
    "#FF7A59": "#9A7B2E",
    "#C34A2F": "#8C3B3B",
    "#B91C1C": "#8C3B3B",
    "#B7B4AA": "#8B9A97",
    "#331B26": "#2F4F4F",
    "#06110F": "#FAF3E6",
    "#FAFAF7": "#FAF3E6",
    # paper / lines
    "#FFFFFF": "#FAF3E6",
    "#FAFAF8": "#FAF3E6",
    "#F5F4F0": "#F3EAD9",
    "#F5F2EC": "#FAF3E6",
    "#F2EEE8": "#F3EAD9",
    "#EEECEA": "#EFE6D6",
    "#E8DDD2": "#EDE0C9",
    "#E4E2DE": "#E0D3BC",
    "#E2E8F0": "#E0D3BC",
    "#CBD5E1": "#CFBE9F",
    "#C9C8BC": "#CFBE9F",
    "#E8EDF2": "#E6E6FA",
    "#F4F6F8": "#F3EAD9",
    "#F9FAFB": "#FAF3E6",
    "#EDF2F7": "#FAF3E6",
    # greys -> slate family
    "#6B6860": "#5C7370",
    "#8C8B7A": "#5C7370",
    "#9E9B96": "#8B9A97",
    "#999999": "#8B9A97",
    "#9CA3AF": "#8B9A97",
    "#6B7280": "#5C7370",
    "#3D5166": "#5C7370",
    "#7890A4": "#8B9A97",
    "#6B8299": "#8B9A97",
}

# font stacks -> Fraunces (mono is intentionally left alone: tabular data)
FONTS = [
    (
        r'"Inter", ui-sans-serif, system-ui, sans-serif',
        '"Fraunces", "Iowan Old Style", Georgia, serif',
    ),
    (
        r'"DM Sans", ui-sans-serif, system-ui, sans-serif',
        '"Fraunces", "Iowan Old Style", Georgia, serif',
    ),
    (
        r'"Space Grotesk", "Inter", system-ui, sans-serif',
        '"Fraunces", "Iowan Old Style", Georgia, serif',
    ),
    (
        r'"Cormorant Garamond", Georgia, serif',
        '"Fraunces", "Iowan Old Style", Georgia, serif',
    ),
    (
        r'"Cormorant Garamond", "Times New Roman", serif',
        '"Fraunces", "Iowan Old Style", Georgia, serif',
    ),
    (
        r'-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        '"Fraunces", "Iowan Old Style", Georgia, serif',
    ),
]

ROOT = pathlib.Path(__file__).resolve().parent.parent / "src"
SKIP_DIRS = {"integrations"}


# legacy rgb() channels used inside rgba(...) -> Nordic equivalents
RGB = {
    (0, 180, 168): (103, 49, 71),
    (0, 95, 163): (103, 49, 71),
    (27, 132, 212): (103, 49, 71),
    (120, 80, 200): (122, 92, 138),
    (21, 49, 87): (47, 79, 79),
    (15, 30, 46): (47, 79, 79),
    (17, 17, 16): (47, 79, 79),
    (34, 197, 94): (78, 107, 92),
    (245, 158, 11): (154, 123, 46),
    (239, 68, 68): (140, 59, 59),
    (59, 130, 246): (103, 49, 71),
    (167, 139, 250): (122, 92, 138),
    (249, 250, 251): (250, 243, 230),
}

RGBA_RE = re.compile(r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*([,)])")


def convert(text: str) -> str:
    def sub_hex(m: re.Match[str]) -> str:
        raw = m.group(0)
        repl = HEX.get(raw.upper())
        if repl is None:
            return raw
        return repl.lower() if raw.islower() else repl

    def sub_rgb(m: re.Match[str]) -> str:
        key = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
        repl = RGB.get(key)
        if repl is None:
            return m.group(0)
        head = "rgba(" if m.group(4) == "," else "rgb("
        return f"{head}{repl[0]}, {repl[1]}, {repl[2]}{m.group(4)}"

    text = re.sub(r"#[0-9a-fA-F]{6}\b", sub_hex, text)
    text = RGBA_RE.sub(sub_rgb, text)
    for old, new in FONTS:
        text = text.replace(old, new)
    return text


def main() -> int:
    changed = 0
    for path in ROOT.rglob("*"):
        if path.suffix not in {".tsx", ".ts", ".css"} or not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        before = path.read_text()
        after = convert(before)
        if after != before:
            path.write_text(after)
            changed += 1
            print("updated", path.relative_to(ROOT.parent))
    print(f"{changed} files changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
