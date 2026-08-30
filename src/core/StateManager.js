/**
 * StateManager - Centralized state management for Force Calendar
 *
 * Wraps the @forcecalendar/core Calendar instance
 * Provides reactive state updates and component synchronization
 */

import { Calendar } from '@forcecalendar/core';
import { EventBus } from './EventBus.js';

/**
 * @typedef {import('@forcecalendar/core').Event} CalendarEvent
 */

/**
 * @typedef {Object} EventsSetOptions
 * @property {boolean} [removeMissing=true] - Remove stored events that are absent from the snapshot
 */

/**
 * @typedef {Object} EventsSetUpdate
 * @property {CalendarEvent} event - Event now held by the calendar
 * @property {CalendarEvent} oldEvent - Event instance it replaced
 */

/**
 * @typedef {Object} EventsSetResult
 * @property {CalendarEvent[]} events - All events after the snapshot was applied
 * @property {CalendarEvent[]} added - Events that were not present before
 * @property {EventsSetUpdate[]} updated - Events whose data changed
 * @property {CalendarEvent[]} removed - Events dropped because they were missing from the snapshot
 * @property {CalendarEvent[]} unchanged - Events left untouched (same instances as before)
 */

/**
 * @typedef {Object} VisibleRange
 * @property {Date} start - First instant shown by the current view
 * @property {Date} end - Last instant shown by the current view (inclusive)
 */

/**
 * @typedef {VisibleRange & { view: string, date: Date }} VisibleRangeChange
 */

class StateManager {
  constructor(config = {}) {
    // Each StateManager gets its own EventBus to prevent cross-instance
    // contamination when multiple calendars exist on the same page.
    this.eventBus = new EventBus();

    // Initialize Core Calendar instance
    this.calendar = new Calendar({
      view: config.view || 'month',
      date: config.date || new Date(),
      weekStartsOn: config.weekStartsOn ?? 0,
      locale: config.locale || 'en-US',
      timeZone: config.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...config
    });

    // Internal state
    this.state = {
      view: this.calendar.getView(),
      currentDate: this.calendar.getCurrentDate(),
      events: [],
      selectedEvent: null,
      selectedDate: null,
      loading: false,
      error: null,
      config: { ...config }
    };

    // State change subscribers
    this.subscribers = new Set();

    // Bind methods
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.setState = this.setState.bind(this);

    // Initial sync of events from Core (in case events were pre-loaded)
    this._syncEventsFromCore({ silent: true });

    // Remember the visible window so range:changed only fires on real changes
    this._visibleRangeKey = this._rangeKey(this.getVisibleRange());
  }

  /**
   * Sync state.events from Core calendar (single source of truth)
   * This ensures state.events always matches Core's event store.
   *
   * @param {object} options
   * @param {boolean} options.silent  - suppress subscriber notifications
   * @param {boolean} options.force   - always update even when IDs match
   *                                    (required after updateEvent where IDs
   *                                    are unchanged but content has changed)
   */
  _syncEventsFromCore(options = {}) {
    const { force = false } = options;
    const coreEvents = this.calendar.getEvents() || [];
    // Skip the update when nothing changed, unless the caller forces a sync
    // (e.g. after updateEvent where IDs are the same but content differs)
    if (
      force ||
      this.state.events.length !== coreEvents.length ||
      !this._eventsMatch(this.state.events, coreEvents)
    ) {
      this.setState({ events: [...coreEvents] }, options);
    }
    return coreEvents;
  }

  /**
   * Check if two event arrays have the same events by id.
   * Only used for add/delete guards — updateEvent must pass force:true
   * to bypass this check because IDs are unchanged after an update.
   */
  _eventsMatch(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const ids1 = new Set(arr1.map(e => e.id));
    return arr2.every(e => ids1.has(e.id));
  }

  // State management
  getState() {
    return {
      ...this.state,
      config: { ...this.state.config },
      events: [...this.state.events]
    };
  }

