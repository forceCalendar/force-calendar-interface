import StateManager from '../../src/core/StateManager.js';
import '../../src/components/ForceCalendar.js';

const at = (day, hour) => new Date(2026, 2, day, hour, 0, 0, 0).toISOString();

const makeEvent = (n, overrides = {}) => ({
  id: `evt-${n}`,
  title: `Event ${n}`,
  start: at(1 + (n % 20), 9),
  end: at(1 + (n % 20), 10),
  ...overrides
});

const snapshot = (count, overrides = {}) =>
  Array.from({ length: count }, (_, i) => makeEvent(i + 1, overrides));

const tick = () => new Promise(resolve => setTimeout(resolve, 20));

const PER_EVENT_DOM_EVENTS = [
  'calendar-event-add',
  'calendar-event-added',
  'calendar-event-update',
  'calendar-event-updated',
  'calendar-event-remove',
  'calendar-event-deleted'
];

describe('ForceCalendar events property and setEvents()', () => {
  let el;

  const mount = async () => {
    el = document.createElement('forcecal-main');
    el.setAttribute('view', 'month');
    el.setAttribute('date', '2026-03-15T12:00:00');
    document.body.appendChild(el);
    await tick();
    return el;
  };

  afterEach(() => {
    if (el) el.remove();
    el = null;
  });

  test('assigning events renders the view exactly once for an N-event snapshot', async () => {
    await mount();
    const renderSpy = jest.spyOn(el._currentViewInstance, 'render');

    el.events = snapshot(25);

    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(el.getEvents()).toHaveLength(25);
    expect(el.events).toHaveLength(25);
    expect(el.events.map(e => e.id)).toEqual(snapshot(25).map(e => e.id));
  });

  test('a snapshot with no differences does not re-render', async () => {
    await mount();
    el.events = snapshot(5);
    const renderSpy = jest.spyOn(el._currentViewInstance, 'render');

    const result = el.setEvents(snapshot(5));

    expect(renderSpy).not.toHaveBeenCalled();
    expect(result.unchanged).toHaveLength(5);
    expect(result.added).toEqual([]);
    expect(result.updated).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  test('unchanged events keep their instance, changed ones are replaced', async () => {
    await mount();
    el.events = snapshot(3);
    const before = el.getEvents();
    const keep = before.find(e => e.id === 'evt-1');
    const change = before.find(e => e.id === 'evt-2');

    const result = el.setEvents([
      makeEvent(1),
      makeEvent(2, { title: 'Renamed' }),
      makeEvent(3),
      makeEvent(4)
    ]);

    const after = el.getEvents();
    expect(after.find(e => e.id === 'evt-1')).toBe(keep);
    expect(after.find(e => e.id === 'evt-2')).not.toBe(change);
    expect(after.find(e => e.id === 'evt-2').title).toBe('Renamed');
    expect(result.unchanged.map(e => e.id).sort()).toEqual(['evt-1', 'evt-3']);
    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].oldEvent).toBe(change);
    expect(result.updated[0].event.title).toBe('Renamed');
    expect(result.added.map(e => e.id)).toEqual(['evt-4']);
    expect(result.removed).toEqual([]);
  });

  test('emits one calendar-events-set per snapshot with the change set', async () => {
    await mount();
    const received = [];
    el.addEventListener('calendar-events-set', e => received.push(e.detail));

    el.events = snapshot(3);
    expect(received).toHaveLength(1);
    expect(received[0].added).toHaveLength(3);
    expect(received[0].updated).toEqual([]);
    expect(received[0].removed).toEqual([]);
    expect(received[0].unchanged).toEqual([]);
    expect(received[0].events).toHaveLength(3);

    // Drop evt-1, change evt-2, keep evt-3, add evt-9
    el.events = [makeEvent(2, { title: 'Changed' }), makeEvent(3), makeEvent(9)];
    expect(received).toHaveLength(2);
    const detail = received[1];
    expect(detail.added.map(e => e.id)).toEqual(['evt-9']);
    expect(detail.updated.map(u => u.event.id)).toEqual(['evt-2']);
    expect(detail.removed.map(e => e.id)).toEqual(['evt-1']);
    expect(detail.unchanged.map(e => e.id)).toEqual(['evt-3']);
    expect(detail.events.map(e => e.id).sort()).toEqual(['evt-2', 'evt-3', 'evt-9']);
  });

  test('snapshot loads do not dispatch per-event add/update/remove events', async () => {
    await mount();
    const perEvent = [];
    PER_EVENT_DOM_EVENTS.forEach(name => {
      el.addEventListener(name, () => perEvent.push(name));
    });

    el.events = snapshot(4);
    el.events = [makeEvent(1, { title: 'Changed' }), makeEvent(7)];

    expect(perEvent).toEqual([]);
  });

  test('removeMissing: false keeps events absent from the snapshot', async () => {
    await mount();
    el.setEvents([makeEvent(1), makeEvent(2)]);

    const result = el.setEvents([makeEvent(3)], { removeMissing: false });

    expect(result.removed).toEqual([]);
    expect(result.added.map(e => e.id)).toEqual(['evt-3']);
    expect(
      el
        .getEvents()
        .map(e => e.id)
        .sort()
    ).toEqual(['evt-1', 'evt-2', 'evt-3']);
  });

  test('assigning an empty snapshot clears the calendar', async () => {
    await mount();
    el.events = snapshot(2);

    el.events = [];

    expect(el.getEvents()).toEqual([]);
    el.events = null;
    expect(el.getEvents()).toEqual([]);
  });

  test('a rejected snapshot throws and leaves the events untouched', async () => {
    await mount();
    el.events = snapshot(2);
    const errors = [];
    el.stateManager.eventBus.on('event:error', data => errors.push(data));

    expect(() => el.setEvents([makeEvent(5), makeEvent(5)])).toThrow(/Duplicate event id/);

    expect(errors).toHaveLength(1);
    expect(errors[0].action).toBe('set');
    expect(
      el
        .getEvents()
        .map(e => e.id)
        .sort()
    ).toEqual(['evt-1', 'evt-2']);
  });

  test('a property assigned before upgrade is applied on initialisation', async () => {
    el = document.createElement('forcecal-main');
    el.setAttribute('date', '2026-03-15T12:00:00');
    // Mimic a framework assigning the prop before the element was upgraded:
    // the value lands as an own data property that shadows the accessor.
    Object.defineProperty(el, 'events', {
      value: snapshot(6),
      writable: true,
      configurable: true,
      enumerable: true
    });

    document.body.appendChild(el);
    await tick();

    expect(Object.prototype.hasOwnProperty.call(el, 'events')).toBe(false);
    expect(el.getEvents()).toHaveLength(6);
    expect(el.events).toHaveLength(6);
    expect(el.shadowRoot.querySelectorAll('.fc-event').length).toBeGreaterThan(0);
  });

  test('a snapshot set before connection is applied once connected', async () => {
    el = document.createElement('forcecal-main');
    el.setAttribute('date', '2026-03-15T12:00:00');

    expect(el.setEvents(snapshot(3))).toBeNull();
    expect(el.events).toHaveLength(3);

    document.body.appendChild(el);
    await tick();

    expect(el.getEvents().map(e => e.id)).toEqual(['evt-1', 'evt-2', 'evt-3']);
  });
});

