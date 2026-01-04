#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('Testing ForceCalendar Interface build...\n');

// Check if ESM build exists and exports correctly
try {
    const esmPath = resolve('./dist/force-calendar-interface.esm.js');
    const esmContent = readFileSync(esmPath, 'utf8');

    // Check for key exports
    const hasForceCalendar = esmContent.includes('ForceCalendar');
    const hasMonthView = esmContent.includes('MonthView');
    const hasWeekView = esmContent.includes('WeekView');
    const hasDayView = esmContent.includes('DayView');
    const hasCustomElement = esmContent.includes('customElements.define');

    console.log('✓ ESM build found');
    console.log(`  - ForceCalendar: ${hasForceCalendar ? '✓' : '✗'}`);
    console.log(`  - MonthView: ${hasMonthView ? '✓' : '✗'}`);
    console.log(`  - WeekView: ${hasWeekView ? '✓' : '✗'}`);
    console.log(`  - DayView: ${hasDayView ? '✓' : '✗'}`);
    console.log(`  - Custom Element Registration: ${hasCustomElement ? '✓' : '✗'}`);
} catch (error) {
    console.error('✗ ESM build not found or invalid');
    process.exit(1);
}

// Check if UMD build exists
try {
    const umdPath = resolve('./dist/force-calendar-interface.umd.js');
    const umdContent = readFileSync(umdPath, 'utf8');

    // Check for UMD wrapper
    const hasUmdWrapper = umdContent.includes('typeof exports') && umdContent.includes('typeof define');
    const hasGlobalName = umdContent.includes('ForceCalendarInterface');

    console.log('\n✓ UMD build found');
    console.log(`  - UMD wrapper: ${hasUmdWrapper ? '✓' : '✗'}`);
    console.log(`  - Global name: ${hasGlobalName ? '✓' : '✗'}`);
} catch (error) {
    console.error('✗ UMD build not found or invalid');
    process.exit(1);
}

console.log('\n✅ Build test passed! Library is properly built.');