  setState(updates, options = {}) {
    const { silent = false } = options;
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    if (!silent) {
      this.notifySubscribers(oldState, this.state);
      this.emitStateChange(oldState, this.state);
    }

    return this.state;
  }

  subscribe(callback, subscriberId = null) {
    this.subscribers.add(callback);

    // Track subscriber ID for debugging/cleanup
    if (subscriberId) {
      if (!this._subscriberIds) {
        this._subscriberIds = new Map();
      }
      this._subscriberIds.set(subscriberId, callback);
    }

    return () => this.unsubscribe(callback, subscriberId);
  }

  unsubscribe(callback, subscriberId = null) {
    this.subscribers.delete(callback);

    // Clean up ID tracking
    if (subscriberId && this._subscriberIds) {
      this._subscriberIds.delete(subscriberId);
    }
  }

  /**
   * Unsubscribe by subscriber ID
   * @param {string} subscriberId - ID used when subscribing
   */
  unsubscribeById(subscriberId) {
    if (!this._subscriberIds) return false;

    const callback = this._subscriberIds.get(subscriberId);
    if (callback) {
      this.subscribers.delete(callback);
      this._subscriberIds.delete(subscriberId);
      return true;
    }
    return false;
  }

  /**
   * Get subscriber count (for debugging/monitoring)
   */
  getSubscriberCount() {
    return this.subscribers.size;
  }