describe('StateManager.setEvents() fallback for cores without reconcileEvents', () => {
  let manager;
  let busEvents;

  beforeEach(() => {
    manager = new StateManager({ view: 'month', date: new Date(2026, 2, 15) });
    // Shadow the core method so feature detection takes the fallback path
    manager.calendar.reconcileEvents = undefined;
    expect(typeof manager.calendar.reconcileEvents).not.toBe('function');

    busEvents = [];
    [
      'event:add',
      'event:added',
      'event:update',
      'event:updated',
      'event:remove',
      'event:deleted'
    ].forEach(name => manager.eventBus.on(name, () => busEvents.push(name)));
  });

  afterEach(() => {
    manager.destroy();
  });

  test('loads a snapshot with one state update and one events:set', () => {
    const notifications = [];
    manager.subscribe(state => notifications.push(state.events.length));
    const sets = [];
    manager.eventBus.on('events:set', data => sets.push(data));

    const result = manager.setEvents(snapshot(4));

    expect(result.added).toHaveLength(4);
    expect(manager.getState().events).toHaveLength(4);
    expect(notifications).toEqual([4]);
    expect(sets).toHaveLength(1);
    expect(busEvents).toEqual([]);
  });

  test('diffs against the existing events without per-event bus events', () => {
    manager.setEvents(snapshot(3));
    const before = manager.getEvents();
    const kept = before.find(e => e.id === 'evt-1');
    busEvents.length = 0;

    const result = manager.setEvents([
      makeEvent(1),
      makeEvent(2, { title: 'Changed' }),
      makeEvent(5)
    ]);

    expect(result.unchanged).toEqual([kept]);
    expect(manager.getEvents().find(e => e.id === 'evt-1')).toBe(kept);
    expect(result.updated.map(u => u.event.id)).toEqual(['evt-2']);
    expect(result.updated[0].event.title).toBe('Changed');
    expect(result.added.map(e => e.id)).toEqual(['evt-5']);
    expect(result.removed.map(e => e.id)).toEqual(['evt-3']);
    expect(
      manager
        .getState()
        .events.map(e => e.id)
        .sort()
    ).toEqual(['evt-1', 'evt-2', 'evt-5']);
    expect(busEvents).toEqual([]);
  });

  test('honours removeMissing: false and rejects duplicate ids', () => {
    manager.setEvents(snapshot(2));

    const result = manager.setEvents([makeEvent(3)], { removeMissing: false });
    expect(result.removed).toEqual([]);
    expect(manager.getEvents()).toHaveLength(3);

    expect(() => manager.setEvents([makeEvent(4), makeEvent(4)])).toThrow(/Duplicate event id/);
    expect(manager.getEvents()).toHaveLength(3);
  });
});

