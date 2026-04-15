/**
 * @file store.js
 * Simple state management for the widget.
 */

export const state = {
    isOpen: false,
    isTyping: false,
    messageHistory: [],
    unreadCount: 0,
};

const listeners = [];

export function subscribe(fn) {
    listeners.push(fn);
    return () => {
        const idx = listeners.indexOf(fn);
        if (idx > -1) listeners.splice(idx, 1);
    };
}

export function setState(updates) {
    Object.assign(state, updates);
    listeners.forEach((fn) => fn(state));
}

export function addMessageToHistory(role, content) {
    state.messageHistory.push({
        role,
        content,
        timestamp: new Date().toISOString(),
    });
}
