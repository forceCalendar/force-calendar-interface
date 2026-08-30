import '../../src/components/ForceCalendar.js';

describe('ForceCalendar attribute reactivity', () => {
  let el;

  beforeEach(async () => {
    el = document.createElement('forcecal-main');
    el.setAttribute('view', 'month');
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 20));
  });

  afterEach(() => {
    el.remove();
  });

  test('initializes with the view attribute', () => {
    expect(el.stateManager.getView()).toBe('month');
  });

  test('changing the view attribute switches the calendar view', () => {
    el.setAttribute('view', 'week');
    expect(el.stateManager.getView()).toBe('week');
    el.setAttribute('view', 'day');
    expect(el.stateManager.getView()).toBe('day');
  });

  test('changing the date attribute navigates the calendar', () => {
    el.setAttribute('date', '2026-03-15');
    const current = el.stateManager.getCurrentDate();
    expect(current.getFullYear()).toBe(2026);
    expect(current.getMonth()).toBe(2);
  });

  test('changing locale and week-starts-on updates calendar config', () => {
    el.setAttribute('locale', 'de-DE');
    el.setAttribute('week-starts-on', '1');
    const state = el.stateManager.getState();
    expect(state.config.locale).toBe('de-DE');
    expect(state.config.weekStartsOn).toBe(1);
  });

  test('changing the timezone attribute updates the calendar timezone', () => {
    el.setAttribute('timezone', 'Asia/Tokyo');
    expect(el.stateManager.calendar.getTimezone()).toBe('Asia/Tokyo');
  });

  test('events survive a view switch', () => {
    el.addEvent({
      id: 'e1',
      title: 'Persistent',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString()
    });
    el.setAttribute('view', 'week');
    expect(el.getEvents()).toHaveLength(1);
  });
});

describe('Theme presets', () => {
  test('theme="slds" applies and clears host-level tokens', async () => {
    const el = document.createElement('forcecal-main');
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 0));

    el.setAttribute('theme', 'slds');
    await new Promise(r => setTimeout(r, 0));
    expect(el.style.getPropertyValue('--fc-primary-color')).toBe('#0176d3');
    expect(el.style.getPropertyValue('--fc-background-alt')).toBe('#f3f3f3');

    el.removeAttribute('theme');
    await new Promise(r => setTimeout(r, 0));
    expect(el.style.getPropertyValue('--fc-primary-color')).toBe('');
    el.remove();
  });
});

describe('ForceCalendar detach and re-attach', () => {
  const flush = () => new Promise(r => setTimeout(r, 0));
  let el;

  beforeEach(async () => {
    el = document.createElement('forcecal-main');
    el.setAttribute('view', 'month');
    document.body.appendChild(el);
    await flush();
  });

  afterEach(() => {
    el.remove();
  });

  test('moving the element to another container keeps state, events and DOM working', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    el.setAttribute('view', 'week');
    el.addEvent({
      id: 'keep-me',
      title: 'Survivor',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString()
    });

    expect(() => target.appendChild(el)).not.toThrow();
    await flush();

    expect(el.parentNode).toBe(target);
    expect(el.stateManager.state).not.toBeNull();
    expect(el.stateManager.calendar).not.toBeNull();
    expect(el.stateManager.getView()).toBe('week');
    expect(el.getEvents()).toHaveLength(1);
    expect(el.shadowRoot.querySelector('#calendar-view-container').children.length).toBeGreaterThan(
      0
    );
    expect(el.shadowRoot.querySelectorAll('#fc-root')).toHaveLength(1);
    expect(el.shadowRoot.querySelectorAll('style')).toHaveLength(1);
    target.remove();
  });

  test('public API and attribute reactivity keep working after re-attach', async () => {
    el.remove();
    document.body.appendChild(el);
    await flush();

    expect(() =>
      el.addEvent({
        id: 'after',
        title: 'After',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 3600000).toISOString()
      })
    ).not.toThrow();
    expect(el.getEvents()).toHaveLength(1);

    el.setAttribute('view', 'day');
    expect(el.stateManager.getView()).toBe('day');
    expect(
      el.shadowRoot.querySelector('.fc-view-btn.active, [data-view="day"].active')
    ).not.toBeNull();

    el.setAttribute('date', '2026-03-15');
    expect(el.stateManager.getCurrentDate().getMonth()).toBe(2);
    expect(() => el.next()).not.toThrow();
    expect(() => el.today()).not.toThrow();
  });

  test('repeated attach cycles do not multiply subscriptions, listeners or timers', async () => {
    el.setAttribute('view', 'week');
    await flush();
    const listenersAfterFirstMount = el._listeners.length;
    const setIntervalSpy = jest.spyOn(window, 'setInterval');
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

    for (let i = 0; i < 4; i++) {
      el.remove();
      document.body.appendChild(el);
    }
    await flush();

    // Each detach clears the now-indicator timer and each re-attach starts one,
    // so exactly one interval is live at the end
    expect(setIntervalSpy).toHaveBeenCalledTimes(4);
    expect(clearIntervalSpy).toHaveBeenCalledTimes(4);
    expect(el._currentViewInstance._nowIndicatorTimer).toBeTruthy();
    expect(el.stateManager.subscribers.size).toBe(1);
    expect(el.stateManager.eventBus.events.get('view:changed')).toHaveLength(1);
    expect(el._listeners.length).toBe(listenersAfterFirstMount);

    const seen = [];
    el.addEventListener('calendar-view-change', e => seen.push(e.detail));
    el.setView('day');
    expect(seen).toHaveLength(1);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  test('synchronous unmount and remount (StrictMode style) keeps a single rendered tree', async () => {
    const parent = el.parentNode;
    parent.removeChild(el);
    parent.appendChild(el);
    parent.removeChild(el);
    parent.appendChild(el);
    await flush();

    expect(el.shadowRoot.querySelectorAll('#fc-root')).toHaveLength(1);
    expect(el.shadowRoot.querySelectorAll('.fc-title')).toHaveLength(1);
    expect(el.stateManager.getView()).toBe('month');
  });

  test('explicit destroy() is still honoured and a later re-attach starts fresh', async () => {
    el.addEvent({
      id: 'gone',
      title: 'Gone',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString()
    });
    el.destroy();
    expect(el.stateManager.state).toBeNull();

    el.remove();
    expect(() => document.body.appendChild(el)).not.toThrow();
    await flush();

    expect(el.stateManager.state).not.toBeNull();
    expect(el.getEvents()).toHaveLength(0);
    expect(el.stateManager.getView()).toBe('month');
  });
});