describe('ForceCalendar setEvents() input handling', () => {
  let el;
  const local = (d, h) => new Date(2026, 2, d, h, 0, 0, 0);
  const series = (overrides = {}) => ({
    id: 'standup',
    title: 'Standup',
    start: local(3, 9),
    end: local(3, 10),
    recurrenceRule: 'FREQ=WEEKLY;COUNT=3',
    ...overrides
  });
  const shownEvents = () =>
    el.stateManager.getViewData().weeks.flatMap(week => week.days.flatMap(day => day.events));

  const mount = async () => {
    el = document.createElement('forcecal-main');
    el.setAttribute('view', 'month');
    el.setAttribute('date', '2026-03-15T12:00:00');
    document.body.appendChild(el);
    await tick();
    return el;
  };

  afterEach(() => {
    if (el) el.remove();
    el = null;
  });

  test('echoing view-data occurrences through setEvents leaves the master intact', async () => {
    await mount();
    el.events = [makeEvent(1), series()];
    const master = el.getEvents().find(e => e.id === 'standup');
    const shown = shownEvents();
    const occurrences = shown.filter(e => e.isOccurrence);
    expect(occurrences).toHaveLength(3);

    const result = el.setEvents(shown);

    expect(result.added).toEqual([]);
    expect(result.updated).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.unchanged).toHaveLength(2);
    expect(
      el
        .getEvents()
        .map(e => e.id)
        .sort()
    ).toEqual(['evt-1', 'standup']);
    expect(el.getEvents().find(e => e.id === 'standup')).toBe(master);
    expect(shownEvents().filter(e => e.isOccurrence)).toHaveLength(3);
  });

  test('serialised occurrences (toObject / JSON) resolve to the master as well', async () => {
    await mount();
    el.events = [series()];
    const rows = JSON.parse(JSON.stringify(shownEvents().map(e => e.toObject())));
    expect(rows.every(row => row.id.startsWith('standup_'))).toBe(true);

    const result = el.setEvents(rows);

    expect(result.unchanged).toHaveLength(1);
    expect(el.getEvents().map(e => e.id)).toEqual(['standup']);
    expect(el.getEvents()[0].recurring).toBe(true);
  });

  test('an explicit master entry wins over its occurrences and can update the series', async () => {
    await mount();
    el.events = [series()];
    const occurrences = shownEvents();

    const result = el.setEvents([...occurrences, series({ title: 'Renamed' })]);

    expect(result.updated).toHaveLength(1);
    expect(el.getEvents().map(e => e.id)).toEqual(['standup']);
    expect(el.getEvents()[0].title).toBe('Renamed');
  });

  test('an occurrence of a series the calendar does not hold is rejected', async () => {
    await mount();
    el.events = [series()];
    const occurrence = shownEvents()[0];
    el.events = [];

    expect(() => el.setEvents([occurrence])).toThrow(/occurrence of recurring event "standup"/);
    expect(el.getEvents()).toEqual([]);
  });

  test('rejects non-iterable snapshots and non-object entries, clears on null', async () => {
    await mount();
    el.events = snapshot(2);

    expect(() => el.setEvents({})).toThrow(TypeError);
    expect(() => el.setEvents(42)).toThrow(TypeError);
    expect(() => el.setEvents('abc')).toThrow(TypeError);
    expect(() => el.setEvents([null])).toThrow(TypeError);
    expect(() => el.setEvents([makeEvent(1), 'x'])).toThrow(TypeError);
    expect(el.getEvents()).toHaveLength(2);

    expect(el.setEvents(new Set(snapshot(3))).events).toHaveLength(3);
    el.events = null;
    expect(el.getEvents()).toEqual([]);
    el.events = snapshot(1);
    el.events = undefined;
    expect(el.getEvents()).toEqual([]);
  });
});

describe('StateManager.setEvents() fallback atomicity', () => {
  let manager;

  beforeEach(() => {
    manager = new StateManager({ view: 'month', date: new Date(2026, 2, 15) });
    manager.calendar.reconcileEvents = undefined;
    manager.setEvents([makeEvent(1), makeEvent(2)]);
  });

  afterEach(() => {
    manager.destroy();
  });

  test('validates every entry before touching the store', () => {
    const notifications = [];
    manager.subscribe(() => notifications.push('state'));
    const errors = [];
    manager.eventBus.on('event:error', data => errors.push(data.action));

    expect(() => manager.setEvents([makeEvent(3), { id: 'evt-4', start: 'nope' }])).toThrow();

    expect(manager.getEvents().map(e => e.id)).toEqual(['evt-1', 'evt-2']);
    expect(manager.state.events.map(e => e.id)).toEqual(['evt-1', 'evt-2']);
    expect(notifications).toEqual([]);
    expect(errors).toEqual(['set']);
  });

  test('resyncs state from core when a mutation fails part-way', () => {
    manager.calendar.updateEvent = () => null;

    expect(() => manager.setEvents([makeEvent(3), makeEvent(1, { title: 'Changed' })])).toThrow(
      /Failed to update event: evt-1/
    );

    const coreIds = manager.getEvents().map(e => e.id);
    expect(coreIds).toEqual(manager.state.events.map(e => e.id));
    expect(coreIds).toContain('evt-3');
    expect(coreIds).not.toContain('evt-2');
  });
});
