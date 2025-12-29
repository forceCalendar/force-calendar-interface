/**
 * MonthView - Month grid view component
 *
 * Displays a traditional month calendar grid with events
 */

import { BaseComponent } from '../../core/BaseComponent.js';
import { DateUtils } from '../../utils/DateUtils.js';
import { StyleUtils } from '../../utils/StyleUtils.js';
import eventBus from '../../core/EventBus.js';

export class MonthView extends BaseComponent {
    constructor() {
        super();
        this._stateManager = null;
        this.viewData = null;
    }

    set stateManager(manager) {
        this._stateManager = manager;
        if (manager) {
            // Subscribe to state changes
            this.unsubscribe = manager.subscribe(this.handleStateUpdate.bind(this));
            this.loadViewData();
        }
    }

    get stateManager() {
        return this._stateManager;
    }

    handleStateUpdate(newState, oldState) {
        // Re-render on relevant state changes
        const relevantKeys = ['currentDate', 'events', 'selectedDate', 'selectedEvent'];
        const hasRelevantChange = relevantKeys.some(key => newState[key] !== oldState?.[key]);

        if (hasRelevantChange) {
            this.loadViewData();
        }
    }

    loadViewData() {
        if (!this.stateManager) return;

        const viewData = this.stateManager.getViewData();
        this.viewData = this.processViewData(viewData);
        this.render();
    }

    processViewData(viewData) {
        if (!viewData || !viewData.weeks) return null;

        // ViewData already has weeks from Core, just enhance each day
        const weeks = viewData.weeks.map(week => {
            return week.days.map(day => ({
                ...day,
                date: new Date(day.date), // Convert string to Date object
                isOtherMonth: !day.isCurrentMonth,
                isSelected: this.isSelectedDate(new Date(day.date))
            }));
        });

        return {
            ...viewData,
            weeks,
            month: viewData.month,
            year: viewData.year
        };
    }

    isSelectedDate(date) {
        const selectedDate = this.stateManager?.getState()?.selectedDate;
        return selectedDate && date.toDateString() === selectedDate.toDateString();
    }

    getStyles() {
        return `
            :host {
                display: block;
                height: 100%;
            }

            .month-view {
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .month-header {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: var(--fc-border-width);
                background: var(--fc-border-color);
                border-bottom: var(--fc-border-width) solid var(--fc-border-color);
            }

            .month-header-cell {
                background: var(--fc-background);
                padding: var(--fc-spacing-sm) var(--fc-spacing-xs);
                text-align: center;
                font-weight: 600;
                font-size: var(--fc-font-size-sm);
                color: var(--fc-text-secondary);
                text-transform: uppercase;
            }

            .month-body {
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .month-week {
                flex: 1;
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: var(--fc-border-width);
                background: var(--fc-border-color);
            }

            .month-week:not(:last-child) {
                border-bottom: var(--fc-border-width) solid var(--fc-border-color);
            }

            .month-day {
                background: var(--fc-background);
                padding: var(--fc-spacing-xs);
                position: relative;
                cursor: pointer;
                overflow: hidden;
                min-height: 80px;
                transition: background-color var(--fc-transition-fast);
            }

            .month-day:hover {
                background: var(--fc-background-hover);
            }

            .month-day.other-month {
                background: var(--fc-gray-50);
            }

            .month-day.other-month .day-number {
                color: var(--fc-gray-400);
            }

            .month-day.today {
                background: ${StyleUtils.hexToRgba(StyleUtils.colors.primary, 0.05)};
            }

            .month-day.today .day-number {
                background: var(--fc-primary-color);
                color: white;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .month-day.selected {
                background: ${StyleUtils.hexToRgba(StyleUtils.colors.primary, 0.1)};
                outline: 2px solid var(--fc-primary-color);
                outline-offset: -2px;
            }

            .month-day.weekend {
                background: var(--fc-gray-50);
            }

            .day-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: var(--fc-spacing-xs);
            }

            .day-number {
                font-size: var(--fc-font-size-base);
                font-weight: 500;
                color: var(--fc-text-color);
                line-height: 1.5;
            }

            .day-events {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .event-item {
                font-size: var(--fc-font-size-xs);
                padding: 2px 4px;
                border-radius: 2px;
                background: var(--fc-primary-color);
                color: white;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                cursor: pointer;
                transition: opacity var(--fc-transition-fast);
            }

            .event-item:hover {
                opacity: 0.9;
            }

            .event-item.all-day {
                font-weight: 500;
            }

            .event-time {
                font-weight: 600;
                margin-right: 4px;
            }

            .more-events {
                font-size: var(--fc-font-size-xs);
                color: var(--fc-text-secondary);
                cursor: pointer;
                padding: 2px 4px;
                text-align: center;
            }

            .more-events:hover {
                color: var(--fc-primary-color);
                text-decoration: underline;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .month-day {
                    min-height: 60px;
                    padding: 2px;
                }

                .day-number {
                    font-size: var(--fc-font-size-sm);
                }

                .event-item {
                    font-size: 10px;
                    padding: 1px 2px;
                }

                .month-header-cell {
                    font-size: 10px;
                    padding: var(--fc-spacing-xs);
                }
            }

            /* Loading state */
            .month-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--fc-text-secondary);
            }

            /* Empty state */
            .month-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--fc-text-secondary);
                gap: var(--fc-spacing-md);
            }

            .empty-icon {
                width: 48px;
                height: 48px;
                opacity: 0.3;
            }
        `;
    }

