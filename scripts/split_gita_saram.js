#!/usr/bin/env node
/*
 * Task 16: Gita Saram — split each 2-entry shloka into 4 entries (4-line layout),
 * and add repeat:2 to slokas 3 and 4.
 *
 * Approach: the deck (slides 255-261) has NO readable verse text (intro media / videos /
 * gifs only), so we fall back to splitting each existing line at its internal pada
 * boundary. The boundary is chosen at the word gap nearest the syllable-count midpoint
 * of the line's content words, using the same IAST syllable splitter as src/shared.js.
 * Marker tokens (|, ||, ||N||, digits) stay attached to the line they belong to.
 *
 * Only redistributes existing words across entries. No spelling/word changes.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'gita_saram.json');

// IAST syllable splitter (mirrors src/shared.js iastProsody.splitSyllables)
const VOWEL_RE = /^(ai|au|ā|ī|ū|ṝ|ḹ|ē|ō|a|i|u|ṛ|ḷ|e|o)/i;
const CONSONANT_RE = /^(kh|gh|ch|jh|ṭh|ḍh|th|dh|ph|bh|k|g|ṅ|c|j|ñ|ṭ|ḍ|ṇ|t|d|n|p|b|m|y|r|l|v|ś|ṣ|s|h)/i;
const ANUSVARA_RE = /^[ṁṃ]/;
const VISARGA_RE = /^ḥ/;

function splitSyllables(word) {
  const syllables = [];
  let i = 0;
  const lower = word.toLowerCase();
  while (i < lower.length) {
    let m = lower.slice(i).match(CONSONANT_RE);
    if (m) {
      let syl = '', sylLen = 0;
      while (i + sylLen < lower.length) {
        m = lower.slice(i + sylLen).match(CONSONANT_RE);
        if (!m) break;
        syl += word.slice(i + sylLen, i + sylLen + m[0].length);
        sylLen += m[0].length;
      }
      m = lower.slice(i + sylLen).match(VOWEL_RE);
      if (m) { syl += word.slice(i + sylLen, i + sylLen + m[0].length); sylLen += m[0].length; }
      m = lower.slice(i + sylLen).match(ANUSVARA_RE) || lower.slice(i + sylLen).match(VISARGA_RE);
      if (m) { syl += word.slice(i + sylLen, i + sylLen + m[0].length); sylLen += m[0].length; }
      if (syl) syllables.push(syl);
      i += sylLen;
    } else {
      m = lower.slice(i).match(VOWEL_RE);
      if (m) {
        let sylLen = m[0].length;
        let m2 = lower.slice(i + sylLen).match(ANUSVARA_RE) || lower.slice(i + sylLen).match(VISARGA_RE);
        if (m2) sylLen += m2[0].length;
        syllables.push(word.slice(i, i + sylLen));
        i += sylLen;
      } else { i++; }
    }
  }
  return syllables;
}

function isMarkerTok(w) {
  return /^[|]+$/.test(w) || /^\d+$/.test(w) || w === '';
}

/*
 * Split one line (string) into [first-pada, second-pada].
 * Trailing marker tokens (|, ||, digits) attach to the SECOND pada.
 * Content words are split at the gap nearest the syllable midpoint.
 * Original whitespace runs are preserved: we operate on the raw string,
 * splitting at an existing whitespace gap so re-join with that gap is lossless.
 */
