#!/usr/bin/env python3
"""Generate data/purnam.json (Task 12).

Source mantra (exact diacritics, incl. U+0331 combining macron-below on 'a' in
pūrṇamādā̱ya) is carried over verbatim from the shloka 5 text that was removed
from data/kshama_prarthana.json in Task 11/commit 2b9b2da.

PPTX reference slides 277-278 only show a "Purnam" title + a video clip (no
verse layout), so we use the standard 4-line + shanti split. The feedback noted
the original kshama line had a missing break; this file restores proper breaks.

IAST-only section: this app has no Devanagari source for Purnam, so (matching
datta_stavam.json convention) the same romanized string is placed in both
`text` and `iast`. No defaultBpm (manual tempo, per Task 9).
"""
import json
import os

# Lines split from the source mantra, punctuation kept attached (datta convention).
# Combining U+0331 is preserved inside pūrṇamādā̱ya.
lines = [
    ("ōṁ pūrṇamadaḥ pūrṇamidaṁ", "l"),
    ("pūrṇātpūrṇamudacyatē|", "l"),
    ("pūrṇasya pūrṇamādā̱ya", "l"),
    ("pūrṇamēvāvaśiṣyatē||", ""),
]
shanti = ("ōṁ śāntiḥ śāntiḥ śāntiḥ||", "")


def entry(t, swhtsp):
    return {"text": t, "iast": t, "swhtsp": swhtsp, "shlNbr": "00", "sty": ""}


data = {
    "name": "pūrṇam",
    "iastName": "pūrṇam",
    "chapterNum": "purnam",
    "shloka": [
        {"shlokaNum": "1", "entry": [entry(t, s) for (t, s) in lines]},
        {"shlokaNum": "2", "entry": [entry(shanti[0], shanti[1])]},
    ],
}

out = os.path.join(os.path.dirname(__file__), "..", "data", "purnam.json")
out = os.path.abspath(out)
with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write("\n")
print("wrote", out)
