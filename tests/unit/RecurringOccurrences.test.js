import StateManager from '../../src/core/StateManager.js';
import { MonthViewRenderer } from '../../src/renderers/MonthViewRenderer.js';
import { WeekViewRenderer } from '../../src/renderers/WeekViewRenderer.js';
import { Event as CoreEvent } from '@forcecalendar/core';

const pointer = (type, x, y) =>
  new MouseEvent(type, { bubbles: true, composed: true, clientX: x, clientY: y, button: 0 });

const mockRects = (els, rectFor) => {
  els.forEach((el, i) => {
    el.getBoundingClientRect = () => rectFor(el, i);
  });
};

// Weekly series starting Wed 1 Jul 2026 10:00-11:00: 1, 8, 15, 22, 29 July
const series = () => ({
  id: 'standup',
  title: 'Standup',
  start: new Date(2026, 6, 1, 10, 0),
  end: new Date(2026, 6, 1, 11, 0),
  recurrenceRule: 'FREQ=WEEKLY;COUNT=5'
});
const occurrenceId = day => CoreEvent.occurrenceId('standup', new Date(2026, 6, day, 10, 0));

describe('StateManager occurrence resolution', () => {
  let manager;

  beforeEach(() => {
    manager = new StateManager({ view: 'month', date: new Date(2026, 6, 15, 12) });
    manager.addEvent(series());
  });

  afterEach(() => manager.destroy());

  test('findEvent() resolves occurrence ids to the master, with a state fallback', () => {
    const master = manager.getEvents()[0];
    expect(manager.findEvent('standup')).toBe(master);
    expect(manager.findEvent(occurrenceId(15))).toBe(master);
    expect(manager.findEvent('missing')).toBeNull();
    expect(manager.findEvent('missing_123')).toBeNull();

    manager.calendar.getEvent = undefined;
    expect(manager.findEvent(occurrenceId(22))).toBe(master);
    expect(manager.findEvent('standup')).toBe(master);
  });

  test('resolveEventInstance() reports the occurrence times with the master', () => {
    const master = manager.getEvents()[0];
    const instance = manager.resolveEventInstance(occurrenceId(15));
    expect(instance.event).toBe(master);
    expect(instance.start).toEqual(new Date(2026, 6, 15, 10, 0));
    expect(instance.end).toEqual(new Date(2026, 6, 15, 11, 0));

    const own = manager.resolveEventInstance('standup');
    expect(own.start).toEqual(new Date(2026, 6, 1, 10, 0));
    expect(manager.resolveEventInstance('missing')).toBeNull();
  });

  test('selectEventById() selects the master for an occurrence id', () => {
    const selected = [];
    manager.eventBus.on('event:selected', data => selected.push(data.event));
    manager.selectEventById(occurrenceId(8));
    expect(selected).toEqual([manager.getEvents()[0]]);
    expect(manager.getState().selectedEvent).toBe(manager.getEvents()[0]);
  });
});

describe('Clicking a recurring occurrence chip', () => {
  let manager, container, renderer;

  beforeEach(() => {
    manager = new StateManager({ view: 'month', date: new Date(2026, 6, 15, 12) });
    manager.addEvent(series());
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new MonthViewRenderer(container, manager);
    renderer.render();
  });

  afterEach(() => {
    renderer.cleanup();
    container.remove();
    manager.destroy();
  });

  test('selects and emits the master event', () => {
    const chips = container.querySelectorAll('.fc-event[data-event-id^="standup_"]');
    expect(chips).toHaveLength(5);
    const selected = [];
    manager.eventBus.on('event:selected', data => selected.push(data.event));

    chips[2].click();

    const master = manager.getEvents()[0];
    expect(chips[2].dataset.eventId).toBe(occurrenceId(15));
    expect(selected).toEqual([master]);
    expect(manager.getState().selectedEvent).toBe(master);
    expect(master.isOccurrence).toBeFalsy();
  });
});