    template() {
        if (!this.viewData) {
            return `
                <div class="month-view">
                    <div class="month-loading">Loading calendar...</div>
                </div>
            `;
        }

        return `
            <div class="month-view">
                ${this.renderHeader()}
                ${this.renderBody()}
            </div>
        `;
    }

    renderHeader() {
        const { config } = this.stateManager.getState();
        const days = [];
        const weekStartsOn = config.weekStartsOn || 0;

        for (let i = 0; i < 7; i++) {
            const dayIndex = (weekStartsOn + i) % 7;
            const dayName = DateUtils.getDayAbbreviation(dayIndex, config.locale);
            days.push(`<div class="month-header-cell">${dayName}</div>`);
        }

        return `
            <div class="month-header">
                ${days.join('')}
            </div>
        `;
    }

    renderBody() {
        if (!this.viewData.weeks || this.viewData.weeks.length === 0) {
            return `
                <div class="month-body">
                    <div class="month-empty">
                        <svg class="empty-icon" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                        </svg>
                        <p>No calendar data available</p>
                    </div>
                </div>
            `;
        }

        const weeks = this.viewData.weeks.map(week => this.renderWeek(week));

        return `
            <div class="month-body">
                ${weeks.join('')}
            </div>
        `;
    }

    renderWeek(weekDays) {
        const days = weekDays.map(day => this.renderDay(day));

        return `
            <div class="month-week">
                ${days.join('')}
            </div>
        `;
    }

    renderDay(dayData) {
        const { date, dayOfMonth, isOtherMonth, isToday, isSelected, isWeekend, events = [] } = dayData;
        const dayNumber = dayOfMonth;

        // Build classes
        const classes = ['month-day'];
        if (isOtherMonth) classes.push('other-month');
        if (isToday) classes.push('today');
        if (isSelected) classes.push('selected');
        if (isWeekend) classes.push('weekend');

        // Render events (show max 3, then "+X more")
        const maxEventsToShow = 3;
        const visibleEvents = events.slice(0, maxEventsToShow);
        const remainingCount = events.length - maxEventsToShow;

        const eventsHtml = visibleEvents.map(event => this.renderEvent(event)).join('');
        const moreHtml = remainingCount > 0 ?
            `<div class="more-events">+${remainingCount} more</div>` : '';

        return `
            <div class="${classes.join(' ')}"
                 data-date="${date.toISOString()}"
                 data-day="${dayNumber}">
                <div class="day-header">
                    <span class="day-number">${dayNumber}</span>
                </div>
                <div class="day-events">
                    ${eventsHtml}
                    ${moreHtml}
                </div>
            </div>
        `;
    }

    renderEvent(event) {
        const { title, start, end, allDay, backgroundColor = '#4285F4', textColor } = event;

        const bgColor = backgroundColor || StyleUtils.colors.primary;
        const fgColor = textColor || StyleUtils.getContrastColor(bgColor);

        let timeStr = '';
        if (!allDay && start) {
            timeStr = DateUtils.formatTime(new Date(start), false, false);
        }

        const style = `background-color: ${bgColor}; color: ${fgColor};`;
        const classes = ['event-item'];
        if (allDay) classes.push('all-day');

        return `
            <div class="${classes.join(' ')}"
                 style="${style}"
                 data-event-id="${event.id}"
                 title="${this.escapeHtml(title)}">
                ${timeStr ? `<span class="event-time">${timeStr}</span>` : ''}
                <span class="event-title">${this.escapeHtml(title)}</span>
            </div>
        `;
    }

    afterRender() {
        // Add click handlers for days
        this.$$('.month-day').forEach(dayEl => {
            dayEl.addEventListener('click', this.handleDayClick.bind(this));
        });

        // Add click handlers for events
        this.$$('.event-item').forEach(eventEl => {
            eventEl.addEventListener('click', this.handleEventClick.bind(this));
        });

        // Add click handlers for "more events"
        this.$$('.more-events').forEach(moreEl => {
            moreEl.addEventListener('click', this.handleMoreClick.bind(this));
        });
    }

    handleDayClick(event) {
        event.stopPropagation();
        const dayEl = event.currentTarget;
        const date = new Date(dayEl.dataset.date);

        this.stateManager.selectDate(date);
        this.emit('day-click', { date });
    }

    handleEventClick(event) {
        event.stopPropagation();
        const eventEl = event.currentTarget;
        const eventId = eventEl.dataset.eventId;
        const calendarEvent = this.stateManager.getEvents().find(e => e.id === eventId);

        if (calendarEvent) {
            this.stateManager.selectEvent(calendarEvent);
            this.emit('event-click', { event: calendarEvent });
        }
    }

    handleMoreClick(event) {
        event.stopPropagation();
        const dayEl = event.currentTarget.closest('.month-day');
        const date = new Date(dayEl.dataset.date);
        const events = this.stateManager.getEventsForDate(date);

        this.emit('more-events-click', { date, events });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    unmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Export both the class and as default
export { MonthView as MonthViewDefault };
export default MonthView;