function splitLine(line) {
  // Tokenize preserving the gap text between tokens.
  // We split on runs of whitespace, remembering each gap.
  const parts = [];        // {word, gapAfter}
  const re = /(\S+)(\s*)/g;
  let mm;
  while ((mm = re.exec(line)) !== null) {
    parts.push({ word: mm[1], gap: mm[2] });
  }
  // Identify content words (non-marker) with their index in parts.
  const contentIdx = [];
  let totalSyl = 0;
  const sylCount = parts.map(p => {
    if (isMarkerTok(p.word)) return 0;
    const c = splitSyllables(p.word).length;
    return c;
  });
  parts.forEach((p, idx) => { if (!isMarkerTok(p.word)) { contentIdx.push(idx); totalSyl += sylCount[idx]; } });

  if (contentIdx.length < 2) {
    // Not splittable into 2 content padas; return whole line as first pada, empty second.
    return null;
  }

  // Walk content words; pick split BEFORE the content word at which cumulative
  // syllables first reach/exceed half. Choose boundary minimizing |cum - half|.
  const half = totalSyl / 2;
  let cum = 0;
  let bestBoundary = contentIdx[1]; // at least one word on each side
  let bestDiff = Infinity;
  for (let k = 0; k < contentIdx.length - 1; k++) {
    cum += sylCount[contentIdx[k]];
    const diff = Math.abs(cum - half);
    const boundaryPartIdx = contentIdx[k + 1]; // split occurs before this content word
    if (diff < bestDiff) { bestDiff = diff; bestBoundary = boundaryPartIdx; }
  }

  // Build first pada = parts[0 .. bestBoundary-1], second = parts[bestBoundary .. end]
  // Reconstruct strings using original words + gaps; trim outer whitespace per pada.
  function build(from, to) {
    let s = '';
    for (let i = from; i < to; i++) {
      s += parts[i].word;
      if (i < to - 1) s += parts[i].gap; // internal gap preserved
    }
    return s;
  }
  const firstPada = build(0, bestBoundary);
  const secondPada = build(bestBoundary, parts.length);
  return [firstPada, secondPada];
}

function main() {
  const raw = fs.readFileSync(FILE, 'utf8');
  const data = JSON.parse(raw);
  const REPEAT_SLOKAS = new Set(['3', '4']);
  const report = [];

  data.shloka.forEach((sh, idx) => {
    // Only process regular 2-entry slokas (skip headers/closing single-entry ones)
    if (sh.entry.length !== 2) {
      report.push({ idx, num: sh.shlokaNum, action: 'skipped', entries: sh.entry.length });
      return;
    }
    const [E0, E1] = sh.entry;
    const origJoin = (E0.text + ' ' + E1.text).replace(/\s+/g, ' ').trim() +
                     '||IAST||' + (E0.iast + ' ' + E1.iast).replace(/\s+/g, ' ').trim();

    const t0 = splitLine(E0.text);
    const i0 = splitLine(E0.iast);
    const t1 = splitLine(E1.text);
    const i1 = splitLine(E1.iast);

    if (!t0 || !i0 || !t1 || !i1) {
      report.push({ idx, num: sh.shlokaNum, action: 'NOT_SPLITTABLE', entries: 2 });
      return;
    }

    const mk = (text, iast, swhtsp) => ({
      text, iast, swhtsp, shlNbr: E0.shlNbr || '00', sty: E0.sty || ''
    });

    // 4-line anuṣṭubh swhtsp convention from chapter_02: p, l, p, ""
    const newEntries = [
      mk(t0[0], i0[0], 'p'),
      mk(t0[1], i0[1], 'l'),
      mk(t1[0], i1[0], 'p'),
      mk(t1[1], i1[1], ''),
    ];

    // Verify no word loss
    const newJoin = newEntries.map(e => e.text).join(' ').replace(/\s+/g, ' ').trim() +
                    '||IAST||' +
                    newEntries.map(e => e.iast).join(' ').replace(/\s+/g, ' ').trim();
    const ok = newJoin === origJoin;

    sh.entry = newEntries;
    if (REPEAT_SLOKAS.has(String(sh.shlokaNum))) sh.repeat = 2;

    report.push({
      idx, num: sh.shlokaNum, action: 'split', entries: 4,
      repeat: sh.repeat || null, noWordLoss: ok,
      lines: newEntries.map(e => e.iast)
    });
  });

  // Write back minified (match original single-line format)
  fs.writeFileSync(FILE, JSON.stringify(data));

  console.log(JSON.stringify(report, null, 2));
  const fails = report.filter(r => r.action === 'split' && !r.noWordLoss);
  console.log('\n=== SUMMARY ===');
  console.log('split:', report.filter(r => r.action === 'split').length,
              'skipped:', report.filter(r => r.action === 'skipped').length,
              'not-splittable:', report.filter(r => r.action === 'NOT_SPLITTABLE').length);
  console.log('word-loss failures:', fails.length);
  if (fails.length) { console.error('WORD LOSS DETECTED:', fails.map(f => f.num)); process.exit(1); }
}

main();
