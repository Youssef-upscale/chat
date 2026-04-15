/**
 * @file Header.js
 * The top bar of the chat widget.
 */
import { CONFIG } from '../config.js';
import { state, setState } from '../store.js';

export function createHeader() {
    const el = document.createElement('div');
    el.id = 'cw-header';

    el.innerHTML = `
    <div id="cw-avatar">${CONFIG.botAvatar}</div>
    <div id="cw-title-block">
        <p id="cw-bot-name">${CONFIG.botName}</p>
        <span id="cw-status">
            <span id="cw-status-dot"></span>
            Online now
        </span>
    </div>
    <button id="cw-close" aria-label="Close chat">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
    </button>
  `;

    el.querySelector('#cw-close').addEventListener('click', () => {
        setState({ isOpen: false });
    });

    return el;
}
