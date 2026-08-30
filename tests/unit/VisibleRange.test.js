import StateManager from '../../src/core/StateManager.js';
import '../../src/components/ForceCalendar.js';

const local = (y, m, d, h = 0, min = 0, s = 0, ms = 0) => new Date(y, m, d, h, min, s, ms);
const startOf = (y, m, d) => local(y, m, d);
const endOf = (y, m, d) => local(y, m, d, 23, 59, 59, 999);

const tick = () => new Promise(resolve => setTimeout(resolve, 20));

describe('StateManager.getVisibleRange()', () => {
  let manager;
  let ranges;

  const create = config => {
    manager = new StateManager({ view: 'month', date: local(2026, 3, 15), ...config });
    ranges = [];
    manager.eventBus.on('range:changed', data => ranges.push(data));
    return manager;
  };

  afterEach(() => {
    manager.destroy();
  });

  // The month grid is made of whole weeks (5, or 6 when core pads to a fixed
  // week count), so assert the shape rather than a specific trailing day.
  const expectWholeWeeks = (range, weekStartsOn) => {
    const days = Math.round((range.end.getTime() - range.start.getTime() + 1) / 86400000);
    expect([35, 42]).toContain(days);
    expect(range.start.getDay()).toBe(weekStartsOn);
    expect(range.end.getDay()).toBe((weekStartsOn + 6) % 7);
    expect(range.end.getHours()).toBe(23);
    expect(range.end.getMilliseconds()).toBe(999);
  };

  test('month view includes leading and trailing other-month days', () => {
    create();
    // April 2026 starts on a Wednesday: the grid opens on Sun 29 Mar
    const range = manager.getVisibleRange();
    expect(range.start).toEqual(startOf(2026, 2, 29));
    expect(range.end.getTime()).toBeGreaterThanOrEqual(endOf(2026, 3, 30).getTime());
    expectWholeWeeks(range, 0);
  });

  test('month view honours weekStartsOn', () => {
    create({ weekStartsOn: 1 });
    const range = manager.getVisibleRange();
    expect(range.start).toEqual(startOf(2026, 2, 30));
    expect(range.end.getTime()).toBeGreaterThanOrEqual(endOf(2026, 3, 30).getTime());
    expectWholeWeeks(range, 1);
  });

  test('week view honours weekStartsOn', () => {
    create({ view: 'week', weekStartsOn: 1 });
    // Wed 15 Apr 2026 -> Mon 13 Apr .. Sun 19 Apr
    const range = manager.getVisibleRange();
    expect(range.start).toEqual(startOf(2026, 3, 13));
    expect(range.end).toEqual(endOf(2026, 3, 19));

    manager.updateConfig({ weekStartsOn: 0 });
    const sunday = manager.getVisibleRange();
    expect(sunday.start).toEqual(startOf(2026, 3, 12));
    expect(sunday.end).toEqual(endOf(2026, 3, 18));
  });

  test('day view runs from midnight to the last millisecond of the day', () => {
    create({ view: 'day' });
    const range = manager.getVisibleRange();
    expect(range.start).toEqual(startOf(2026, 3, 15));
    expect(range.end).toEqual(endOf(2026, 3, 15));
  });

  test('list view reports an inclusive 30-day window', () => {
    create({ view: 'list' });
    const range = manager.getVisibleRange();
    expect(range.start).toEqual(startOf(2026, 3, 15));
    expect(range.end).toEqual(endOf(2026, 4, 14));
  });

  test('returns fresh Date instances on every call', () => {
    create();
    const first = manager.getVisibleRange();
    first.start.setFullYear(2000);
    expect(manager.getVisibleRange().start).toEqual(startOf(2026, 2, 29));
  });

  test('next() emits range:changed exactly once, after the navigation event', () => {
    create();
    const order = [];
    manager.eventBus.on('navigation:next', () => order.push('navigation:next'));
    manager.eventBus.on('range:changed', () => order.push('range:changed'));

    manager.next();

    expect(order).toEqual(['navigation:next', 'range:changed']);
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toEqual({
      start: startOf(2026, 3, 26),
      end: endOf(2026, 5, 6),
      view: 'month',
      date: manager.getCurrentDate()
    });
  });

  test('navigating to the same date twice emits once', () => {
    create();
    manager.setDate(local(2026, 4, 10));
    manager.setDate(local(2026, 4, 10));
    expect(ranges).toHaveLength(1);

    // A different date inside the same month grid is not a range change
    manager.setDate(local(2026, 4, 20));
    expect(ranges).toHaveLength(1);
  });

  test('re-selecting the current view is silent, switching views emits after view:changed', () => {
    create();
    const order = [];
    manager.eventBus.on('view:changed', () => order.push('view:changed'));
    manager.eventBus.on('range:changed', () => order.push('range:changed'));

    manager.setView('month');
    expect(ranges).toHaveLength(0);
    order.length = 0;

    manager.setView('week');
    expect(order).toEqual(['view:changed', 'range:changed']);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].view).toBe('week');
    expect(ranges[0].start).toEqual(startOf(2026, 3, 12));
    expect(ranges[0].end).toEqual(endOf(2026, 3, 18));
  });

  test('changing weekStartsOn emits when the grid moves', () => {
    create();
    manager.updateConfig({ weekStartsOn: 1 });
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start.getDay()).toBe(1);

    manager.updateConfig({ locale: 'de-DE' });
    expect(ranges).toHaveLength(1);
  });
});

