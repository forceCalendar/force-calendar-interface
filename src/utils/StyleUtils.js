/**
 * StyleUtils - Styling utilities and theme management
 */

export class StyleUtils {
    /**
     * Default theme colors
     */
    static colors = {
        primary: '#4285F4',
        secondary: '#34A853',
        accent: '#FBBC04',
        danger: '#EA4335',
        warning: '#FF9800',
        info: '#00BCD4',
        success: '#4CAF50',
        light: '#F5F5F5',
        dark: '#212121',
        gray: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121'
        }
    };

    /**
     * Common CSS variables
     */
    static cssVariables = {
        // Colors
        '--fc-primary-color': '#4285F4',
        '--fc-secondary-color': '#34A853',
        '--fc-accent-color': '#FBBC04',
        '--fc-danger-color': '#EA4335',
        '--fc-text-color': '#212121',
        '--fc-text-secondary': '#757575',
        '--fc-border-color': '#E0E0E0',
        '--fc-background': '#FFFFFF',
        '--fc-background-hover': '#F5F5F5',
        '--fc-background-active': '#EEEEEE',

        // Typography
        '--fc-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        '--fc-font-size-xs': '11px',
        '--fc-font-size-sm': '13px',
        '--fc-font-size-base': '14px',
        '--fc-font-size-lg': '16px',
        '--fc-font-size-xl': '18px',
        '--fc-font-size-2xl': '24px',
        '--fc-line-height': '1.5',

        // Spacing
        '--fc-spacing-xs': '4px',
        '--fc-spacing-sm': '8px',
        '--fc-spacing-md': '12px',
        '--fc-spacing-lg': '16px',
        '--fc-spacing-xl': '24px',
        '--fc-spacing-2xl': '32px',

        // Border
        '--fc-border-width': '1px',
        '--fc-border-radius': '4px',
        '--fc-border-radius-lg': '8px',

        // Shadows
        '--fc-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        '--fc-shadow': '0 1px 3px rgba(0, 0, 0, 0.1)',
        '--fc-shadow-lg': '0 4px 6px rgba(0, 0, 0, 0.1)',
        '--fc-shadow-xl': '0 10px 25px rgba(0, 0, 0, 0.15)',

        // Transitions
        '--fc-transition-fast': '150ms ease-in-out',
        '--fc-transition': '250ms ease-in-out',
        '--fc-transition-slow': '350ms ease-in-out',

        // Z-index
        '--fc-z-dropdown': '1000',
        '--fc-z-modal': '2000',
        '--fc-z-tooltip': '3000'
    };

    /**
     * Get CSS variable value
     */
    static getCSSVariable(name, element = document.documentElement) {
        return getComputedStyle(element).getPropertyValue(name).trim();
    }

    /**
     * Set CSS variables
     */
    static setCSSVariables(variables, element = document.documentElement) {
        Object.entries(variables).forEach(([key, value]) => {
            element.style.setProperty(key, value);
        });
    }

    /**
     * Generate base styles
     */
    static getBaseStyles() {
        return `
            :host {
                /* Apply CSS variables */
                ${Object.entries(this.cssVariables)
                    .map(([key, value]) => `${key}: ${value};`)
                    .join('\n                ')}

                /* Base styles */
                display: block;
                box-sizing: border-box;
                font-family: var(--fc-font-family);
                font-size: var(--fc-font-size-base);
                line-height: var(--fc-line-height);
                color: var(--fc-text-color);
            }

            *, *::before, *::after {
                box-sizing: inherit;
            }

            /* Reset styles */
            h1, h2, h3, h4, h5, h6, p {
                margin: 0;
                font-weight: normal;
            }

            button {
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
            }

            /* Accessibility */
            .visually-hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }

            /* Focus styles */
            :focus-visible {
                outline: 2px solid var(--fc-primary-color);
                outline-offset: 2px;
            }

            /* Scrollbar styles */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            ::-webkit-scrollbar-track {
                background: var(--fc-background);
            }

            ::-webkit-scrollbar-thumb {
                background: var(--fc-gray-400);
                border-radius: 4px;
            }

            ::-webkit-scrollbar-thumb:hover {
                background: var(--fc-gray-500);
            }
        `;
    }

    /**
     * Generate button styles
     */
    static getButtonStyles() {
        return `
            .fc-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: var(--fc-spacing-sm) var(--fc-spacing-lg);
                font-size: var(--fc-font-size-base);
                font-weight: 500;
                border-radius: var(--fc-border-radius);
                border: var(--fc-border-width) solid transparent;
                cursor: pointer;
                transition: all var(--fc-transition-fast);
                outline: none;
                user-select: none;
            }

            .fc-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .fc-btn-primary {
                background: var(--fc-primary-color);
                color: white;
            }

            .fc-btn-primary:hover:not(:disabled) {
                background: ${this.darken('#4285F4', 10)};
            }

            .fc-btn-secondary {
                background: var(--fc-secondary-color);
                color: white;
            }

            .fc-btn-outline {
                background: transparent;
                border-color: var(--fc-border-color);
                color: var(--fc-text-color);
            }

            .fc-btn-outline:hover:not(:disabled) {
                background: var(--fc-background-hover);
            }

            .fc-btn-ghost {
                background: transparent;
                color: var(--fc-text-color);
            }

            .fc-btn-ghost:hover:not(:disabled) {
                background: var(--fc-background-hover);
            }

            .fc-btn-sm {
                padding: var(--fc-spacing-xs) var(--fc-spacing-sm);
                font-size: var(--fc-font-size-sm);
            }

            .fc-btn-lg {
                padding: var(--fc-spacing-md) var(--fc-spacing-xl);
                font-size: var(--fc-font-size-lg);
            }

            .fc-btn-icon {
                width: 36px;
                height: 36px;
                padding: 0;
            }
        `;
    }

    /**
     * Darken color by percentage
     */
    static darken(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Lighten color by percentage
     */
    static lighten(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Get contrast color (black or white) for background
     */
    static getContrastColor(bgColor) {
        const color = bgColor.replace('#', '');
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? '#000000' : '#FFFFFF';
    }

    /**
     * Convert hex to rgba
     */
    static hexToRgba(hex, alpha = 1) {
        const color = hex.replace('#', '');
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Generate grid styles
     */
    static getGridStyles() {
        return `
            .fc-grid {
                display: grid;
                gap: var(--fc-border-width);
                background: var(--fc-border-color);
                border: var(--fc-border-width) solid var(--fc-border-color);
            }

            .fc-grid-cell {
                background: var(--fc-background);
                padding: var(--fc-spacing-sm);
                min-height: 80px;
                position: relative;
            }

            .fc-grid-cell:hover {
                background: var(--fc-background-hover);
            }

            .fc-grid-header {
                background: var(--fc-background-hover);
                padding: var(--fc-spacing-sm);
                font-weight: 600;
                text-align: center;
            }
        `;
    }

    /**
     * Get responsive breakpoints
     */
    static breakpoints = {
        xs: '320px',
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
        '2xl': '1400px'
    };

    /**
     * Generate media query
     */
    static mediaQuery(breakpoint, styles) {
        const size = this.breakpoints[breakpoint];
        if (!size) return '';
        return `@media (min-width: ${size}) { ${styles} }`;
    }

    /**
     * Animation keyframes
     */
    static getAnimations() {
        return `
            @keyframes fc-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes fc-slide-in-up {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes fc-slide-in-down {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes fc-scale-in {
                from {
                    opacity: 0;
                    transform: scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes fc-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .fc-fade-in {
                animation: fc-fade-in var(--fc-transition);
            }

            .fc-slide-in-up {
                animation: fc-slide-in-up var(--fc-transition);
            }

            .fc-scale-in {
                animation: fc-scale-in var(--fc-transition);
            }
        `;
    }
}

export default StyleUtils;