/**
 * DayView - Placeholder for day view
 * TODO: Implement full day view
 */

import { BaseComponent } from '../../core/BaseComponent.js';

export class DayView extends BaseComponent {
    template() {
        return `
            <div style="padding: var(--fc-spacing-2xl); text-align: center; color: var(--fc-text-secondary);">
                <h3 style="margin-bottom: var(--fc-spacing-md); color: var(--fc-text-color);">Day View</h3>
                <p>Day view implementation coming soon...</p>
            </div>
        `;
    }
}

export default DayView;