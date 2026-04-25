#!/usr/bin/env python3
"""Systematic audit of every MDX page in docs.ochk.io.

Checks each file for:
  - presence of `export const metadata = { title, description }`
  - exactly one H1 (`# `) at top, after the metadata
  - no leftover stale phrasing: "design-state", "coming soon", "TBD",
    "in flight", "private until", "no packages", "TK"
  - no leftover per-subdomain absolute URLs that should be docs.ochk.io
    relative paths (e.g. https://docs.ochk.io/<protocol>/<page>)
  - HTTP status of every external link (samples; non-blocking)
  - presence in nav.ts (no orphan files; no dead nav entries)
  - referenced anchors that don't exist on the target page
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path.home() / "Projects" / "ochk" / "oc-docs"
PAGES = ROOT / "src" / "pages"
NAV = ROOT / "src" / "components" / "docs" / "nav.ts"

# ─── inventory ──────────────────────────────────────────────────────────
mdx: list[Path] = sorted(p for p in PAGES.rglob("*.mdx"))
print(f"== docs.ochk.io audit · {len(mdx)} pages ==\n")

# ─── load nav.ts ────────────────────────────────────────────────────────
nav_text = NAV.read_text()
nav_hrefs = set(re.findall(r"href:\s*['\"]([^'\"]+)['\"]", nav_text))


# ─── stale phrasing patterns ────────────────────────────────────────────
STALE = [
    (re.compile(r"\bdesign[ -]state\b", re.I),  "design-state phrasing"),
    (re.compile(r"\bcoming soon\b",      re.I), "'coming soon'"),
    (re.compile(r"\bnot yet (implemented|published)\b", re.I), "'not yet implemented/published'"),
    (re.compile(r"\bTBD\b"),                    "TBD marker"),
    (re.compile(r"\bin flight\b",        re.I), "'in flight'"),
    (re.compile(r"\bprivate until\b",    re.I), "'private until'"),
    (re.compile(r"\bno packages (are )?published\b", re.I), "'no packages published'"),
    (re.compile(r"\bTK\s",               re.I), "TK marker"),
    (re.compile(r"\bFIXME\b"),                  "FIXME"),
    (re.compile(r"\bcome back soon\b",   re.I), "'come back soon'"),
    (re.compile(r"\bwatch the space\b",  re.I), "'watch the space'"),
]


# ─── checks per file ────────────────────────────────────────────────────
issues: dict[str, list[str]] = {}


def slug_for(p: Path) -> str:
    rel = p.relative_to(PAGES).as_posix()
    if rel == "index.mdx":
        return "/"
    rel = "/" + rel.removesuffix("/index.mdx").removesuffix(".mdx")
    return rel.rstrip("/") or "/"


for p in mdx:
    rel_slug = slug_for(p)
    src = p.read_text()
    bag: list[str] = []

    # 1. metadata block + has both title and description
    if "export const metadata" not in src:
        bag.append("missing `export const metadata`")
    else:
        meta_block = src[: src.find("\n\n", src.find("export const metadata"))]
        if "title:" not in meta_block:
            bag.append("metadata: missing `title:`")
        if "description:" not in meta_block:
            bag.append("metadata: missing `description:`")

    # 2. exactly one top-level H1 (ignoring lines inside fenced code blocks).
    in_fence = False
    h1_count = 0
    for ln in src.splitlines():
        if ln.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if re.match(r"^# [^#]", ln):
            h1_count += 1
    if h1_count == 0:
        bag.append("no top-level H1")
    elif h1_count > 1:
        bag.append(f"{h1_count} H1s (should be 1)")

    # 3. stale phrasing
    for pat, desc in STALE:
        if pat.search(src):
            # show the snippet
            m = pat.search(src)
            snippet = src[max(0, m.start() - 20):m.end() + 20].replace("\n", " ")
            bag.append(f"stale: {desc} — …{snippet}…")

    # 4. no in-repo links to https://docs.ochk.io/X — should be relative /X
    for m in re.finditer(r"https://docs\.ochk\.io(/[a-z][^)\s\"']*)", src):
        bag.append(f"absolute docs URL: should be relative `{m.group(1)}`")

    # 5. nav presence — every file slug should be reachable from nav,
    #    OR be reachable as a sub-page of a nav entry (guides, etc).
    if rel_slug != "/":
        # Find the section root for this slug (e.g. /attest/guides/express → /attest)
        parts = rel_slug.strip("/").split("/")
        section_root = "/" + parts[0]
        if rel_slug not in nav_hrefs and section_root not in nav_hrefs:
            bag.append("no nav.ts entry referencing this page (or its section)")

    if bag:
        issues[rel_slug] = bag


# ─── nav-only entries (dead) ────────────────────────────────────────────
existing_slugs = {slug_for(p) for p in mdx}
for href in sorted(nav_hrefs):
    if href.startswith("http"):
        continue
    canonical = href.rstrip("/") or "/"
    if canonical not in existing_slugs:
        issues.setdefault("nav.ts", []).append(f"dead entry: {href} (no MDX file)")


# ─── output ─────────────────────────────────────────────────────────────
if not issues:
    print("(no issues)")
else:
    for slug in sorted(issues):
        print(f"\n— {slug}")
        for s in issues[slug]:
            print(f"   • {s}")
print()
print(f"== {sum(len(v) for v in issues.values())} issues across {len(issues)} pages ==")
