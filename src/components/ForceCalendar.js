/**
 * ForceCalendar - Main calendar component
 *
 * The primary interface component that integrates all views and features
 */

import { BaseComponent } from '../core/BaseComponent.js';
import StateManager from '../core/StateManager.js';
import eventBus from '../core/EventBus.js';
import { StyleUtils } from '../utils/StyleUtils.js';
import { DateUtils } from '../utils/DateUtils.js';

// Import view components
import { MonthView } from './views/MonthView.js';
import { WeekView } from './views/WeekView.js';
import { DayView } from './views/DayView.js';
import { AgendaView } from './views/AgendaView.js';

// Register view components
if (!customElements.get('force-calendar-month')) {
    customElements.define('force-calendar-month', MonthView);
}
if (!customElements.get('force-calendar-week')) {
    customElements.define('force-calendar-week', WeekView);
}
if (!customElements.get('force-calendar-day')) {
    customElements.define('force-calendar-day', DayView);
}
if (!customElements.get('force-calendar-agenda')) {
    customElements.define('force-calendar-agenda', AgendaView);
}

export class ForceCalendar extends BaseComponent {
    static get observedAttributes() {
        return ['view', 'date', 'locale', 'timezone', 'week-starts-on', 'height'];
    }

    constructor() {
        super();
        this.stateManager = null;
        this.currentView = null;
    }

