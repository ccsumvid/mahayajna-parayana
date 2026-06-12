#!/usr/bin/env node
// Data invariants for parayana chapters. Run: node scripts/check_data.js
const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'data');
let failures = 0;
function check(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); failures++; } }

// Load + parse a data file, isolating I/O/parse errors into a clean failure
// so one bad file doesn't short-circuit the rest of the checks.
function load(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  } catch (err) {
    check(false, 'could not load ' + file + ': ' + err.message);
    return null;
  }
}

// kshama shloka 4 must repeat 3x with the literal "(x 3)" marker stripped (Task 11)
const k = load('kshama_prarthana.json');
if (k) {
  const s4 = k.shloka.find(s => String(s.shlokaNum) === '4');
  check(s4 && s4.repeat === 3, 'kshama shloka 4 must have repeat:3');
  check(s4 && !/\(x\s*3\)/.test(JSON.stringify(s4.entry)), 'kshama shloka 4 still has literal (x 3) marker');
}

if (failures) { console.error(failures + ' check(s) failed'); process.exit(1); }
console.log('OK — all data checks passed');
