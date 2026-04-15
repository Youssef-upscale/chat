/**
 * @file Toggle.js
 * The floating launcher button.
 */
import { CONFIG } from '../config.js';
import { state, subscribe, setState } from '../store.js';

export function createToggle() {
    const el = document.createElement('button');
    el.id = 'cw-toggle';
    el.className = `cw-position-${CONFIG.position}`;
    el.setAttribute('aria-label', 'Open chat');

    el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
    </svg>
    <span id="cw-badge" aria-hidden="true"></span>
  `;

    el.addEventListener('click', () => {
        setState({ isOpen: !state.isOpen });
    });

    subscribe((s) => {
        el.classList.toggle('cw-open', s.isOpen);

        // Update badge
        const badge = el.querySelector('#cw-badge');
        if (!s.isOpen && s.unreadCount > 0) {
            badge.textContent = s.unreadCount > 9 ? '9+' : s.unreadCount;
            badge.classList.add('cw-visible');
        } else {
            badge.classList.remove('cw-visible');
            if (s.isOpen && s.unreadCount > 0) {
                setState({ unreadCount: 0 }); // clear on open
            }
        }
    });

    return el;
}
