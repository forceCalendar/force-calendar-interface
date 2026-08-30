#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('Testing ForceCalendar Interface build...\n');

// Custom elements that `import '@forcecalendar/interface'` must register and
// the public classes every consumer relies on. If a bundler tree-shakes the
// registration away (see "sideEffects" in package.json) the library is silently
// inert, so both outputs are checked for the define() calls explicitly.
const REQUIRED_ELEMENTS = ['forcecal-main', 'forcecal-event-form'];
const REQUIRED_EXPORTS = [
  'ForceCalendar',
  'EventForm',
  'StateManager',
  'MonthViewRenderer',
  'WeekViewRenderer',
  'DayViewRenderer'
];

let failures = 0;

function check(label, ok) {
  console.log(`  - ${label}: ${ok ? '✓' : '✗'}`);
  if (!ok) failures++;
}

function read(file) {
  try {
    return readFileSync(resolve(file), 'utf8');
  } catch (error) {
    console.error(`✗ ${file} not found or unreadable`);
    process.exit(1);
  }
}

function definesElement(content, tag) {
  return new RegExp(`customElements\\.define\\(\\s*[\`'"]${tag}[\`'"]`).test(content);
}

function esmExportNames(content) {
  const statements = content.match(/export\s*\{[^}]*\}/g) || [];
  const last = statements[statements.length - 1] || '';
  return last
    .replace(/^export\s*\{|\}$/g, '')
    .split(',')
    .map(entry =>
      entry
        .trim()
        .split(/\s+as\s+/)
        .pop()
    )
    .filter(Boolean);
}

function umdExports(content, name) {
  return new RegExp(`\\.${name}\\s*=|\\[\\s*["']${name}["']\\s*\\]\\s*=`).test(content);
}

const esm = read('./dist/force-calendar-interface.esm.js');
console.log('✓ ESM build found');
const esmNames = esmExportNames(esm);
REQUIRED_EXPORTS.forEach(name => check(`exports ${name}`, esmNames.includes(name)));
REQUIRED_ELEMENTS.forEach(tag => check(`registers <${tag}>`, definesElement(esm, tag)));

const umd = read('./dist/force-calendar-interface.umd.js');
console.log('\n✓ UMD build found');
check('UMD wrapper', umd.includes('typeof exports') && umd.includes('typeof define'));
check('global name ForceCalendarInterface', umd.includes('ForceCalendarInterface'));
REQUIRED_EXPORTS.forEach(name => check(`exports ${name}`, umdExports(umd, name)));
REQUIRED_ELEMENTS.forEach(tag => check(`registers <${tag}>`, definesElement(umd, tag)));

if (failures > 0) {
  console.error(`\n✗ Build test failed: ${failures} check(s) did not pass.`);
  process.exit(1);
}

console.log('\n✅ Build test passed! Library is properly built.');
