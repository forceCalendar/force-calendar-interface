// Full calendar component that uses the core engine
import { Calendar } from '@forcecalendar/core';
import { MonthView } from './MonthView.js';

export class CalendarFull extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Initialize core calendar engine
        this.calendar = new Calendar({
            timeZone: 'America/New_York'
        });

        this.monthView = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                .calendar-container {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .calendar-header {
                    background: #f5f5f5;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #ddd;
                }
                .calendar-title {
                    font-size: 18px;
                    font-weight: 600;
                }
                .calendar-nav {
                    display: flex;
                    gap: 10px;
                }
                .calendar-nav button {
                    padding: 5px 15px;
                    border: 1px solid #ccc;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .calendar-nav button:hover {
                    background: #f0f0f0;
                }
                .calendar-body {
                    padding: 10px;
                }
            </style>
            <div class="calendar-container">
                <div class="calendar-header">
                    <div class="calendar-title">
                        <span id="month-year"></span>
                    </div>
                    <div class="calendar-nav">
                        <button id="prev-month">←</button>
                        <button id="today">Today</button>
                        <button id="next-month">→</button>
                    </div>
                </div>
                <div class="calendar-body">
                    <force-calendar-month></force-calendar-month>
                </div>
            </div>
        `;

        // Connect month view to calendar engine
        this.monthView = this.shadowRoot.querySelector('force-calendar-month');
        this.monthView.setCalendar(this.calendar);

        this.updateHeader();
    }

    setupEventListeners() {
        this.shadowRoot.getElementById('prev-month').addEventListener('click', () => {
            this.monthView.previousMonth();
            this.updateHeader();
        });

        this.shadowRoot.getElementById('next-month').addEventListener('click', () => {
            this.monthView.nextMonth();
            this.updateHeader();
        });

        this.shadowRoot.getElementById('today').addEventListener('click', () => {
            this.monthView.currentDate = new Date();
            this.monthView.render();
            this.updateHeader();
        });
    }

    updateHeader() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const date = this.monthView.currentDate;
        const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        this.shadowRoot.getElementById('month-year').textContent = monthYear;
    }

    // Public API
    addEvent(event) {
        this.calendar.addEvent(event);
        this.monthView.render();
    }

    getEvents() {
        return this.calendar.getEvents();
    }

    removeEvent(eventId) {
        this.calendar.removeEvent(eventId);
        this.monthView.render();
    }
}

customElements.define('force-calendar-full', CalendarFull);