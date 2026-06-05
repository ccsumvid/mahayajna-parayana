#!/usr/bin/env python3
"""Fix data issues in gita-presentation/data/ JSON files.

Fix 1: uvaca lines with sty='uh' at the start of shloka 1 (and some others)
        causing them to render as separate header slides. Change to sty=''.
Fix 2: Chapter 8 colophon shloka with all sty='th'/'uh' entries causing 8
        separate pages. Change all to sty=''.
Fix 3: Chapter 18 shloka 2 has a trailing sty='uh' entry (speaker label for
        shloka 3). Move it to the beginning of shloka 3 with sty=''.
"""

import json
import os

data_dir = '/Volumes/ssd1/projects/gita-presentation/data'


def load(chapter_num):
    path = os.path.join(data_dir, f'chapter_{chapter_num:02d}.json')
    with open(path) as f:
        return json.load(f)


def save(data, chapter_num):
    path = os.path.join(data_dir, f'chapter_{chapter_num:02d}.json')
    with open(path, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  Saved chapter_{chapter_num:02d}.json')


def fix_uh_entry(chapter_num, shloka_num_str, entry_idx):
    data = load(chapter_num)
    for sh in data['shloka']:
        if sh['shlokaNum'] == shloka_num_str:
            e = sh['entry'][entry_idx]
            if e.get('sty') == 'uh':
                e['sty'] = ''
                print(f'  ch{chapter_num:02d} shloka={shloka_num_str} entry[{entry_idx}]: uh→"" : {e.get("iast","")[:50]}')
            else:
                print(f'  ch{chapter_num:02d} shloka={shloka_num_str} entry[{entry_idx}]: sty already "{e.get("sty","")}", skipping')
            break
    save(data, chapter_num)


# ---------------------------------------------------------------------------
# Fix 1: uvaca entries at start of shlokas
# ---------------------------------------------------------------------------
print('=== Fix 1: uvaca sty uh → "" ===')
fix_uh_entry(2, '1', 0)   # Sanjaya uvāca
fix_uh_entry(4, '1', 0)   # Śrī bhagavānuvāca
fix_uh_entry(5, '1', 0)   # Arjuna uvāca
fix_uh_entry(5, '2', 0)   # Śrī bhagavānuvāca
fix_uh_entry(7, '1', 0)   # Śrī bhagavānuvāca
fix_uh_entry(8, '1', 0)   # Arjuna uvāca
fix_uh_entry(9, '1', 0)   # Śrī bhagavānuvāca
fix_uh_entry(12, '1', 0)  # Arjuna uvāca
fix_uh_entry(16, '1', 0)  # Śrī bhagavānuvāca

# ---------------------------------------------------------------------------
# Fix 2: Chapter 8 colophon — all entries header-only, collapse to sty=""
# ---------------------------------------------------------------------------
print('\n=== Fix 2: Chapter 8 colophon ===')
data = load(8)
for sh in data['shloka']:
    has_tatsaditi = any(
        'tatsaditi' in e.get('iast', '') or 'adhyāyaḥ' in e.get('iast', '')
        for e in sh['entry']
    )
    all_header = all(e.get('sty', '') in ('th', 'uh', 'fh', 'sh') for e in sh['entry'])
    if has_tatsaditi and all_header:
        for e in sh['entry']:
            e['sty'] = ''
        print(f'  ch08: cleared sty on {len(sh["entry"])} entries in colophon shloka shlokaNum={repr(sh["shlokaNum"])}')
save(data, 8)

# ---------------------------------------------------------------------------
# Fix 3: Chapter 18 — move trailing uh entry of shloka 2 to start of shloka 3
# ---------------------------------------------------------------------------
print('\n=== Fix 3: Chapter 18 shloka 2 trailing uh → prepend to shloka 3 ===')
data = load(18)
shlokas = data['shloka']
sh2 = next(s for s in shlokas if s['shlokaNum'] == '2')
sh3 = next(s for s in shlokas if s['shlokaNum'] == '3')

last_entry = sh2['entry'][-1]
if last_entry.get('sty') == 'uh':
    uh_entry = sh2['entry'].pop()
    uh_entry['sty'] = ''
    sh3['entry'].insert(0, uh_entry)
    print(f'  ch18: moved "{uh_entry.get("iast","")[:50]}" from shloka2[-1] to shloka3[0] with sty=""')
else:
    print(f'  ch18: shloka2 last entry sty={repr(last_entry.get("sty",""))}, nothing to do')
save(data, 18)

print('\nAll fixes applied.')
