/**
 * Force Calendar Interface
 * Main entry point for the component library
 *
 * A solid foundation for calendar interfaces built on @forcecalendar/core
 */

// Core modules
export { BaseComponent } from './core/BaseComponent.js';
export { default as StateManager } from './core/StateManager.js';
export { default as eventBus, EventBus } from './core/EventBus.js';

// Utilities
export { DateUtils } from './utils/DateUtils.js';
export { DOMUtils } from './utils/DOMUtils.js';
export { StyleUtils } from './utils/StyleUtils.js';

// View Renderers (pure JS classes, Locker Service compatible)
export { BaseViewRenderer } from './renderers/BaseViewRenderer.js';
export { MonthViewRenderer } from './renderers/MonthViewRenderer.js';
export { WeekViewRenderer } from './renderers/WeekViewRenderer.js';
export { DayViewRenderer } from './renderers/DayViewRenderer.js';

// Components
export { ForceCalendar } from './components/ForceCalendar.js';
export { EventForm } from './components/EventForm.js';

// DOM typings for <forcecal-main> (hand-written in src/types/dom.d.ts and
// shipped alongside the generated declarations). Re-exported here so
// consumers can import them from the package root.
/** @typedef {import('./types/dom.js').CalendarView} CalendarView */
/** @typedef {import('./types/dom.js').CalendarEventInput} CalendarEventInput */
/** @typedef {import('./types/dom.js').ForceCalendarEventMap} ForceCalendarEventMap */
/** @typedef {import('./types/dom.js').ForceCalendarElement} ForceCalendarElement */
/** @typedef {import('./types/dom.js').CalendarRangeChangeDetail} CalendarRangeChangeDetail */
/** @typedef {import('./core/StateManager.js').CalendarEvent} CalendarEvent */
/** @typedef {import('./core/StateManager.js').EventsSetOptions} EventsSetOptions */
/** @typedef {import('./core/StateManager.js').EventsSetResult} EventsSetResult */
/** @typedef {import('./core/StateManager.js').VisibleRange} VisibleRange */
