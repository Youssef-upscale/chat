/**
 * @file helpers.js
 * Shared utility functions: timing, color manipulation, timestamps.
 */

/**
 * Returns a promise that resolves after `ms` milliseconds.
 * @param {number} ms
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Returns the current local time as a human-readable string (e.g. "2:45 PM").
 */
export function getTimestamp() {
    return new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Darkens a hex color by subtracting `amount` from each RGB channel.
 * @param {string} hex  - Input hex color (e.g. "#6366f1" or "#abc")
 * @param {number} amount - How much to darken (0–255), default 25
 * @returns {string} Darkened hex color
 */
export function darkenHex(hex, amount = 25) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    let [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Generates a unique, incrementing ID string with an optional prefix.
 */
let _idCounter = 0;
export function uid(prefix = 'cw') {
    return `${prefix}-${++_idCounter}`;
}