  notifySubscribers(oldState, newState) {
    this.subscribers.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  emitStateChange(oldState, newState) {
    const changedKeys = Object.keys(newState).filter(key => oldState[key] !== newState[key]);

    changedKeys.forEach(key => {
      this.eventBus.emit(`state:${key}:changed`, {
        oldValue: oldState[key],
        newValue: newState[key],
        state: newState
      });
    });

    if (changedKeys.length > 0) {
      this.eventBus.emit('state:changed', { oldState, newState, changedKeys });
    }
  }

  // Calendar operations
  setView(view) {
    this.calendar.setView(view);
    this.setState({ view });
    this.eventBus.emit('view:changed', { view });
    this._syncVisibleRange();
  }

  getView() {
    return this.state.view;
  }

  setDate(date) {
    this.calendar.goToDate(date);
    this.setState({ currentDate: this.calendar.getCurrentDate() });
    this.eventBus.emit('date:changed', { date: this.state.currentDate });
    this._syncVisibleRange();
  }

  getCurrentDate() {
    return this.state.currentDate;
  }

  // Navigation
  next() {
    this.calendar.next();
    this.setState({ currentDate: this.calendar.getCurrentDate() });
    this.eventBus.emit('navigation:next', { date: this.state.currentDate });
    this._syncVisibleRange();
  }

  previous() {
    this.calendar.previous();
    this.setState({ currentDate: this.calendar.getCurrentDate() });
    this.eventBus.emit('navigation:previous', { date: this.state.currentDate });
    this._syncVisibleRange();
  }

  today() {
    this.calendar.today();
    this.setState({ currentDate: this.calendar.getCurrentDate() });
    this.eventBus.emit('navigation:today', { date: this.state.currentDate });
    this._syncVisibleRange();
  }

  goToDate(date) {
    this.calendar.goToDate(date);
    this.setState({ currentDate: this.calendar.getCurrentDate() });
    this.eventBus.emit('navigation:goto', { date: this.state.currentDate });
    this._syncVisibleRange();
  }

  // Event management
  addEvent(event) {
    const addedEvent = this.calendar.addEvent(event);
    if (!addedEvent) {
      console.error('Failed to add event to calendar');
      this.eventBus.emit('event:error', { action: 'add', event, error: 'Failed to add event' });
      return null;
    }
    // Sync from Core to ensure consistency (single source of truth)
    this._syncEventsFromCore();
    this.eventBus.emit('event:add', { event: addedEvent });
    this.eventBus.emit('event:added', { event: addedEvent });
    return addedEvent;
  }

  updateEvent(eventId, updates) {
    // First, ensure state is in sync with Core (recover from any prior desync)
    this._syncEventsFromCore({ silent: true });

    const event = this.calendar.updateEvent(eventId, updates);
    if (!event) {
      console.error(`Failed to update event: ${eventId}`);
      this.eventBus.emit('event:error', {
        action: 'update',
        eventId,
        updates,
        error: 'Event not found in calendar'
      });
      return null;
    }

    // Force sync from Core — IDs are unchanged after an update so the
    // ID-only guard in _eventsMatch would otherwise skip the state update
    this._syncEventsFromCore({ force: true });
    this.eventBus.emit('event:update', { event });
    this.eventBus.emit('event:updated', { event });
    return event;
  }

  deleteEvent(eventId) {
    // First, ensure state is in sync with Core (recover from any prior desync)
    this._syncEventsFromCore({ silent: true });

    const deleted = this.calendar.removeEvent(eventId);
    if (!deleted) {
      console.error(`Failed to delete event: ${eventId}`);
      this.eventBus.emit('event:error', { action: 'delete', eventId, error: 'Event not found' });
      return false;
    }
    // Sync from Core to ensure consistency (single source of truth)
    this._syncEventsFromCore();
    this.eventBus.emit('event:remove', { eventId });
    this.eventBus.emit('event:deleted', { eventId });
    return true;
  }

  getEvents() {
    // Return from Core (source of truth)
    return this.calendar.getEvents() || [];
  }

  /**
   * Replace the calendar's events with a complete snapshot, applying only the
   * differences.
   *
   * Unchanged events keep their existing instance, changed ones are replaced,
   * new ones are added and events missing from the snapshot are removed
   * (unless `removeMissing` is false). The state is updated at most once and a
   * single `events:set` bus event carries the change set. The per-event
   * `event:add`/`event:added`/`event:remove`/`event:deleted` events are NOT
   * emitted, so listeners that persist user edits are not triggered by a
   * snapshot load.
   *
   * Uses `Calendar#reconcileEvents` when the installed core provides it
   * (2.4.0+) and falls back to an id-based diff on older cores.
   *
   * @param {Iterable<object|CalendarEvent>} events - Complete snapshot of events
   * @param {EventsSetOptions} [options={}]
   * @returns {EventsSetResult} The applied change set
   * @throws {Error} If an entry fails validation or two entries share an id (an `event:error` bus event is emitted first)
   */
  setEvents(events, options = {}) {
    const { removeMissing = true } = options;
    const snapshot = events ? Array.from(events) : [];

    let result;
    try {
      result =
        typeof this.calendar.reconcileEvents === 'function'
          ? this.calendar.setEvents(snapshot, { reconcile: true, removeMissing })
          : this._reconcileFallback(snapshot, removeMissing);
    } catch (error) {
      // Nothing has been applied (core rolls the batch back), so surface the
      // problem to the caller instead of leaving the snapshot half-loaded
      this.eventBus.emit('event:error', { action: 'set', events: snapshot, error });
      throw error;
    }

    const { added, updated, removed, unchanged } = result;
    /** @type {EventsSetResult} */
    const payload = { events: this.getEvents(), added, updated, removed, unchanged };

    if (added.length > 0 || updated.length > 0 || removed.length > 0) {
      this.setState({ events: [...payload.events] });
    }
    this.eventBus.emit('events:set', payload);
    return payload;
  }

  /**
   * Id-based diff for cores that predate `Calendar#reconcileEvents`.
   * Works on the core calendar directly so no per-event bus events fire.
   * Equivalence is approximated by comparing the fields present in the
   * snapshot entry, so an entry that only omits fields is treated as unchanged.
   *
   * @param {Array<object|CalendarEvent>} snapshot
   * @param {boolean} removeMissing
   * @returns {{ added: CalendarEvent[], updated: EventsSetUpdate[], removed: CalendarEvent[], unchanged: CalendarEvent[] }}
   * @private
   */
  _reconcileFallback(snapshot, removeMissing) {
    const incoming = new Map();
    snapshot.forEach(entry => {
      const id = entry && entry.id;
      if (id === undefined || id === null || id === '') {
        throw new Error('Every event in a snapshot must have an id');
      }
      if (incoming.has(id)) {
        throw new Error(`Duplicate event id in snapshot: ${id}`);
      }
      incoming.set(id, entry);
    });

    const result = { added: [], updated: [], removed: [], unchanged: [] };
    const existingById = new Map(this.getEvents().map(event => [event.id, event]));

    if (removeMissing) {
      existingById.forEach((existing, id) => {
        if (!incoming.has(id) && this.calendar.removeEvent(id)) {
          result.removed.push(existing);
        }
      });
    }

    incoming.forEach((entry, id) => {
      const existing = existingById.get(id);
      const data = typeof entry.toObject === 'function' ? entry.toObject() : entry;
      if (!existing) {
        const event = this.calendar.addEvent(entry);
        if (!event) throw new Error(`Failed to add event: ${id}`);
        result.added.push(event);
      } else if (existing === entry || this._isEquivalentFallback(existing, data)) {
        result.unchanged.push(existing);
      } else {
        const event = this.calendar.updateEvent(id, data);
        if (!event) throw new Error(`Failed to update event: ${id}`);
        result.updated.push({ event, oldEvent: existing });
      }
    });

    return result;
  }

  /**
   * Field-wise comparison of a stored event against snapshot data.
   * @param {CalendarEvent} existing
   * @param {object} data
   * @returns {boolean}
   * @private
   */
  _isEquivalentFallback(existing, data) {
    const toTime = value => {
      if (value instanceof Date) return value.getTime();
      if (value === undefined || value === null) return NaN;
      return new Date(value).getTime();
    };
    return Object.keys(data).every(key => {
      const stored = existing[key];
      const incoming = data[key];
      if (key === 'start' || key === 'end') return toTime(stored) === toTime(incoming);
      if (stored === incoming) return true;
      if (stored === undefined || stored === null || incoming === undefined || incoming === null) {
        return false;
      }
      return JSON.stringify(stored) === JSON.stringify(incoming);
    });
  }

  /**
   * Force sync state.events from Core calendar
   * Use this if you've modified events directly on the Core calendar
   */
  syncEvents() {
    return this._syncEventsFromCore();
  }

  getEventsForDate(date) {
    return this.calendar.getEventsForDate(date);
  }

  getEventsInRange(start, end) {
    return this.calendar.getEventsInRange(start, end);
  }

  // View data
  getViewData() {
    const viewData = this.calendar.getViewData();
    return this.enrichViewData(viewData);
  }

  enrichViewData(viewData) {
    // Shallow-copy the top-level object so we never mutate what Core returned.
    // Core may cache and reuse the same reference across calls; mutating it
    // in-place would corrupt its internal state.
    const enriched = { ...viewData };
    const selectedDateString = this.state.selectedDate?.toDateString();

    // Strategy 1: Multi-week structure (Month view)
    if (enriched.weeks) {
      enriched.weeks = enriched.weeks.map(week => ({
        ...week,
        days: week.days.map(day => {
          const dayDate = new Date(day.date);
          return {
            ...day,
            isSelected: dayDate.toDateString() === selectedDateString,
            events: day.events || this.getEventsForDate(dayDate)
          };
        })
      }));
    }

    // Strategy 2: Flat days structure (Week view or list view)
    if (enriched.days) {
      enriched.days = enriched.days.map(day => {
        const dayDate = new Date(day.date);
        return {
          ...day,
          isSelected: dayDate.toDateString() === selectedDateString,
          events: day.events || this.getEventsForDate(dayDate)
        };
      });
    }

    // Strategy 3: Single day structure (Day view)
    if (enriched.date && !enriched.days && !enriched.weeks) {
      const dayDate = new Date(enriched.date);
      enriched.isSelected = dayDate.toDateString() === selectedDateString;
      enriched.events = enriched.events || this.getEventsForDate(dayDate);
    }

    return enriched;
  }

  // Visible range

  /**
   * Get the window of dates the current view covers, including leading and
   * trailing days from adjacent months in the month view.
   *
   * `end` is the last millisecond of the window (inclusive), so the pair can
   * be passed straight to {@link StateManager#getEventsInRange}.
   *
   * @returns {VisibleRange}
   */
  getVisibleRange() {
    const view = this.calendar.getView();
    const date = this.calendar.getCurrentDate();

    if (view !== 'day') {
      const viewData = this.calendar.getViewData() || {};
      if (viewData.startDate instanceof Date && viewData.endDate instanceof Date) {
        const start = new Date(viewData.startDate);
        let end = new Date(viewData.endDate);
        // The list view reports an exclusive end; normalise it to inclusive
        if (viewData.type === 'list') {
          end = new Date(end.getTime() - 1);
        }
        return { start, end };
      }
    }

    // Day view (or a view without an explicit window): midnight to midnight
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(-1);
    return { start, end };
  }

  /**
   * @param {VisibleRange} range
   * @returns {string}
   * @private
   */
  _rangeKey(range) {
    return `${range.start.getTime()}:${range.end.getTime()}`;
  }

  /**
   * Single choke point for `range:changed`: recompute the visible window and
   * emit only when it differs from the last one that was announced.
   * Called after view, date and week-start changes, once their own bus events
   * have been emitted, so listeners see navigation before the range update.
   * @private
   */
  _syncVisibleRange() {
    if (!this.calendar) return;
    const range = this.getVisibleRange();
    const key = this._rangeKey(range);
    if (key === this._visibleRangeKey) return;
    this._visibleRangeKey = key;
    /** @type {VisibleRangeChange} */
    const payload = { ...range, view: this.state.view, date: this.state.currentDate };
    this.eventBus.emit('range:changed', payload);
  }

  // Selection management
  selectEvent(event) {
    this.setState({ selectedEvent: event });
    this.eventBus.emit('event:selected', { event });
  }

  selectEventById(eventId) {
    const event = this.state.events.find(e => e.id === eventId);
    if (event) {
      this.selectEvent(event);
    }
  }

  deselectEvent() {
    this.setState({ selectedEvent: null });
    this.eventBus.emit('event:deselected', {});
  }

  selectDate(date) {
    this.setState({ selectedDate: date });
    this.eventBus.emit('date:selected', { date });
  }

  deselectDate() {
    this.setState({ selectedDate: null });
    this.eventBus.emit('date:deselected', {});
  }

  // Utility methods
  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSelectedDate(date) {
    return (
      this.state.selectedDate && date.toDateString() === this.state.selectedDate.toDateString()
    );
  }

  isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  // Loading state
  setLoading(loading) {
    this.setState({ loading });
  }

  // Error handling
  setError(error) {
    this.setState({ error });
    if (error) {
      this.eventBus.emit('error', { error });
    }
  }

  clearError() {
    this.setState({ error: null });
  }

  // Configuration
  updateConfig(config) {
    this.setState({ config: { ...this.state.config, ...config } });

    // Update calendar configuration if needed
    if (config.weekStartsOn !== undefined) {
      this.calendar.setWeekStartsOn(config.weekStartsOn);
      this._syncVisibleRange();
    }
    if (config.locale !== undefined) {
      this.calendar.setLocale(config.locale);
    }
    if (config.timeZone !== undefined) {
      this.calendar.setTimezone(config.timeZone);
    }
  }

  // Destroy
  destroy() {
    this.subscribers.clear();
    if (this._subscriberIds) {
      this._subscriberIds.clear();
      this._subscriberIds = null;
    }
    if (this.eventBus) {
      this.eventBus.clear();
      this.eventBus = null;
    }
    this.state = null;
    this.calendar = null;
  }
}

// Export StateManager
export default StateManager;
