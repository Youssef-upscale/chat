/**
 * @file main.js
 * The entry point for the Chat Widget.
 */
import { CONFIG } from './config.js';
import { injectStyles } from './styles.js';
import { state, subscribe, setState, addMessageToHistory } from './store.js';
import { fetchWithRetry, extractReply } from './utils/http.js';
import { sleep, darkenHex } from './utils/helpers.js';

import { createToggle } from './components/Toggle.js';
import { createHeader } from './components/Header.js';
import { createMessages, appendMessageDOM } from './components/Messages.js';
import { createInput } from './components/Input.js';
import { createFooter } from './components/Footer.js';

// ─── 1. Build & Assemble DOM ─────────────────────────────────────
function initDOM() {
    injectStyles();

    const toggle = createToggle();

    const container = document.createElement('div');
    container.id = 'cw-container';
    container.className = `cw-position-${CONFIG.position}`;
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-label', CONFIG.botName);

    const header = createHeader();
    const { el: messagesContainer, typingEl } = createMessages();

    // ─── Send Message Logic ──────────────────────────────────────────
    const handleSend = async (text) => {
        // 1. Add user message
        appendMessageDOM(messagesContainer, typingEl, text, true);
        addMessageToHistory('user', text);
        setState({ isTyping: true });

        try {
            const res = await fetchWithRetry(CONFIG.backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: state.messageHistory.slice(-10),
                    site: CONFIG.siteId,
                    pageUrl: window.location.href,
                    pageTitle: document.title,
                    timestamp: new Date().toISOString()
                })
            }, CONFIG.maxRetries, CONFIG.retryDelay);

            let data;
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                data = await res.json();
            } else {
                const raw = await res.text();
                try { data = JSON.parse(raw); } catch { data = raw; }
            }

            const reply = extractReply(data);
            await sleep(Math.min(250 + reply.length * 7, 1600));

            appendMessageDOM(messagesContainer, typingEl, reply, false);
            addMessageToHistory('assistant', reply);

        } catch (err) {
            console.error('[ChatWidget] Error:', err);
            appendMessageDOM(messagesContainer, typingEl, "Sorry, I'm having trouble connecting. Please try again in a moment.", false);
        } finally {
            setState({ isTyping: false });
        }
    };

    const inputArea = createInput(handleSend);
    const footer = createFooter();

    container.appendChild(header);
    container.appendChild(messagesContainer);
    container.appendChild(inputArea);
    container.appendChild(footer);

    document.body.appendChild(toggle);
    document.body.appendChild(container);

    // Subscribe container to open state
    subscribe((s) => {
        container.classList.toggle('cw-open', s.isOpen);
    });

    // Global event listeners (Escape, Outside click)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.isOpen) setState({ isOpen: false });
    });

    document.addEventListener('click', (e) => {
        if (state.isOpen && !container.contains(e.target) && !toggle.contains(e.target)) {
            setState({ isOpen: false });
        }
    });

    // Show welcome message
    setTimeout(() => {
        appendMessageDOM(messagesContainer, typingEl, CONFIG.welcomeMsg, false);
    }, 400);

    // Expose Public API
    exposeAPI({
        sendMessage: (text) => {
            const input = document.getElementById('cw-input');
            if (input) {
                if (!state.isOpen) setState({ isOpen: true });
                input.value = text;
                handleSend(text);
            }
        }
    });
}

// ─── 2. Public API ───────────────────────────────────────────────
function exposeAPI({ sendMessage }) {
    window.ChatWidget = {
        open: () => { if (!state.isOpen) setState({ isOpen: true }); },
        close: () => { if (state.isOpen) setState({ isOpen: false }); },
        toggle: () => setState({ isOpen: !state.isOpen }),
        send: sendMessage,
        setColor: (hex) => {
            CONFIG.primaryColor = hex;
            const varsEl = document.getElementById('cw-styles');
            if (varsEl) {
                // Update css vars directly
                document.documentElement.style.setProperty('--cw-primary', hex);
                document.documentElement.style.setProperty('--cw-primary-dark', darkenHex(hex, 25));
            }
        },
        config: CONFIG
    };
    console.log(`🤖 ChatWidget ready. Use ChatWidget.open() / .setColor('#hex') to control it.`);
}

// ─── 3. Initialization ───────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDOM);
} else {
    initDOM();
}
