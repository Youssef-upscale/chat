/**
 * @file Input.js
 * Textarea and send button.
 */
import { state, subscribe } from '../store.js';

export function createInput(onSend) {
    const el = document.createElement('div');
    el.id = 'cw-input-area';

    el.innerHTML = `
    <textarea
        id="cw-input"
        placeholder="Type your message…"
        rows="1"
        aria-label="Message input"
    ></textarea>
    <button id="cw-send" aria-label="Send message">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
        </svg>
    </button>
  `;

    const input = el.querySelector('#cw-input');
    const btn = el.querySelector('#cw-send');

    const handleSend = () => {
        const text = input.value.trim();
        if (!text || state.isTyping) return;

        input.value = '';
        input.style.height = 'auto'; // reset height
        onSend(text);
    };

    btn.addEventListener('click', handleSend);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 110) + 'px';
    });

    subscribe((s) => {
        btn.disabled = s.isTyping;
        if (s.isOpen && !state.isOpen) {
            // If transitioning to open, focus input soon
            setTimeout(() => input.focus(), 320);
        }
    });

    return el;
}
