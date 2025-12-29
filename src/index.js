// forceCalendar Interface - Official Interface Layer for forceCalendar Core
// Powered by @forcecalendar/core npm package

// Export all components
export { CalendarView } from './components/CalendarView.js';
export { MonthView } from './components/MonthView.js';
export { CalendarFull } from './components/CalendarFull.js';

// Auto-register web components
import './components/CalendarView.js';
import './components/MonthView.js';
import './components/CalendarFull.js';

console.log('forceCalendar Interface v0.1.0 loaded');