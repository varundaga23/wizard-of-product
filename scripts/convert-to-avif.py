#!/usr/bin/env python3
"""
Convert PNG/JPG images to AVIF for faster page loads.
Targets: professor cards, duel images, spell cards, remaining large background PNGs.
"""

import os
import sys
from pathlib import Path
from PIL import Image
import pillow_avif  # noqa: F401 — registers AVIF encoder with Pillow

ASSETS = Path(__file__).parent.parent / "public" / "assets"

TARGETS = [
    (ASSETS / "professors", "*.png"),
    (ASSETS / "spell-cards", "*.png"),
    (ASSETS, "playbook_bg.png"),
    (ASSETS, "prof_selection_bg.png"),
    (ASSETS, "spellcraft_logo.png"),
    (ASSETS, "scroll_no_bg.png"),
    (ASSETS, "Summo_letter_background.jpg"),
    (ASSETS, "professor_placeholder.png"),
    (ASSETS, "strategy_tower_icon.png"),
    (ASSETS, "pm_tower_icon.png"),
    (ASSETS, "ai_tower_icon.png"),
]

# AVIF encode quality (0-100, higher = better quality, bigger file)
QUALITY = 80

def convert_file(src: Path) -> None:
    dst = src.with_suffix(".avif")
    if dst.exists():
        print(f"  SKIP (exists): {dst.name}")
        return
    try:
        img = Image.open(src)
        # Preserve RGBA for transparency
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA") if "A" in img.mode else img.convert("RGB")
        img.save(dst, "AVIF", quality=QUALITY)
        src_mb = src.stat().st_size / 1_048_576
        dst_kb = dst.stat().st_size / 1024
        pct = (1 - dst.stat().st_size / src.stat().st_size) * 100
        print(f"  OK  {src.name:55s} {src_mb:5.1f}MB → {dst_kb:6.0f}KB  ({pct:.0f}% smaller)")
    except Exception as e:
        print(f"  ERR {src.name}: {e}")

total = 0
for entry in TARGETS:
    if len(entry) == 2:
        directory, pattern = entry
        if pattern.startswith("*"):
            files = sorted(directory.glob(pattern))
        else:
            files = [directory / pattern]
    else:
        files = [entry]

    for f in files:
        if f.exists() and f.suffix.lower() in (".png", ".jpg", ".jpeg"):
            total += 1
            convert_file(f)

print(f"\nDone. Processed {total} files.")
