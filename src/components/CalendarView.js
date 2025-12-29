// Main Calendar View Component - Enterprise Clean Design
// Uses @forcecalendar/core npm package for all calendar logic
import { Calendar, Event, EventStore } from '@forcecalendar/core';

export class CalendarView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Initialize the core engine from npm package
        this.calendar = new Calendar({
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });

        // View state
        this.currentView = 'month'; // month, week, day, agenda
        this.currentDate = new Date();
        this.selectedDate = null;

        // UI state
        this.isDragging = false;
        this.draggedEvent = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadInitialData();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    background: #ffffff;
                    color: #202124;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
                    overflow: hidden;
                    --primary-color: #1a73e8;
                    --hover-bg: #f1f3f4;
                    --border-color: #dadce0;
                    --text-secondary: #5f6368;
                    --event-height: 22px;
                    --header-height: 64px;
                }

                * {
                    box-sizing: border-box;
                }

                /* Header */
                .calendar-header {
                    height: var(--header-height);
                    background: #fff;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    padding: 0 16px;
                    gap: 16px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .btn-today {
                    padding: 8px 16px;
                    border: 1px solid var(--border-color);
                    background: #fff;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-today:hover {
                    background: var(--hover-bg);
                }

                .nav-buttons {
                    display: flex;
                    gap: 4px;
                }

                .nav-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                .nav-btn:hover {
                    background: var(--hover-bg);
                }

                .nav-btn svg {
                    width: 20px;
                    height: 20px;
                    fill: var(--text-secondary);
                }

                .current-period {
                    font-size: 22px;
                    font-weight: 400;
                    color: #202124;
                    min-width: 200px;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .view-selector {
                    display: flex;
                    background: var(--hover-bg);
                    border-radius: 4px;
                    padding: 2px;
                }

                .view-btn {
                    padding: 6px 12px;
                    border: none;
                    background: transparent;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--text-secondary);
                }

                .view-btn.active {
                    background: #fff;
                    color: #202124;
                    box-shadow: 0 1px 2px rgba(60,64,67,0.3);
                }

                /* Calendar Body */
                .calendar-body {
                    position: relative;
                    height: calc(100vh - var(--header-height) - 100px);
                    min-height: 500px;
                    overflow: hidden;
                }

                /* Month View */
                .month-view {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .weekday-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    border-bottom: 1px solid var(--border-color);
                    background: #f8f9fa;
                }

                .weekday {
                    padding: 12px 16px;
                    font-size: 11px;
                    font-weight: 500;
                    text-transform: uppercase;
                    color: #70757a;
                    letter-spacing: 0.8px;
                }

                .month-grid {
                    flex: 1;
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-auto-rows: 1fr;
                    gap: 1px;
                    background: var(--border-color);
                    padding: 1px;
                }

                .day-cell {
                    background: #fff;
                    padding: 8px;
                    min-height: 100px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .day-cell:hover {
                    background: #f8f9fa;
                }

                .day-cell.other-month {
                    background: #f8f9fa;
                }

                .day-cell.today {
                    background: #e8f0fe;
                }

                .day-cell.selected {
                    background: #d2e3fc;
                }

                .day-number {
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: #202124;
                }

                .day-cell.other-month .day-number {
                    color: #70757a;
                }

                .day-cell.today .day-number {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    background: var(--primary-color);
                    color: #fff;
                    border-radius: 50%;
                }

                /* Events */
                .event {
                    font-size: 12px;
                    padding: 2px 6px;
                    margin-bottom: 2px;
                    border-radius: 4px;
                    background: var(--primary-color);
                    color: #fff;
                    cursor: pointer;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    transition: opacity 0.2s;
                }

                .event:hover {
                    opacity: 0.9;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }

                .event.dragging {
                    opacity: 0.5;
                }

                .more-events {
                    font-size: 12px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    margin-top: 4px;
                }

                .more-events:hover {
                    color: var(--primary-color);
                }

                /* Week View */
                .week-view {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .time-grid {
                    flex: 1;
                    display: flex;
                    overflow-y: auto;
                }

                .time-column {
                    width: 60px;
                    flex-shrink: 0;
                    border-right: 1px solid var(--border-color);
                }

                .time-slot {
                    height: 60px;
                    padding: 8px;
                    font-size: 11px;
                    color: var(--text-secondary);
                    text-align: right;
                    border-bottom: 1px solid #f1f3f4;
                }

                .days-container {
                    flex: 1;
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    position: relative;
                }

                .day-column {
                    border-right: 1px solid var(--border-color);
                    position: relative;
                }

                .day-column:last-child {
                    border-right: none;
                }

                .hour-line {
                    height: 60px;
                    border-bottom: 1px solid #f1f3f4;
                }

                /* Loading State */
                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-secondary);
                }

                /* Animations */
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .month-grid {
                    animation: slideIn 0.3s ease-out;
                }
            </style>

            <div class="calendar-header">
                <div class="header-left">
                    <button class="btn-today" id="todayBtn">Today</button>
                    <div class="nav-buttons">
                        <button class="nav-btn" id="prevBtn">
                            <svg viewBox="0 0 24 24">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <button class="nav-btn" id="nextBtn">
                            <svg viewBox="0 0 24 24">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </div>
                    <h2 class="current-period" id="currentPeriod"></h2>
                </div>
                <div class="header-right">
                    <div class="view-selector">
                        <button class="view-btn active" data-view="month">Month</button>
                        <button class="view-btn" data-view="week">Week</button>
                        <button class="view-btn" data-view="day">Day</button>
                        <button class="view-btn" data-view="agenda">Agenda</button>
                    </div>
                </div>
            </div>

            <div class="calendar-body" id="calendarBody">
                <div class="loading">Loading calendar...</div>
            </div>
        `;
    }

    setupEventListeners() {
        const todayBtn = this.shadowRoot.getElementById('todayBtn');
        const prevBtn = this.shadowRoot.getElementById('prevBtn');
        const nextBtn = this.shadowRoot.getElementById('nextBtn');

        todayBtn.addEventListener('click', () => this.goToToday());
        prevBtn.addEventListener('click', () => this.navigatePrevious());
        nextBtn.addEventListener('click', () => this.navigateNext());

        // View selector
        this.shadowRoot.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    }

    loadInitialData() {
        // Add some sample events using the core engine
        const sampleEvents = [
            {
                id: '1',
                title: 'Team Standup',
                start: new Date(2025, 0, 15, 9, 0),
                end: new Date(2025, 0, 15, 9, 30),
                color: '#1a73e8'
            },
            {
                id: '2',
                title: 'Product Review',
                start: new Date(2025, 0, 15, 14, 0),
                end: new Date(2025, 0, 15, 15, 30),
                color: '#34a853'
            },
            {
                id: '3',
                title: 'Client Meeting',
                start: new Date(2025, 0, 16, 10, 0),
                end: new Date(2025, 0, 16, 11, 0),
                color: '#ea4335'
            },
            {
                id: '4',
                title: 'Sprint Planning',
                start: new Date(2025, 0, 17, 13, 0),
                end: new Date(2025, 0, 17, 16, 0),
                color: '#fbbc04'
            }
        ];

        sampleEvents.forEach(eventData => {
            const event = new Event(eventData);
            this.calendar.addEvent(event);
        });

        this.renderCurrentView();
    }

    renderCurrentView() {
        this.updateHeader();

        switch(this.currentView) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
            case 'agenda':
                this.renderAgendaView();
                break;
        }
    }

    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Get events for this month from the core engine
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);

        // Extend to show previous/next month dates
        const firstDay = startOfMonth.getDay();
        const viewStart = new Date(startOfMonth);
        viewStart.setDate(viewStart.getDate() - firstDay);

        const viewEnd = new Date(endOfMonth);
        const daysToAdd = (7 - endOfMonth.getDay() - 1) % 7;
        if (daysToAdd > 0) {
            viewEnd.setDate(viewEnd.getDate() + daysToAdd);
        }

        const events = this.calendar.getEventsBetween(viewStart, viewEnd);

        const calendarBody = this.shadowRoot.getElementById('calendarBody');
        calendarBody.innerHTML = `
            <div class="month-view">
                <div class="weekday-header">
                    <div class="weekday">Sun</div>
                    <div class="weekday">Mon</div>
                    <div class="weekday">Tue</div>
                    <div class="weekday">Wed</div>
                    <div class="weekday">Thu</div>
                    <div class="weekday">Fri</div>
                    <div class="weekday">Sat</div>
                </div>
                <div class="month-grid" id="monthGrid"></div>
            </div>
        `;

        const monthGrid = this.shadowRoot.getElementById('monthGrid');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create day cells
        const currentDay = new Date(viewStart);
        while (currentDay <= viewEnd) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';

            // Check if other month
            if (currentDay.getMonth() !== month) {
                dayCell.classList.add('other-month');
            }

            // Check if today
            if (currentDay.getTime() === today.getTime()) {
                dayCell.classList.add('today');
            }

            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = currentDay.getDate();
            dayCell.appendChild(dayNumber);

            // Add events for this day
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.start);
                return eventDate.toDateString() === currentDay.toDateString();
            });

            dayEvents.slice(0, 3).forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = 'event';
                eventEl.textContent = event.title;
                eventEl.style.background = event.color || '#1a73e8';
                eventEl.draggable = true;
                eventEl.dataset.eventId = event.id;
                dayCell.appendChild(eventEl);
            });

            if (dayEvents.length > 3) {
                const moreEvents = document.createElement('div');
                moreEvents.className = 'more-events';
                moreEvents.textContent = `+${dayEvents.length - 3} more`;
                dayCell.appendChild(moreEvents);
            }

            monthGrid.appendChild(dayCell);
            currentDay.setDate(currentDay.getDate() + 1);
        }
    }

    renderWeekView() {
        const calendarBody = this.shadowRoot.getElementById('calendarBody');
        calendarBody.innerHTML = `
            <div class="week-view">
                <div class="weekday-header">
                    ${this.getWeekDayHeaders()}
                </div>
                <div class="time-grid">
                    <div class="time-column">
                        ${this.getTimeSlots()}
                    </div>
                    <div class="days-container">
                        ${this.getWeekDayColumns()}
                    </div>
                </div>
            </div>
        `;
    }

    renderDayView() {
        const calendarBody = this.shadowRoot.getElementById('calendarBody');
        const dayName = this.currentDate.toLocaleDateString('en-US', { weekday: 'long' });

        calendarBody.innerHTML = `
            <div class="week-view">
                <div class="weekday-header">
                    <div class="weekday" style="grid-column: 1 / -1; text-align: center;">
                        ${dayName}, ${this.currentDate.toLocaleDateString()}
                    </div>
                </div>
                <div class="time-grid">
                    <div class="time-column">
                        ${this.getTimeSlots()}
                    </div>
                    <div class="days-container" style="grid-template-columns: 1fr;">
                        <div class="day-column">
                            ${Array(24).fill(0).map(() => '<div class="hour-line"></div>').join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAgendaView() {
        const events = this.calendar.getEvents();
        const calendarBody = this.shadowRoot.getElementById('calendarBody');

        calendarBody.innerHTML = `
            <div style="padding: 24px;">
                <h3 style="margin-bottom: 16px; color: #202124;">Upcoming Events</h3>
                ${events.map(event => `
                    <div style="padding: 12px; border-left: 4px solid ${event.color || '#1a73e8'};
                                background: #f8f9fa; margin-bottom: 8px; border-radius: 4px;">
                        <div style="font-weight: 500; margin-bottom: 4px;">${event.title}</div>
                        <div style="font-size: 14px; color: #5f6368;">
                            ${new Date(event.start).toLocaleString()} -
                            ${new Date(event.end).toLocaleTimeString()}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getWeekDayHeaders() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(day => `<div class="weekday">${day}</div>`).join('');
    }

    getTimeSlots() {
        return Array(24).fill(0).map((_, i) => {
            const hour = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
            return `<div class="time-slot">${hour}</div>`;
        }).join('');
    }

    getWeekDayColumns() {
        return Array(7).fill(0).map(() => `
            <div class="day-column">
                ${Array(24).fill(0).map(() => '<div class="hour-line"></div>').join('')}
            </div>
        `).join('');
    }

    updateHeader() {
        const period = this.shadowRoot.getElementById('currentPeriod');

        switch(this.currentView) {
            case 'month':
                period.textContent = this.currentDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                });
                break;
            case 'week':
                const weekStart = new Date(this.currentDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                period.textContent = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                break;
            case 'day':
                period.textContent = this.currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
                break;
            case 'agenda':
                period.textContent = 'All Events';
                break;
        }
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCurrentView();
    }

    navigatePrevious() {
        switch(this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
        }
        this.renderCurrentView();
    }

    navigateNext() {
        switch(this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
        }
        this.renderCurrentView();
    }

    switchView(view) {
        this.currentView = view;

        // Update active button
        this.shadowRoot.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.renderCurrentView();
    }
}

// Register the custom element
customElements.define('force-calendar-view', CalendarView);