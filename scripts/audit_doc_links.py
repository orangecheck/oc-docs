#!/usr/bin/env python3
"""Audit every internal markdown link in docs.ochk.io's MDX. Print broken
ones — links that resolve to a path that has no MDX file backing it.

Also flags links that look like they were copied from a per-subdomain doc
tree and now point at a non-existent docs.ochk.io path (e.g. stamp's
`/create` referring to stamp.ochk.io's create tool).
"""
import os
import re
from pathlib import Path

ROOT = Path.home() / "Projects" / "ochk" / "oc-docs" / "src" / "pages"

# Build the set of existing internal paths.
existing: set[str] = set()
for dp, _, files in os.walk(ROOT):
    for f in files:
        if not f.endswith(".mdx"):
            continue
        rel = (Path(dp) / f).relative_to(ROOT).as_posix()
        rel = "/" + rel.removesuffix("/index.mdx").removesuffix(".mdx")
        if rel == "/":
            existing.add("/")
        else:
            existing.add(rel.rstrip("/"))

LINK_RE = re.compile(r"\]\((/[a-z][a-z0-9\-/_]*)(?:#[^)]*)?\)")

broken: list[tuple[str, str, str]] = []
for dp, _, files in os.walk(ROOT):
    for f in files:
        if not f.endswith(".mdx"):
            continue
        full = Path(dp) / f
        rel = full.relative_to(ROOT).as_posix()
        src = full.read_text()
        for m in LINK_RE.finditer(src):
            target = m.group(1).rstrip("/")
            if target == "":
                target = "/"
            if target in existing:
                continue
            # Capture a short context window
            start = max(0, m.start() - 30)
            end = min(len(src), m.end() + 10)
            ctx = src[start:end].replace("\n", " ")
            broken.append((rel, target, ctx))

if broken:
    print(f"BROKEN INTERNAL LINKS — {len(broken)}")
    for rel, target, ctx in broken:
        print(f"  {rel:<35}  →  {target}")
else:
    print("All internal MDX links resolve.")