describe('ForceCalendar getVisibleRange() and calendar-range-change', () => {
  let el;
  let received;

  const mount = async (attrs = {}) => {
    el = document.createElement('forcecal-main');
    el.setAttribute('view', 'month');
    el.setAttribute('date', '2026-04-15T12:00:00');
    Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
    received = [];
    el.addEventListener('calendar-range-change', e => received.push(e.detail));
    document.body.appendChild(el);
    await tick();
    return el;
  };

  afterEach(() => {
    if (el) el.remove();
    el = null;
  });

  test('emits once at the end of the first mount with the initial window', async () => {
    await mount();
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({
      ...el.stateManager.getVisibleRange(),
      view: 'month',
      date: el.stateManager.getCurrentDate()
    });
    expect(received[0].start).toEqual(startOf(2026, 2, 29));
    expect(el.getVisibleRange()).toEqual({ start: received[0].start, end: received[0].end });
  });

  test('returns null before the element is connected', () => {
    el = document.createElement('forcecal-main');
    expect(el.getVisibleRange()).toBeNull();
  });

  test('week-starts-on attribute is reflected in the range', async () => {
    await mount({ view: 'week', 'week-starts-on': '1' });
    expect(el.getVisibleRange()).toEqual({
      start: startOf(2026, 3, 13),
      end: endOf(2026, 3, 19)
    });
  });

  test('next() dispatches calendar-navigate before calendar-range-change, once', async () => {
    await mount();
    received.length = 0;
    const order = [];
    el.addEventListener('calendar-navigate', () => order.push('navigate'));
    el.addEventListener('calendar-range-change', () => order.push('range'));

    el.next();

    expect(order).toEqual(['navigate', 'range']);
    expect(received).toHaveLength(1);
    expect(received[0].start).toEqual(startOf(2026, 3, 26));
    expect(received[0].view).toBe('month');
    // The DOM already shows the new month when the range event fires
    expect(el.shadowRoot.querySelector('.fc-title').textContent).toMatch(/May/);
  });

  test('view attribute change dispatches calendar-view-change before calendar-range-change', async () => {
    await mount();
    received.length = 0;
    const order = [];
    el.addEventListener('calendar-view-change', () => order.push('view'));
    el.addEventListener('calendar-range-change', () => order.push('range'));

    el.setAttribute('view', 'day');

    expect(order).toEqual(['view', 'range']);
    expect(received[0]).toMatchObject({
      view: 'day',
      start: startOf(2026, 3, 15),
      end: endOf(2026, 3, 15)
    });
  });

  test('setting the same date twice emits a single range change', async () => {
    await mount();
    received.length = 0;

    el.setDate(local(2026, 5, 10));
    el.setDate(local(2026, 5, 10));

    expect(received).toHaveLength(1);
  });

  test('today() is silent when today is already visible', async () => {
    el = document.createElement('forcecal-main');
    received = [];
    el.addEventListener('calendar-range-change', e => received.push(e.detail));
    document.body.appendChild(el);
    await tick();
    received.length = 0;

    el.today();

    expect(received).toHaveLength(0);
  });
});