    initialize() {
        // Initialize state manager with config from attributes
        const config = {
            view: this.getAttribute('view') || 'month',
            date: this.getAttribute('date') ? new Date(this.getAttribute('date')) : new Date(),
            locale: this.getAttribute('locale') || 'en-US',
            timeZone: this.getAttribute('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone,
            weekStartsOn: parseInt(this.getAttribute('week-starts-on') || '0')
        };

        this.stateManager = new StateManager(config);

        // Subscribe to state changes
        this.stateManager.subscribe(this.handleStateChange.bind(this));

        // Listen for events
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Navigation events
        eventBus.on('navigation:*', (data, event) => {
            this.emit('calendar-navigate', { action: event.split(':')[1], ...data });
        });

        // View change events
        eventBus.on('view:changed', (data) => {
            this.emit('calendar-view-change', data);
        });

        // Event management events
        eventBus.on('event:*', (data, event) => {
            this.emit(`calendar-event-${event.split(':')[1]}`, data);
        });

        // Date selection events
        eventBus.on('date:selected', (data) => {
            this.emit('calendar-date-select', data);
        });
    }

    handleStateChange(newState, oldState) {
        // Handle state changes if needed
        if (newState.view !== oldState?.view) {
            this.loadView(newState.view);
        }
    }

    mount() {
        super.mount();
        this.loadView(this.stateManager.getView());
    }

    loadView(viewType) {
        // Views are already registered at the top of the file
        this.currentView = viewType;
        this.render();
    }

    getStyles() {
        const height = this.getAttribute('height') || '600px';

        return `
            ${StyleUtils.getButtonStyles()}
            ${StyleUtils.getGridStyles()}
            ${StyleUtils.getAnimations()}

            :host {
                --calendar-height: ${height};
            }

            .force-calendar {
                display: flex;
                flex-direction: column;
                height: var(--calendar-height);
                background: var(--fc-background);
                border: var(--fc-border-width) solid var(--fc-border-color);
                border-radius: var(--fc-border-radius);
                overflow: hidden;
            }

            .fc-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--fc-spacing-lg);
                background: var(--fc-background);
                border-bottom: var(--fc-border-width) solid var(--fc-border-color);
            }

            .fc-header-left,
            .fc-header-center,
            .fc-header-right {
                display: flex;
                align-items: center;
                gap: var(--fc-spacing-sm);
            }

            .fc-header-center {
                flex: 1;
                justify-content: center;
            }

            .fc-title {
                font-size: var(--fc-font-size-xl);
                font-weight: 600;
                color: var(--fc-text-color);
            }

            .fc-nav-buttons {
                display: flex;
                gap: var(--fc-spacing-xs);
            }

            .fc-view-buttons {
                display: flex;
                gap: var(--fc-spacing-xs);
            }

            .fc-view-button.active {
                background: var(--fc-primary-color);
                color: white;
            }

            .fc-body {
                flex: 1;
                overflow: auto;
                position: relative;
            }

            .fc-view-container {
                height: 100%;
                position: relative;
            }

            /* Loading state */
            .fc-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: var(--fc-spacing-sm);
            }

            .fc-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--fc-border-color);
                border-top-color: var(--fc-primary-color);
                border-radius: 50%;
                animation: fc-spin 1s linear infinite;
            }

            /* Error state */
            .fc-error {
                padding: var(--fc-spacing-lg);
                text-align: center;
                color: var(--fc-danger-color);
            }

            /* Icons */
            .fc-icon {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .fc-header {
                    flex-direction: column;
                    gap: var(--fc-spacing-md);
                }

                .fc-header-left,
                .fc-header-center,
                .fc-header-right {
                    width: 100%;
                }
            }
        `;
    }

    template() {
        const state = this.stateManager.getState();
        const { currentDate, view, loading, error } = state;

        if (error) {
            return `
                <div class="force-calendar">
                    <div class="fc-error">
                        <p>Error: ${error.message || 'An error occurred'}</p>
                    </div>
                </div>
            `;
        }

        const title = this.getTitle(currentDate, view);

        return `
            <div class="force-calendar">
                <header class="fc-header">
                    <div class="fc-header-left">
                        <button class="fc-btn fc-btn-outline fc-btn-today" data-action="today">
                            Today
                        </button>
                        <div class="fc-nav-buttons">
                            <button class="fc-btn fc-btn-icon fc-btn-ghost" data-action="previous" title="Previous">
                                ${this.getIcon('chevron-left')}
                            </button>
                            <button class="fc-btn fc-btn-icon fc-btn-ghost" data-action="next" title="Next">
                                ${this.getIcon('chevron-right')}
                            </button>
                        </div>
                    </div>

                    <div class="fc-header-center">
                        <h2 class="fc-title">${title}</h2>
                    </div>

                    <div class="fc-header-right">
                        <div class="fc-view-buttons" role="group">
                            <button class="fc-btn fc-btn-outline fc-view-button ${view === 'month' ? 'active' : ''}"
                                    data-view="month">Month</button>
                            <button class="fc-btn fc-btn-outline fc-view-button ${view === 'week' ? 'active' : ''}"
                                    data-view="week">Week</button>
                            <button class="fc-btn fc-btn-outline fc-view-button ${view === 'day' ? 'active' : ''}"
                                    data-view="day">Day</button>
                            <button class="fc-btn fc-btn-outline fc-view-button ${view === 'agenda' ? 'active' : ''}"
                                    data-view="agenda">Agenda</button>
                        </div>
                    </div>
                </header>

                <div class="fc-body">
                    ${loading ? `
                        <div class="fc-loading">
                            <div class="fc-spinner"></div>
                            <span>Loading...</span>
                        </div>
                    ` : `
                        <div class="fc-view-container">
                            ${this.renderView()}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderView() {
        if (!this.currentView) {
            return '<div>Loading view...</div>';
        }

        const tagName = `force-calendar-${this.currentView}`;
        return `<${tagName} id="calendar-view"></${tagName}>`;
    }

    afterRender() {
        // Set up view component
        const viewElement = this.$('#calendar-view');
        if (viewElement && this.stateManager) {
            viewElement.stateManager = this.stateManager;
        }

        // Add event listeners for buttons
        this.$$('[data-action]').forEach(button => {
            button.addEventListener('click', this.handleNavigation.bind(this));
        });

        this.$$('[data-view]').forEach(button => {
            button.addEventListener('click', this.handleViewChange.bind(this));
        });
    }

    handleNavigation(event) {
        const action = event.currentTarget.dataset.action;
        switch (action) {
            case 'today':
                this.stateManager.today();
                break;
            case 'previous':
                this.stateManager.previous();
                break;
            case 'next':
                this.stateManager.next();
                break;
        }
    }

    handleViewChange(event) {
        const view = event.currentTarget.dataset.view;
        this.stateManager.setView(view);
    }

    getTitle(date, view) {
        const locale = this.stateManager.state.config.locale;

        switch (view) {
            case 'month':
                return DateUtils.formatDate(date, 'month', locale);
            case 'week':
                const weekStart = DateUtils.startOfWeek(date);
                const weekEnd = DateUtils.endOfWeek(date);
                return DateUtils.formatDateRange(weekStart, weekEnd, locale);
            case 'day':
                return DateUtils.formatDate(date, 'long', locale);
            case 'agenda':
                return 'Agenda';
            default:
                return DateUtils.formatDate(date, 'month', locale);
        }
    }

    getIcon(name) {
        const icons = {
            'chevron-left': `
                <svg class="fc-icon" viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
            `,
            'chevron-right': `
                <svg class="fc-icon" viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
            `,
            'calendar': `
                <svg class="fc-icon" viewBox="0 0 24 24">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
            `
        };

        return icons[name] || '';
    }

    // Public API methods
    addEvent(event) {
        return this.stateManager.addEvent(event);
    }

    updateEvent(eventId, updates) {
        return this.stateManager.updateEvent(eventId, updates);
    }

    deleteEvent(eventId) {
        return this.stateManager.deleteEvent(eventId);
    }

    getEvents() {
        return this.stateManager.getEvents();
    }

    setView(view) {
        this.stateManager.setView(view);
    }

    setDate(date) {
        this.stateManager.setDate(date);
    }

    next() {
        this.stateManager.next();
    }

    previous() {
        this.stateManager.previous();
    }

    today() {
        this.stateManager.today();
    }

    destroy() {
        if (this.stateManager) {
            this.stateManager.destroy();
        }
        eventBus.clear();
        super.cleanup();
    }
}

// Register component
customElements.define('force-calendar', ForceCalendar);