/**
 * @file Messages.js
 * The message list container.
 */
import { formatMarkdown } from '../utils/markdown.js';
import { getTimestamp } from '../utils/helpers.js';
import { state, subscribe, setState } from '../store.js';

export function createMessages() {
    const el = document.createElement('div');
    el.id = 'cw-messages';
    el.setAttribute('role', 'log');
    el.setAttribute('aria-live', 'polite');

    // Typing indicator is permanently at the bottom
    const typingEl = document.createElement('div');
    typingEl.id = 'cw-typing';
    typingEl.innerHTML = `
    <span class="cw-dot"></span>
    <span class="cw-dot"></span>
    <span class="cw-dot"></span>
  `;
    el.appendChild(typingEl);

    subscribe((s) => {
        typingEl.classList.toggle('cw-active', s.isTyping);
        if (s.isTyping) {
            el.scrollTop = el.scrollHeight;
        }
    });

    return { el, typingEl };
}

export function appendMessageDOM(messagesContainer, typingIndicator, text, isUser) {
    const wrap = document.createElement('div');
    wrap.className = `cw-message ${isUser ? 'cw-user' : 'cw-bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'cw-bubble';

    if (isUser) {
        bubble.textContent = text;
    } else {
        bubble.classList.add('cw-bot-content');
        bubble.innerHTML = formatMarkdown(text);
    }

    const time = document.createElement('div');
    time.className = 'cw-time';
    time.textContent = getTimestamp();

    wrap.appendChild(bubble);
    wrap.appendChild(time);

    messagesContainer.insertBefore(wrap, typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Update unread if not open
    if (!state.isOpen && !isUser) {
        setState({ unreadCount: state.unreadCount + 1 });
    }
}
