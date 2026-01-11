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
import { EventForm } from './EventForm.js'; // Import EventForm

// Register view components
if (!customElements.get('forcecal-month')) {
    customElements.define('forcecal-month', MonthView);
}
if (!customElements.get('forcecal-week')) {
    customElements.define('forcecal-week', WeekView);
}
if (!customElements.get('forcecal-day')) {
    customElements.define('forcecal-day', DayView);
}
// EventForm is self-registering in its file


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
        // Update local view reference if needed
        if (newState.view !== oldState?.view) {
            this.currentView = newState.view;
        }

        // Re-render to update header title, active buttons, and child view
        this.render();
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
        const height = this.getAttribute('height') || '800px';

        return `
            ${StyleUtils.getBaseStyles()}
            ${StyleUtils.getButtonStyles()}
            ${StyleUtils.getGridStyles()}
            ${StyleUtils.getAnimations()}

            :host {
                --calendar-height: ${height};
                display: block;
                font-family: var(--fc-font-family);
            }

            .force-calendar {
                display: flex;
                flex-direction: column;
                height: var(--calendar-height);
                background: var(--fc-background);
                border: 1px solid var(--fc-border-color);
                border-radius: var(--fc-border-radius-lg);
                overflow: hidden;
                box-shadow: var(--fc-shadow);
            }

            .fc-header {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                align-items: center;
                padding: var(--fc-spacing-md) var(--fc-spacing-lg);
                background: rgba(255, 255, 255, 0.95);
                -webkit-backdrop-filter: blur(8px); /* Safari support */
                backdrop-filter: blur(8px);
                border-bottom: 1px solid var(--fc-border-color);
                z-index: 10;
                position: sticky;
                top: 0;
            }

            .fc-header-left {
                display: flex;
                align-items: center;
                gap: var(--fc-spacing-md);
                justify-self: start;
                flex-basis: 0; /* Force Safari to distribute space */
            }

            .fc-header-center {
                display: flex;
                align-items: center;
                gap: var(--fc-spacing-lg);
                justify-self: center;
            }

            .fc-header-right {
                display: flex;
                align-items: center;
                gap: var(--fc-spacing-md);
                justify-self: end;
                flex-basis: 0; /* Force Safari to distribute space */
            }

            .fc-title {
                font-size: 14px;
                font-weight: var(--fc-font-weight-semibold);
                color: var(--fc-text-color);
                white-space: nowrap;
                letter-spacing: -0.01em;
                min-width: 140px;
                text-align: center;
            }

            .fc-btn-today {
                border-radius: var(--fc-border-radius-sm);
                padding: 0 12px;
                font-size: 12px;
                font-weight: var(--fc-font-weight-medium);
                border: 1px solid var(--fc-border-color);
                background: var(--fc-background);
                color: var(--fc-text-color);
                height: 28px;
                transition: all var(--fc-transition-fast);
                cursor: pointer;
                display: flex;
                align-items: center;
            }

            .fc-btn-today:hover {
                background: var(--fc-background-hover);
                border-color: var(--fc-border-color-hover);
            }

            .fc-nav-arrow {
                border: 1px solid var(--fc-border-color);
                background: var(--fc-background);
                height: 28px;
                width: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--fc-border-radius-sm);
                color: var(--fc-text-secondary);
                cursor: pointer;
                transition: all var(--fc-transition-fast);
                padding: 0;
            }

            .fc-nav-arrow:hover {
                background: var(--fc-background-hover);
                color: var(--fc-text-color);
                border-color: var(--fc-border-color-hover);
            }

            /* View Switcher - Fused Button Group */
            .fc-view-buttons {
                display: flex;
                border: 1px solid var(--fc-border-color);
                border-radius: var(--fc-border-radius-sm);
                overflow: hidden;
            }

            .fc-view-button {
                background: var(--fc-background);
                border: none;
                border-right: 1px solid var(--fc-border-color);
                color: var(--fc-text-secondary);
                padding: 0 12px;
                font-size: var(--fc-font-size-sm);
                font-weight: var(--fc-font-weight-medium);
                transition: background-color var(--fc-transition-fast);
                cursor: pointer;
                height: 28px;
                display: flex;
                align-items: center;
            }
            
            .fc-view-button:last-child {
                border-right: none;
            }

            .fc-view-button:hover:not(.active) {
                background: var(--fc-background-hover);
                color: var(--fc-text-color);
            }

            .fc-view-button.active {
                background: var(--fc-background-alt);
                color: var(--fc-text-color);
                font-weight: var(--fc-font-weight-semibold);
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            }

            .fc-body {
                flex: 1;
                position: relative;
                background: var(--fc-background);
                min-height: 0;
                display: flex;
                flex-direction: column;
            }

            .fc-view-container {
                flex: 1;
                position: relative;
                min-height: 0;
                display: flex;
                flex-direction: column;
            }

            /* Ensure view container has proper dimensions */
            #calendar-view-container {
                display: block;
                width: 100%;
                height: 100%;
                flex: 1;
            }

            #calendar-view-container > * {
                display: block;
                width: 100%;
                height: 100%;
            }

            /* Loading state */
            .fc-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--fc-spacing-md);
                color: var(--fc-text-secondary);
            }

            .fc-spinner {
                width: 24px;
                height: 24px;
                border: 3px solid var(--fc-border-color);
                border-top-color: var(--fc-primary-color);
                border-radius: 50%;
                animation: fc-spin 1s linear infinite;
            }

            /* Error state */
            .fc-error {
                padding: var(--fc-spacing-xl);
                text-align: center;
                color: var(--fc-danger-color);
                background: #FEF2F2;
                border-radius: var(--fc-border-radius);
                margin: var(--fc-spacing-xl);
            }

            /* Icons */
            .fc-icon {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }

            /* Responsive Adjustments */
            @media (max-width: 850px) {
                .fc-header {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: var(--fc-spacing-md);
                    height: auto;
                    position: static;
                    padding: var(--fc-spacing-md);
                }

                .fc-header-center {
                    order: -1;
                    text-align: center;
                    width: 100%;
                    padding: var(--fc-spacing-xs) 0;
                }

                .fc-header-left,
                .fc-header-right {
                    justify-content: space-between;
                    width: 100%;
                }

                #create-event-btn {
                    flex: 1;
                }
            }

            /* Month View Styles (inline rendering for Locker Service compatibility) */
            .fc-month-view {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--fc-background);
            }

            .fc-month-header {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                border-bottom: 1px solid var(--fc-border-color);
                background: var(--fc-background-alt);
            }

            .fc-month-header-cell {
                padding: 12px 8px;
                text-align: center;
                font-size: 11px;
                font-weight: 600;
                color: var(--fc-text-light);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .fc-month-body {
                display: flex;
                flex-direction: column;
                flex: 1;
            }

            .fc-month-week {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                flex: 1;
                min-height: 100px;
            }

            .fc-month-day {
                background: var(--fc-background);
                border-right: 1px solid var(--fc-border-color);
                border-bottom: 1px solid var(--fc-border-color);
                padding: 4px;
                min-height: 80px;
                cursor: pointer;
                transition: background-color 0.15s ease;
                display: flex;
                flex-direction: column;
            }

            .fc-month-day:hover {
                background: var(--fc-background-hover);
            }

            .fc-month-day:last-child {
                border-right: none;
            }

            .fc-month-day.other-month {
                background: var(--fc-background-alt);
            }

            .fc-month-day.other-month .fc-day-number {
                color: var(--fc-text-light);
            }

            .fc-month-day.today {
                background: rgba(37, 99, 235, 0.05);
            }

            .fc-month-day.today .fc-day-number {
                background: var(--fc-primary-color);
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .fc-day-number {
                font-size: 13px;
                font-weight: 500;
                color: var(--fc-text-color);
                padding: 2px 4px;
                margin-bottom: 4px;
            }

            .fc-day-events {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex: 1;
                overflow: hidden;
            }

            .fc-event {
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 3px;
                color: white;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                cursor: pointer;
                transition: transform 0.1s ease;
            }

            .fc-event:hover {
                transform: scale(1.02);
            }

            .fc-more-events {
                font-size: 10px;
                color: var(--fc-text-light);
                padding: 2px 4px;
                font-weight: 500;
            }

            /* Week View Styles (inline rendering for Locker Service compatibility) */
            .fc-week-view {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--fc-background);
            }

            /* Day View Styles (inline rendering for Locker Service compatibility) */
            .fc-day-view {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--fc-background);
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
                        <p><strong>Error:</strong> ${error.message || 'An error occurred'}</p>
                    </div>
                </div>
            `;
        }

        const title = this.getTitle(currentDate, view);

        return `
            <div class="force-calendar">
                <header class="fc-header">
                    <div class="fc-header-left">
                        <button class="fc-btn-today" data-action="today">
                            Today
                        </button>
                    </div>

                    <div class="fc-header-center">
                        <button class="fc-nav-arrow" data-action="previous" title="Previous">
                            ${this.getIcon('chevron-left')}
                        </button>
                        <h2 class="fc-title">${title}</h2>
                        <button class="fc-nav-arrow" data-action="next" title="Next">
                            ${this.getIcon('chevron-right')}
                        </button>
                    </div>

                    <div class="fc-header-right">
                        <button class="fc-btn fc-btn-primary" id="create-event-btn" style="height: 28px; padding: 0 12px; font-size: 12px;">
                            + New Event
                        </button>
                        <div class="fc-view-buttons" role="group">
                            <button class="fc-view-button ${view === 'month' ? 'active' : ''}"
                                    data-view="month">Month</button>
                            <button class="fc-view-button ${view === 'week' ? 'active' : ''}"
                                    data-view="week">Week</button>
                            <button class="fc-view-button ${view === 'day' ? 'active' : ''}"
                                    data-view="day">Day</button>
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
                
                <forcecal-event-form id="event-modal"></forcecal-event-form>
            </div>
        `;
    }

    renderView() {
        // Use a plain div container - we'll manually instantiate view classes
        // This bypasses Locker Service's custom element restrictions
        return '<div id="calendar-view-container"></div>';
    }

    afterRender() {
        // Manually instantiate and mount view component (bypasses Locker Service)
        const container = this.$('#calendar-view-container');
        console.log('[ForceCalendar] afterRender - container:', !!container, 'stateManager:', !!this.stateManager, 'currentView:', this.currentView);

        // Only create view once per view type change
        if (container && this.stateManager && this.currentView) {
            // Check if container actually has content (render() clears shadow DOM)
            if (this._currentViewInstance && this._currentViewInstance._viewType === this.currentView && container.children.length > 0) {
                console.log('[ForceCalendar] View already exists with content, skipping creation');
                return;
            }

            // Clean up previous view if exists
            if (this._currentViewInstance) {
                if (this._currentViewInstance.cleanup) {
                    this._currentViewInstance.cleanup();
                }
                if (this._viewUnsubscribe) {
                    this._viewUnsubscribe();
                    this._viewUnsubscribe = null;
                }
            }

            console.log('[ForceCalendar] Creating view for:', this.currentView);

            // Create a simple view renderer that doesn't use custom elements
            try {
                const viewRenderer = this._createViewRenderer(this.currentView);
                if (viewRenderer) {
                    viewRenderer._viewType = this.currentView;
                    this._currentViewInstance = viewRenderer;
                    viewRenderer.stateManager = this.stateManager;
                    viewRenderer.container = container;

                    console.log('[ForceCalendar] Calling viewRenderer.render()');
                    viewRenderer.render();
                    console.log('[ForceCalendar] viewRenderer.render() completed');

                    // Subscribe to state changes (store unsubscribe function)
                    this._viewUnsubscribe = this.stateManager.subscribe((newState, oldState) => {
                        // Only re-render on data changes, not view changes
                        if (newState.events !== oldState?.events ||
                            newState.currentDate !== oldState?.currentDate) {
                            if (viewRenderer && viewRenderer.render) {
                                viewRenderer.render();
                            }
                        }
                    });
                }
            } catch (err) {
                console.error('[ForceCalendar] Error creating/rendering view:', err);
            }
        }

        // Add event listeners for buttons using tracked addListener
        this.$$('[data-action]').forEach(button => {
            this.addListener(button, 'click', this.handleNavigation);
        });

        this.$$('[data-view]').forEach(button => {
            this.addListener(button, 'click', this.handleViewChange);
        });

        // Event Modal Handling
        const modal = this.$('#event-modal');
        const createBtn = this.$('#create-event-btn');

        if (createBtn && modal) {
            this.addListener(createBtn, 'click', () => {
                modal.open(new Date());
            });
        }

        // Listen for day clicks from the view
        this.addListener(this.shadowRoot, 'day-click', (e) => {
            if (modal) {
                modal.open(e.detail.date);
            }
        });

        // Handle event saving
        if (modal) {
            this.addListener(modal, 'save', (e) => {
                const eventData = e.detail;
                // Robust Safari support check for randomUUID
                const id = (window.crypto && typeof window.crypto.randomUUID === 'function')
                    ? window.crypto.randomUUID()
                    : Math.random().toString(36).substring(2, 15);

                this.stateManager.addEvent({
                    id,
                    ...eventData
                });
            });
        }
    }

    _createViewRenderer(viewName) {
        // Create a simple view renderer that bypasses custom elements
        // This is necessary for Salesforce Locker Service compatibility
        const self = this;

        return {
            stateManager: null,
            container: null,
            _listeners: [],

            cleanup() {
                this._listeners.forEach(({ element, event, handler }) => {
                    element.removeEventListener(event, handler);
                });
                this._listeners = [];
            },

            addListener(element, event, handler) {
                element.addEventListener(event, handler);
                this._listeners.push({ element, event, handler });
            },

            render() {
                console.log('[ViewRenderer] render called, container:', !!this.container, 'stateManager:', !!this.stateManager);
                if (!this.container || !this.stateManager) return;

                const viewData = this.stateManager.getViewData();
                console.log('[ViewRenderer] viewData:', viewData);
                console.log('[ViewRenderer] viewData.weeks:', viewData?.weeks);

                if (!viewData || !viewData.weeks) {
                    this.container.innerHTML = '<div style="padding: 20px; text-align: center; background: #fee; color: #c00;">No viewData.weeks available. viewData keys: ' + (viewData ? Object.keys(viewData).join(', ') : 'null') + '</div>';
                    return;
                }

                this.cleanup();
                const config = this.stateManager.getState().config;
                console.log('[ViewRenderer] Rendering month view with', viewData.weeks.length, 'weeks');
                const html = this._renderMonthView(viewData, config);
                console.log('[ViewRenderer] HTML length:', html.length);
                this.container.innerHTML = html;
                console.log('[ViewRenderer] innerHTML set, container children:', this.container.children.length);
                this._attachEventHandlers();
            },

            _renderMonthView(viewData, config) {
                const weekStartsOn = config.weekStartsOn || 0;
                const dayNames = [];
                for (let i = 0; i < 7; i++) {
                    const dayIndex = (weekStartsOn + i) % 7;
                    dayNames.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex]);
                }

                // Using inline styles for Locker Service compatibility
                let html = `
                    <div class="fc-month-view" style="display: flex; flex-direction: column; height: 100%; min-height: 400px; background: #fff; border: 1px solid #e5e7eb;">
                        <div class="fc-month-header" style="display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                            ${dayNames.map(d => `<div class="fc-month-header-cell" style="padding: 12px 8px; text-align: center; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${d}</div>`).join('')}
                        </div>
                        <div class="fc-month-body" style="display: flex; flex-direction: column; flex: 1;">
                `;

                viewData.weeks.forEach(week => {
                    html += '<div class="fc-month-week" style="display: grid; grid-template-columns: repeat(7, 1fr); flex: 1; min-height: 80px;">';
                    week.days.forEach(day => {
                        const isOtherMonth = !day.isCurrentMonth;
                        const isToday = day.isToday;

                        const dayBg = isOtherMonth ? '#f3f4f6' : '#fff';
                        const dayNumColor = isOtherMonth ? '#9ca3af' : '#111827';
                        const todayStyle = isToday ? 'background: #2563eb; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;' : '';

                        const events = day.events || [];
                        const visibleEvents = events.slice(0, 3);
                        const moreCount = events.length - 3;

                        html += `
                            <div class="fc-month-day" data-date="${day.date}" style="background: ${dayBg}; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 4px; min-height: 80px; cursor: pointer;">
                                <div class="fc-day-number" style="font-size: 13px; font-weight: 500; color: ${dayNumColor}; padding: 2px 4px; margin-bottom: 4px; ${todayStyle}">${day.dayOfMonth}</div>
                                <div class="fc-day-events" style="display: flex; flex-direction: column; gap: 2px;">
                                    ${visibleEvents.map(evt => `
                                        <div class="fc-event" data-event-id="${evt.id}" style="background-color: ${evt.backgroundColor || '#2563eb'}; font-size: 11px; padding: 2px 6px; border-radius: 3px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;">
                                            ${evt.title}
                                        </div>
                                    `).join('')}
                                    ${moreCount > 0 ? `<div class="fc-more-events" style="font-size: 10px; color: #6b7280; padding: 2px 4px; font-weight: 500;">+${moreCount} more</div>` : ''}
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                });

                html += '</div></div>';
                return html;
            },

            _attachEventHandlers() {
                const stateManager = this.stateManager;

                // Day click handlers
                this.container.querySelectorAll('.fc-month-day').forEach(dayEl => {
                    this.addListener(dayEl, 'click', (e) => {
                        const date = new Date(dayEl.dataset.date);
                        stateManager.selectDate(date);
                    });
                });

                // Event click handlers
                this.container.querySelectorAll('.fc-event').forEach(eventEl => {
                    this.addListener(eventEl, 'click', (e) => {
                        e.stopPropagation();
                        const eventId = eventEl.dataset.eventId;
                        const event = stateManager.getEvents().find(ev => ev.id === eventId);
                        if (event) {
                            stateManager.selectEvent(event);
                        }
                    });
                });
            }
        };
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
if (!customElements.get('forcecal-main')) {
    customElements.define('forcecal-main', ForceCalendar);
}