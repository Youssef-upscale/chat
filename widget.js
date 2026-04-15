(function () {
    'use strict';

    // ==========================================================================
    // 1. UTILS
    // ==========================================================================

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function getTimestamp() {
        return new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }

    function darkenHex(hex, amount = 25) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
        let [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
        r = Math.max(0, r - amount);
        g = Math.max(0, g - amount);
        b = Math.max(0, b - amount);
        return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    }

    function formatMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^### (.+)$/gm, '<strong>$1</strong>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/\n/g, '<br>');
    }

    async function fetchWithRetry(url, options, retries = 3, retryDelay = 1000) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res;
        } catch (err) {
            if (retries > 0) {
                await sleep(retryDelay);
                return fetchWithRetry(url, options, retries - 1, retryDelay);
            }
            throw err;
        }
    }

    function extractReply(data) {
        if (typeof data === 'string') return data;
        return (
            data?.response ||
            data?.text ||
            data?.output ||
            data?.message ||
            (Array.isArray(data) && (data[0]?.text || data[0]?.response)) ||
            JSON.stringify(data)
        );
    }

    // ==========================================================================
    // 2. CONFIG
    // ==========================================================================

    const scriptEl = document.currentScript || document.querySelector('script[data-backend-url]');
    const CONFIG = {
        backendUrl: scriptEl?.dataset.backendUrl || 'http://localhost:5678/webhook/chat',
        primaryColor: scriptEl?.dataset.primaryColor || '#6366f1',
        botName: scriptEl?.dataset.botName || 'Assistant',
        botAvatar: scriptEl?.dataset.botAvatar || '🤖',
        avatarBg: scriptEl?.dataset.avatarBg || '',
        suggestions: (() => {
            if (!scriptEl?.dataset.suggestions) return ['What are your features?', 'How can I get started?', 'Tell me more about pricing'];
            try { return JSON.parse(scriptEl.dataset.suggestions); }
            catch { return scriptEl.dataset.suggestions.split(',').map(s => s.trim()); }
        })(),
        footerText: scriptEl?.dataset.footerText || 'Powered by AI',
        welcomeMsg: scriptEl?.dataset.welcomeMsg || '👋 Hi there! How can I help you today?',
        position: scriptEl?.dataset.position || 'bottom-right',
        siteId: scriptEl?.dataset.siteId || 'default-site',
        maxRetries: 3,
        retryDelay: 1000,
    };

    const isUrl = (str) => /^(https?:\/\/|data:image\/|\/|\.\/)/.test(str);

    // ==========================================================================
    // 3. STORE (State Management)
    // ==========================================================================

    const state = {
        isOpen: false,
        isTyping: false,
        messageHistory: [],
        unreadCount: 0,
    };

    const listeners = [];
    function subscribe(fn) {
        listeners.push(fn);
        return () => {
            const idx = listeners.indexOf(fn);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }

    function setState(updates) {
        Object.assign(state, updates);
        listeners.forEach((fn) => fn(state));
    }

    function addMessageToHistory(role, content) {
        state.messageHistory.push({
            role,
            content,
            timestamp: new Date().toISOString(),
        });
    }

    // ==========================================================================
    // 4. STYLES (CSS-in-JS)
    // ==========================================================================

    function injectStyles() {
        const primaryDark = darkenHex(CONFIG.primaryColor, 25);
        const styleEl = document.createElement('style');
        styleEl.id = 'cw-styles';
        styleEl.textContent = `
      :root {
        --cw-primary: ${CONFIG.primaryColor};
        --cw-primary-dark: ${primaryDark};
        ${CONFIG.avatarBg ? `--cw-avatar-bg: ${CONFIG.avatarBg};` : ''}
      }
      #cw-toggle {
        position: fixed; width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(135deg, var(--cw-primary) 0%, var(--cw-primary-dark) 100%);
        border: none; cursor: pointer; z-index: 2147483646;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.06);
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #cw-toggle.cw-position-bottom-right { bottom: 24px; right: 24px; }
      #cw-toggle.cw-position-bottom-left { bottom: 24px; left: 24px; }
      #cw-toggle:hover { transform: scale(1.08); box-shadow: 0 25px 50px -12px color-mix(in srgb, var(--cw-primary) 50%, transparent); }
      #cw-toggle.cw-open { transform: rotate(45deg) scale(0.85); opacity: 0; pointer-events: none; }
      #cw-toggle svg { width: 28px; height: 28px; color: white; transition: all 0.3s; }
      #cw-badge {
        position: absolute; top: -2px; right: -2px; width: 18px; height: 18px;
        background: #ef4444; border-radius: 50%; border: 2px solid white;
        font-size: 10px; font-weight: 700; color: white; display: none;
        align-items: center; justify-content: center; font-family: sans-serif;
      }
      #cw-badge.cw-visible { display: flex; }
      #cw-container {
        position: fixed; width: 380px; max-width: calc(100vw - 48px);
        height: 600px; max-height: calc(100vh - 140px); background: #ffffff;
        border-radius: 20px; box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.2), 0 8px 20px -5px rgba(0, 0, 0, 0.1);
        display: flex; flex-direction: column; overflow: hidden; z-index: 2147483645;
        opacity: 0; transform: translateY(24px) scale(0.94); pointer-events: none;
        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #cw-container.cw-position-bottom-right { bottom: 100px; right: 24px; }
      #cw-container.cw-position-bottom-left { bottom: 100px; left: 24px; }
      #cw-container.cw-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
      #cw-header {
        background: linear-gradient(135deg, var(--cw-primary) 0%, var(--cw-primary-dark) 100%);
        padding: 18px 20px; color: white; display: flex; align-items: center; gap: 12px; flex-shrink: 0;
      }
      #cw-avatar {
        width: 42px; height: 42px; background: var(--cw-avatar-bg, rgba(255, 255, 255, 0.2)); border-radius: 50%;
        display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; overflow: hidden;
      }
      #cw-avatar img { width: 100%; height: 100%; object-fit: cover; }
      #cw-suggestions {
        display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 12px; margin-top: -4px;
      }
      .cw-suggestion-btn {
        background: white; border: 1px solid var(--cw-primary); color: var(--cw-primary);
        border-radius: 16px; padding: 6px 12px; font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: sans-serif;
      }
      .cw-suggestion-btn:hover {
        background: var(--cw-primary); color: white;
      }
      #cw-title-block { flex: 1; min-width: 0; }
      #cw-bot-name { font-size: 15px; font-weight: 600; margin: 0 0 3px; font-family: sans-serif; }
      #cw-status { font-size: 12px; opacity: 0.85; display: flex; align-items: center; gap: 6px; font-family: sans-serif; }
      #cw-status-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; animation: cw-pulse 2s infinite; }
      @keyframes cw-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      #cw-close {
        background: rgba(255, 255, 255, 0.12); border: none; width: 34px; height: 34px;
        border-radius: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: white; transition: background 0.2s; flex-shrink: 0;
      }
      #cw-messages {
        flex: 1; overflow-y: auto; padding: 18px 16px; display: flex; flex-direction: column;
        gap: 14px; background: #f8fafc; scroll-behavior: smooth;
      }
      .cw-message { max-width: 82%; animation: cw-slide-in 0.28s ease-out both; }
      @keyframes cw-slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .cw-message.cw-user { align-self: flex-end; }
      .cw-message.cw-bot { align-self: flex-start; }
      .cw-bubble { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.55; word-wrap: break-word; font-family: sans-serif; }
      .cw-message.cw-user .cw-bubble { background: var(--cw-primary); color: white; border-bottom-right-radius: 4px; }
      .cw-message.cw-bot .cw-bubble { background: white; color: #1f2937; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
      .cw-time { font-size: 11px; color: #9ca3af; margin-top: 5px; padding: 0 4px; font-family: sans-serif; }
      .cw-message.cw-user .cw-time { text-align: right; }
      #cw-typing {
        align-self: flex-start; background: white; padding: 14px 18px; border-radius: 18px;
        border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); display: none;
        gap: 5px; animation: cw-slide-in 0.28s ease-out both;
      }
      #cw-typing.cw-active { display: flex; }
      .cw-dot { width: 7px; height: 7px; background: #9ca3af; border-radius: 50%; animation: cw-bounce 1.4s infinite; }
      .cw-dot:nth-child(2) { animation-delay: 0.18s; }
      .cw-dot:nth-child(3) { animation-delay: 0.36s; }
      @keyframes cw-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-9px); } }
      #cw-input-area { background: white; padding: 14px 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; align-items: flex-end; flex-shrink: 0; }
      #cw-input {
        flex: 1; border: 1.5px solid #e5e7eb; border-radius: 22px; padding: 10px 16px;
        font-size: 14px; resize: none; max-height: 110px; min-height: 42px; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s; font-family: sans-serif; line-height: 1.5; background: #f9fafb; color: #1f2937;
      }
      #cw-input:focus { border-color: var(--cw-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--cw-primary) 15%, transparent); background: white; }
      #cw-send {
        width: 42px; height: 42px; border-radius: 50%; background: var(--cw-primary); border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center; color: white; transition: background 0.2s, transform 0.2s, opacity 0.2s; flex-shrink: 0;
      }
      #cw-send:hover:not(:disabled) { background: var(--cw-primary-dark); transform: scale(1.06); }
      #cw-send:disabled { opacity: 0.45; cursor: not-allowed; }
      #cw-footer { text-align: center; padding: 6px 0 10px; font-size: 11px; color: #c4c9d4; font-family: sans-serif; background: white; flex-shrink: 0; }
      @media (max-width: 480px) {
        #cw-container { right: 0 !important; left: 0 !important; bottom: 0 !important; width: 100% !important; max-width: 100% !important; height: 100% !important; max-height: 100% !important; border-radius: 0 !important; }
      }
    `;
        document.head.appendChild(styleEl);
    }

    // ==========================================================================
    // 5. COMPONENTS
    // ==========================================================================

    function createToggle() {
        const el = document.createElement('button');
        el.id = 'cw-toggle';
        el.className = `cw-position-${CONFIG.position}`;
        el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
      </svg>
      <span id="cw-badge" aria-hidden="true"></span>
    `;
        el.onclick = () => setState({ isOpen: !state.isOpen });
        subscribe((s) => {
            el.classList.toggle('cw-open', s.isOpen);
            const b = el.querySelector('#cw-badge');
            if (!s.isOpen && s.unreadCount > 0) {
                b.textContent = s.unreadCount > 9 ? '9+' : s.unreadCount;
                b.classList.add('cw-visible');
            } else {
                b.classList.remove('cw-visible');
                if (s.isOpen && s.unreadCount > 0) setState({ unreadCount: 0 });
            }
        });
        return el;
    }

    function createHeader() {
        const el = document.createElement('div');
        el.id = 'cw-header';
        el.innerHTML = `
      <div id="cw-avatar">${isUrl(CONFIG.botAvatar) ? `<img src="${CONFIG.botAvatar}" alt="Avatar">` : CONFIG.botAvatar}</div>
      <div id="cw-title-block">
        <p id="cw-bot-name">${CONFIG.botName}</p>
        <span id="cw-status"><span id="cw-status-dot"></span>Online now</span>
      </div>
      <button id="cw-close" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;
        el.querySelector('#cw-close').onclick = () => setState({ isOpen: false });
        return el;
    }

    function appendMessageDOM(container, typingEl, text, isUser) {
        const wrap = document.createElement('div');
        wrap.className = `cw-message ${isUser ? 'cw-user' : 'cw-bot'}`;
        const bubble = document.createElement('div');
        bubble.className = 'cw-bubble';
        if (isUser) bubble.textContent = text;
        else { bubble.classList.add('cw-bot-content'); bubble.innerHTML = formatMarkdown(text); }
        const time = document.createElement('div');
        time.className = 'cw-time'; time.textContent = getTimestamp();
        wrap.append(bubble, time);
        container.insertBefore(wrap, typingEl);
        container.scrollTop = container.scrollHeight;
        if (!state.isOpen && !isUser) setState({ unreadCount: state.unreadCount + 1 });
    }

    function createInput(onSend) {
        const el = document.createElement('div'); el.id = 'cw-input-area';
        el.innerHTML = `
      <textarea id="cw-input" placeholder="Type your message…" rows="1"></textarea>
      <button id="cw-send"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg></button>
    `;
        const input = el.querySelector('#cw-input');
        const btn = el.querySelector('#cw-send');
        const send = () => { const t = input.value.trim(); if (t && !state.isTyping) { input.value = ''; input.style.height = 'auto'; onSend(t); } };
        btn.onclick = send;
        input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
        input.oninput = function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 110) + 'px'; };
        subscribe((s) => { btn.disabled = s.isTyping; if (s.isOpen && !state.isOpen) setTimeout(() => input.focus(), 320); });
        return el;
    }

    function createSuggestions(onSend) {
        const el = document.createElement('div');
        el.id = 'cw-suggestions';
        if (!CONFIG.suggestions || CONFIG.suggestions.length === 0) return el;
        
        CONFIG.suggestions.forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'cw-suggestion-btn';
            btn.textContent = text;
            btn.onclick = () => {
                onSend(text);
                el.style.display = 'none';
            };
            el.appendChild(btn);
        });
        
        subscribe((s) => {
            if (s.messageHistory.length > 0) {
                el.style.display = 'none';
            }
        });
        
        return el;
    }

    // ==========================================================================
    // 6. MAIN INIT
    // ==========================================================================

    function init() {
        injectStyles();
        const toggle = createToggle();
        const container = document.createElement('div');
        container.id = 'cw-container'; container.className = `cw-position-${CONFIG.position}`;
        const header = createHeader();
        const messages = document.createElement('div'); messages.id = 'cw-messages';
        const typing = document.createElement('div'); typing.id = 'cw-typing';
        typing.innerHTML = '<span class="cw-dot"></span><span class="cw-dot"></span><span class="cw-dot"></span>';
        messages.append(typing);

        const handleSend = async (text) => {
            appendMessageDOM(messages, typing, text, true);
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
                });
                const data = await (res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text());
                const reply = extractReply(data);
                await sleep(Math.min(250 + reply.length * 7, 1600));
                appendMessageDOM(messages, typing, reply, false);
                addMessageToHistory('assistant', reply);
            } catch (e) {
                appendMessageDOM(messages, typing, "Sorry, I'm having trouble connecting. Please try again.", false);
            } finally { setState({ isTyping: false }); }
        };

        const input = createInput(handleSend);
        const suggestions = createSuggestions(handleSend);
        const footer = document.createElement('div'); footer.id = 'cw-footer'; footer.textContent = CONFIG.footerText;
        container.append(header, messages, suggestions, input, footer);
        document.body.append(toggle, container);

        subscribe((s) => {
            container.classList.toggle('cw-open', s.isOpen);
            typing.classList.toggle('cw-active', s.isTyping);
            if (s.isTyping) messages.scrollTop = messages.scrollHeight;
        });

        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.isOpen) setState({ isOpen: false }); });
        document.addEventListener('click', (e) => { if (state.isOpen && !container.contains(e.target) && !toggle.contains(e.target)) setState({ isOpen: false }); });

        setTimeout(() => appendMessageDOM(messages, typing, CONFIG.welcomeMsg, false), 400);

        window.ChatWidget = {
            open: () => setState({ isOpen: true }),
            close: () => setState({ isOpen: false }),
            toggle: () => setState({ isOpen: !state.isOpen }),
            send: (text) => { if (!state.isOpen) setState({ isOpen: true }); handleSend(text); },
            setColor: (c) => {
                document.documentElement.style.setProperty('--cw-primary', c);
                document.documentElement.style.setProperty('--cw-primary-dark', darkenHex(c, 25));
            },
            config: CONFIG
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();