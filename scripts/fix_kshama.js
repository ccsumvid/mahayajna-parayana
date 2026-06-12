#!/usr/bin/env node
// Task 11: restructure data/kshama_prarthana.json (Samarpana + Kshama Prarthana)
// Feedback #28-31. Loads the minified JSON, mutates, writes back minified.
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'kshama_prarthana.json');

const obj = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// #29: remove "kṣamā prārthanā" line (entry[0]) from shloka 2
const s2 = obj.shloka.find(s => String(s.shlokaNum) === '2');
s2.entry = s2.entry.filter(e => e.iast !== 'kṣamā prārthanā' && e.text !== 'kṣamā prārthanā');

// #30: shloka 4 — strip trailing " (x 3)" marker and add repeat:3
const s4 = obj.shloka.find(s => String(s.shlokaNum) === '4');
s4.entry.forEach(e => {
  e.text = e.text.replace(/\s*\(x\s*3\)\s*$/, '');
  e.iast = e.iast.replace(/\s*\(x\s*3\)\s*$/, '');
});
s4.repeat = 3;

// #31: remove shloka 5 (pūrṇam mantra) entirely
obj.shloka = obj.shloka.filter(s => String(s.shlokaNum) !== '5');

// Naming: rename section to "samarpaṇa"
obj.name = 'samarpaṇa';
obj.iastName = 'samarpaṇa';

fs.writeFileSync(FILE, JSON.stringify(obj));

// Verify shape
const re = JSON.parse(fs.readFileSync(FILE, 'utf8'));
console.log('name/iastName:', re.name, '/', re.iastName);
console.log('shlokas:', re.shloka.map(s => ({ num: s.shlokaNum, entries: s.entry.length, repeat: s.repeat })));
