// Test that we can successfully import from the npm package
import { Calendar, Event, EventStore } from '@forcecalendar/core';

console.log('✅ Successfully imported from @forcecalendar/core npm package:');
console.log('  - Calendar:', typeof Calendar);
console.log('  - Event:', typeof Event);
console.log('  - EventStore:', typeof EventStore);

// Create a simple test
const calendar = new Calendar();
const event = new Event({
  id: 'test-1',
  title: 'Test Event from NPM Package',
  start: new Date('2025-01-15T10:00:00'),
  end: new Date('2025-01-15T11:00:00')
});

calendar.addEvent(event);
console.log('\n✅ Successfully created calendar and added event');
console.log('  Events in calendar:', calendar.getEvents().length);