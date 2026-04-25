#!/usr/bin/env python3
"""Add `export const metadata` to MDX files that don't have one.

Title: derived from the first H1 line (after stripping bold/code).
Description: the first non-empty paragraph after the H1, condensed to one
line and truncated to ~160 chars. We escape single quotes so the literal
ends up valid JS.
"""
import re
from pathlib import Path

ROOT = Path.home() / "Projects" / "ochk" / "oc-docs" / "src" / "pages"

TARGETS = [
    "stamp/envelope.mdx",
    "stamp/nostr.mdx",
    "stamp/ots.mdx",
    "stamp/protocol.mdx",
    "stamp/quickstart.mdx",
    "stamp/security.mdx",
    "stamp/spec.mdx",
    "stamp/why.mdx",
    "vote/api.mdx",
    "vote/integration.mdx",
    "vote/protocol.mdx",
    "vote/quickstart.mdx",
    "vote/secret-ballot.mdx",
    "vote/security.mdx",
    "vote/spec.mdx",
    "vote/why.mdx",
]

H1_RE = re.compile(r"^# (?P<text>[^#].*?)$", re.M)


def first_paragraph(after: str) -> str:
    """Return the first non-empty paragraph after a given offset, joined to
    a single line and stripped of markdown decoration that wouldn't render
    in a meta description.
    """
    paras = re.split(r"\n\s*\n", after.strip(), maxsplit=2)
    if not paras:
        return ""
    p = paras[0].strip()
    # Drop leading bullet markers / quote markers
    p = re.sub(r"^[>*\-]+\s+", "", p)
    # Collapse whitespace
    p = re.sub(r"\s+", " ", p)
    # Strip markdown emphasis + inline code + links
    p = re.sub(r"\*\*([^*]+)\*\*", r"\1", p)
    p = re.sub(r"\*([^*]+)\*", r"\1", p)
    p = re.sub(r"`([^`]+)`", r"\1", p)
    p = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", p)
    return p


def derive_title(h1: str) -> str:
    t = h1.strip()
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    return t


def js_quote(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def patch(path: Path) -> bool:
    src = path.read_text()
    if "export const metadata" in src:
        return False
    m = H1_RE.search(src)
    if not m:
        print(f"  SKIP (no H1): {path.relative_to(ROOT)}")
        return False
    title = derive_title(m.group("text"))
    after = src[m.end():]
    desc = first_paragraph(after)
    desc = desc[:200].rstrip()
    if len(desc) > 160:
        # cut to last sentence boundary <= 200
        cut = desc.rfind(". ", 0, 200)
        if cut > 80:
            desc = desc[: cut + 1]
    block = (
        "export const metadata = {\n"
        f"    title: '{js_quote(title)}',\n"
        f"    description: '{js_quote(desc)}',\n"
        "};\n\n"
    )
    new_src = block + src
    path.write_text(new_src)
    print(f"  patched: {path.relative_to(ROOT)}  title='{title[:50]}…'")
    return True


def main() -> None:
    n = 0
    for rel in TARGETS:
        p = ROOT / rel
        if patch(p):
            n += 1
    print(f"\n{n} file(s) patched.")


if __name__ == "__main__":
    main()
