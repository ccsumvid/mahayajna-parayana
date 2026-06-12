#!/usr/bin/env node
// Data invariants for parayana chapters. Run: node scripts/check_data.js
const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'data');
let failures = 0;
function check(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); failures++; } }

// kshama shloka 4 must repeat 3x with the literal "(x 3)" marker stripped (Task 11)
const k = JSON.parse(fs.readFileSync(path.join(DATA, 'kshama_prarthana.json'), 'utf8'));
const s4 = k.shloka.find(s => String(s.shlokaNum) === '4');
check(s4 && s4.repeat === 3, 'kshama shloka 4 must have repeat:3');
check(s4 && !/\(x\s*3\)/.test(JSON.stringify(s4.entry)), 'kshama shloka 4 still has literal (x 3) marker');

if (failures) { console.error(failures + ' check(s) failed'); process.exit(1); }
console.log('OK — all data checks passed');
