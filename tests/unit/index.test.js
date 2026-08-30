import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkgPath = resolve(__dirname, '../../package.json');

// Minimal matcher for the glob subset used in package.json "sideEffects"
// ("./dist/*.js"): "*" matches within a single path segment.
function matchesPattern(file, pattern) {
  const normalize = p => p.replace(/^\.\//, '');
  const source = normalize(pattern)
    .split('*')
    .map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${source}$`).test(normalize(file));
}

describe('package entry point', () => {
  test('exposes both custom element classes', async () => {
    const mod = await import('../../src/index.js');

    expect(typeof mod.ForceCalendar).toBe('function');
    expect(typeof mod.EventForm).toBe('function');
    expect(customElements.get('forcecal-main')).toBe(mod.ForceCalendar);
    expect(customElements.get('forcecal-event-form')).toBe(mod.EventForm);
  });

  test('sideEffects covers every file consumers resolve the package to', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const entries = [
      pkg.main,
      pkg.module,
      pkg.exports['.'].import,
      pkg.exports['.'].require,
      'src/index.js',
      'src/components/ForceCalendar.js',
      'src/components/EventForm.js'
    ];

    expect(Array.isArray(pkg.sideEffects)).toBe(true);
    for (const entry of entries) {
      const covered = pkg.sideEffects.some(pattern => matchesPattern(entry, pattern));
      expect({ entry, covered }).toEqual({ entry, covered: true });
    }
  });
});
