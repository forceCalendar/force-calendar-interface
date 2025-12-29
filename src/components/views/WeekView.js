/**
 * WeekView - Placeholder for week view
 * TODO: Implement full week view
 */

import { BaseComponent } from '../../core/BaseComponent.js';

export class WeekView extends BaseComponent {
    template() {
        return `
            <div style="padding: var(--fc-spacing-2xl); text-align: center; color: var(--fc-text-secondary);">
                <h3 style="margin-bottom: var(--fc-spacing-md); color: var(--fc-text-color);">Week View</h3>
                <p>Week view implementation coming soon...</p>
            </div>
        `;
    }
}

export default WeekView;