describe('Dragging a recurring occurrence', () => {
  let manager, container, renderer;

  afterEach(() => {
    renderer.cleanup();
    container.remove();
    manager.destroy();
  });

  test('in the month view shifts the series by the dragged delta via a resolvable id', () => {
    manager = new StateManager({ view: 'month', date: new Date(2026, 6, 15, 12) });
    manager.addEvent(series());
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new MonthViewRenderer(container, manager);
    renderer.render();
    const cells = Array.from(container.querySelectorAll('.fc-month-day'));
    mockRects(cells, (el, i) => {
      const col = i % 7;
      const row = Math.floor(i / 7);
      return { left: col * 100, right: col * 100 + 100, top: row * 80, bottom: row * 80 + 80 };
    });
    const updateSpy = jest.spyOn(manager, 'updateEvent');

    const chip = container.querySelector(`.fc-event[data-event-id="${occurrenceId(15)}"]`);
    const originIdx = cells.indexOf(chip.closest('.fc-month-day'));
    const targetIdx = originIdx + 2;
    const x = (targetIdx % 7) * 100 + 50;
    const y = Math.floor(targetIdx / 7) * 80 + 40;

    expect(() => {
      chip.dispatchEvent(pointer('pointerdown', 10, 10));
      document.dispatchEvent(pointer('pointermove', x, y));
      document.dispatchEvent(pointer('pointerup', x, y));
    }).not.toThrow();

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const [calledId] = updateSpy.mock.calls[0];
    expect(manager.findEvent(calledId)).toBe(manager.getEvents()[0]);
    const master = manager.getEvents()[0];
    expect(master.id).toBe('standup');
    expect(master.recurring).toBe(true);
    expect(new Date(master.start)).toEqual(new Date(2026, 6, 3, 10, 0));
    expect(new Date(master.end)).toEqual(new Date(2026, 6, 3, 11, 0));
    expect(container.querySelectorAll('.fc-event[data-event-id^="standup_"]')).toHaveLength(5);
  });

  const mountWeek = () => {
    manager = new StateManager({ view: 'week', date: new Date(2026, 6, 15, 12) });
    manager.addEvent(series());
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new WeekViewRenderer(container, manager);
    renderer.render();
    mockRects(Array.from(container.querySelectorAll('.fc-week-day-column')), (el, i) => ({
      left: i * 120,
      right: i * 120 + 120,
      top: 0,
      bottom: 1440
    }));
    return jest.spyOn(manager, 'updateEvent');
  };
  const chipSelector = `.fc-timed-event[data-event-id="${occurrenceId(15)}"]`;

  test('in the time grid moves the series by the snapped delta', () => {
    const updateSpy = mountWeek();
    const chip = container.querySelector(chipSelector);
    expect(chip).not.toBeNull();
    const startX = chip.closest('.fc-week-day-column').getBoundingClientRect().left + 10;

    expect(() => {
      chip.dispatchEvent(pointer('pointerdown', startX, 600));
      document.dispatchEvent(pointer('pointermove', startX, 600 + 34)); // ~30 min snap
      document.dispatchEvent(pointer('pointerup', startX, 600 + 34));
    }).not.toThrow();

    const master = manager.getEvents()[0];
    expect(new Date(master.start)).toEqual(new Date(2026, 6, 1, 10, 30));
    expect(new Date(master.end)).toEqual(new Date(2026, 6, 1, 11, 30));
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(manager.findEvent(updateSpy.mock.calls[0][0])).toBe(master);
  });

  test('in the time grid resizing changes the duration of the series', () => {
    const updateSpy = mountWeek();
    const handle = container.querySelector(`${chipSelector} .fc-resize-handle`);
    expect(handle).not.toBeNull();

    expect(() => {
      handle.dispatchEvent(pointer('pointerdown', 10, 660));
      document.dispatchEvent(pointer('pointermove', 10, 660 + 29)); // ~30 min snap
      document.dispatchEvent(pointer('pointerup', 10, 660 + 29));
    }).not.toThrow();

    const master = manager.getEvents()[0];
    expect(new Date(master.start)).toEqual(new Date(2026, 6, 1, 10, 0));
    expect(new Date(master.end)).toEqual(new Date(2026, 6, 1, 11, 30));
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(manager.findEvent(updateSpy.mock.calls[0][0])).toBe(master);
  });
});
