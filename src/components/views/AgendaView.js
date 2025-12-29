/**
 * AgendaView - Placeholder for agenda/list view
 * TODO: Implement full agenda view
 */

import { BaseComponent } from '../../core/BaseComponent.js';

export class AgendaView extends BaseComponent {
    template() {
        return `
            <div style="padding: var(--fc-spacing-2xl); text-align: center; color: var(--fc-text-secondary);">
                <h3 style="margin-bottom: var(--fc-spacing-md); color: var(--fc-text-color);">Agenda View</h3>
                <p>Agenda view implementation coming soon...</p>
            </div>
        `;
    }
}

export default AgendaView;