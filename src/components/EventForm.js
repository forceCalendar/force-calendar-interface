import { BaseComponent } from '../core/BaseComponent.js';
import { StyleUtils } from '../utils/StyleUtils.js';

export class EventForm extends BaseComponent {
    constructor() {
        super();
        this._isVisible = false;
        this._formData = {
            title: '',
            start: new Date(),
            end: new Date(),
            allDay: false,
            color: '#2563EB'
        };
    }

    static get observedAttributes() {
        return ['open'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open') {
            if (newValue !== null) {
                this.open();
            } else {
                this.close();
            }
        }
    }

    getStyles() {
        return `
            ${StyleUtils.getBaseStyles()}
            ${StyleUtils.getButtonStyles()}

            :host {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: var(--fc-z-modal);
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(2px);
            }

            :host([open]) {
                display: flex;
            }

            .modal-content {
                background: var(--fc-background);
                width: 400px;
                max-width: 90vw;
                border-radius: var(--fc-border-radius-lg);
                box-shadow: var(--fc-shadow-lg);
                border: 1px solid var(--fc-border-color);
                display: flex;
                flex-direction: column;
                animation: fc-scale-in var(--fc-transition);
            }

            .modal-header {
                padding: var(--fc-spacing-lg);
                border-bottom: 1px solid var(--fc-border-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .modal-title {
                font-size: var(--fc-font-size-lg);
                font-weight: var(--fc-font-weight-semibold);
                color: var(--fc-text-color);
            }

            .close-btn {
                background: transparent;
                border: none;
                color: var(--fc-text-secondary);
                cursor: pointer;
                padding: 4px;
                border-radius: var(--fc-border-radius-sm);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-btn:hover {
                background: var(--fc-background-hover);
                color: var(--fc-text-color);
            }

            .modal-body {
                padding: var(--fc-spacing-lg);
                display: flex;
                flex-direction: column;
                gap: var(--fc-spacing-md);
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            label {
                font-size: var(--fc-font-size-sm);
                font-weight: var(--fc-font-weight-medium);
                color: var(--fc-text-secondary);
            }

            input[type="text"],
            input[type="datetime-local"],
            select {
                padding: 8px 12px;
                border: 1px solid var(--fc-border-color);
                border-radius: var(--fc-border-radius);
                font-family: var(--fc-font-family);
                font-size: var(--fc-font-size-base);
                color: var(--fc-text-color);
                background: var(--fc-background);
                transition: border-color var(--fc-transition-fast);
            }

            input:focus,
            select:focus {
                outline: none;
                border-color: var(--fc-primary-color);
                box-shadow: 0 0 0 2px var(--fc-primary-light);
            }

            .row {
                display: flex;
                gap: var(--fc-spacing-md);
            }
            
            .row .form-group {
                flex: 1;
            }

            .modal-footer {
                padding: var(--fc-spacing-lg);
                border-top: 1px solid var(--fc-border-color);
                display: flex;
                justify-content: flex-end;
                gap: var(--fc-spacing-md);
                background: var(--fc-background-alt);
                border-bottom-left-radius: var(--fc-border-radius-lg);
                border-bottom-right-radius: var(--fc-border-radius-lg);
            }

            /* Color picker style */
            .color-options {
                display: flex;
                gap: 8px;
                margin-top: 4px;
            }

            .color-option {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid transparent;
                transition: transform var(--fc-transition-fast);
            }

            .color-option:hover {
                transform: scale(1.1);
            }

            .color-option.selected {
                border-color: var(--fc-text-color);
            }
        `;
    }

    template() {
        return `
            <div class="modal-content">
                <header class="modal-header">
                    <h3 class="modal-title">New Event</h3>
                    <button class="close-btn" id="close-x">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                </header>
                
                <div class="modal-body">
                    <div class="form-group">
                        <label for="event-title">Title</label>
                        <input type="text" id="event-title" placeholder="Event name" autofocus>
                    </div>

                    <div class="row">
                        <div class="form-group">
                            <label for="event-start">Start</label>
                            <input type="datetime-local" id="event-start">
                        </div>
                        <div class="form-group">
                            <label for="event-end">End</label>
                            <input type="datetime-local" id="event-end">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Color</label>
                        <div class="color-options" id="color-picker">
                            <!-- Colors generated in afterRender -->
                        </div>
                    </div>
                </div>

                <footer class="modal-footer">
                    <button class="fc-btn fc-btn-secondary" id="cancel-btn">Cancel</button>
                    <button class="fc-btn fc-btn-primary" id="save-btn">Save Event</button>
                </footer>
            </div>
        `;
    }

    afterRender() {
        // Bind inputs
        this.titleInput = this.$('#event-title');
        this.startInput = this.$('#event-start');
        this.endInput = this.$('#event-end');
        this.colorContainer = this.$('#color-picker');

        // Setup colors
        const colors = [
            '#2563EB', // Blue
            '#10B981', // Green
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#8B5CF6', // Purple
            '#6B7280'  // Gray
        ];

        this.colorContainer.innerHTML = colors.map(color => `
            <div class="color-option ${color === this._formData.color ? 'selected' : ''}" 
                 style="background-color: ${color}" 
                 data-color="${color}"></div>
        `).join('');

        // Event Listeners
        this.$('#close-x').addEventListener('click', () => this.close());
        this.$('#cancel-btn').addEventListener('click', () => this.close());
        this.$('#save-btn').addEventListener('click', () => this.save());

        this.colorContainer.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                this._formData.color = e.target.dataset.color;
                this.renderColors();
            });
        });

        // Close on backdrop click
        this.addEventListener('click', (e) => {
            if (e.target === this) this.close();
        });
    }

    renderColors() {
        const options = this.colorContainer.querySelectorAll('.color-option');
        options.forEach(opt => {
            if (opt.dataset.color === this._formData.color) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }

    open(initialDate = new Date()) {
        this.setAttribute('open', '');
        this._formData.start = initialDate;
        this._formData.end = new Date(initialDate.getTime() + 60 * 60 * 1000); // +1 hour
        this._formData.title = '';
        
        // Update inputs
        if (this.startInput) {
            this.titleInput.value = '';
            this.startInput.value = this.formatDateForInput(this._formData.start);
            this.endInput.value = this.formatDateForInput(this._formData.end);
            this.titleInput.focus();
        }
    }

    close() {
        this.removeAttribute('open');
    }

    save() {
        const event = {
            title: this.titleInput.value || '(No Title)',
            start: new Date(this.startInput.value),
            end: new Date(this.endInput.value),
            backgroundColor: this._formData.color
        };

        this.emit('save', event);
        this.close();
    }

    formatDateForInput(date) {
        return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    }
}

if (!customElements.get('force-calendar-event-form')) {
    customElements.define('force-calendar-event-form', EventForm);
}
