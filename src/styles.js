/**
 * @file styles.js
 * Injects CSS into the document.
 */
import { CONFIG } from './config.js';
import { darkenHex } from './utils/helpers.js';

export function injectStyles() {
    const primaryDark = darkenHex(CONFIG.primaryColor, 25);

    const styleEl = document.createElement('style');
    styleEl.id = 'cw-styles';
    styleEl.textContent = `
    :root {
      --cw-primary: ${CONFIG.primaryColor};
      --cw-primary-dark: ${primaryDark};
    }

    #cw-toggle {
        position: fixed;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--cw-primary) 0%, var(--cw-primary-dark) 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 2147483646;
    }

    #cw-toggle.cw-position-bottom-right { bottom: 24px; right: 24px; }
    #cw-toggle.cw-position-bottom-left { bottom: 24px; left: 24px; }

    #cw-toggle:hover {
        transform: scale(1.08);
        box-shadow: 0 25px 50px -12px color-mix(in srgb, var(--cw-primary) 50%, transparent);
    }

    #cw-toggle.cw-open {
        transform: rotate(45deg) scale(0.85);
        opacity: 0;
        pointer-events: none;
    }

    #cw-toggle svg { width: 28px; height: 28px; color: white; transition: all 0.3s; }

    #cw-badge {
        position: absolute; top: -2px; right: -2px;
        width: 18px; height: 18px; background: #ef4444; border-radius: 50%;
        border: 2px solid white; font-size: 10px; font-weight: 700; color: white;
        display: none; align-items: center; justify-content: center; font-family: sans-serif;
    }
    #cw-badge.cw-visible { display: flex; }

    /* Container */
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

    /* Header */
    #cw-header {
        background: linear-gradient(135deg, var(--cw-primary) 0%, var(--cw-primary-dark) 100%);
        padding: 18px 20px; color: white; display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    #cw-avatar {
        width: 42px; height: 42px; background: rgba(255, 255, 255, 0.2); border-radius: 50%;
        display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
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
    #cw-close:hover { background: rgba(255, 255, 255, 0.25); }

    /* Messages */
    #cw-messages {
        flex: 1; overflow-y: auto; padding: 18px 16px; display: flex; flex-direction: column;
        gap: 14px; background: #f8fafc; scroll-behavior: smooth;
    }
    #cw-messages::-webkit-scrollbar { width: 5px; }
    #cw-messages::-webkit-scrollbar-track { background: transparent; }
    #cw-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

    .cw-message { max-width: 82%; animation: cw-slide-in 0.28s ease-out both; }
    @keyframes cw-slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .cw-message.cw-user { align-self: flex-end; }
    .cw-message.cw-bot { align-self: flex-start; }
    
    .cw-bubble { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.55; word-wrap: break-word; font-family: sans-serif; }
    .cw-message.cw-user .cw-bubble { background: var(--cw-primary); color: white; border-bottom-right-radius: 4px; }
    .cw-message.cw-bot .cw-bubble { background: white; color: #1f2937; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
    
    .cw-time { font-size: 11px; color: #9ca3af; margin-top: 5px; padding: 0 4px; font-family: sans-serif; }
    .cw-message.cw-user .cw-time { text-align: right; }

    .cw-bot-content p { margin: 4px 0; }
    .cw-bot-content strong { font-weight: 600; }
    .cw-bot-content em { font-style: italic; }
    .cw-bot-content ul, .cw-bot-content ol { margin: 8px 0; padding-left: 18px; }
    .cw-bot-content li { margin: 3px 0; }
    .cw-bot-content code { background: #f3f4f6; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    .cw-bot-content a { color: var(--cw-primary); text-decoration: none; }
    .cw-bot-content a:hover { text-decoration: underline; }

    /* Typing indicator */
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

    /* Input area */
    #cw-input-area { background: white; padding: 14px 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; align-items: flex-end; flex-shrink: 0; }
    #cw-input {
        flex: 1; border: 1.5px solid #e5e7eb; border-radius: 22px; padding: 10px 16px;
        font-size: 14px; resize: none; max-height: 110px; min-height: 42px; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s; font-family: sans-serif; line-height: 1.5; background: #f9fafb; color: #1f2937;
    }
    #cw-input:focus { border-color: var(--cw-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--cw-primary) 15%, transparent); background: white; }
    #cw-input::placeholder { color: #9ca3af; }
    
    #cw-send {
        width: 42px; height: 42px; border-radius: 50%; background: var(--cw-primary); border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center; color: white; transition: background 0.2s, transform 0.2s, opacity 0.2s; flex-shrink: 0;
    }
    #cw-send:hover:not(:disabled) { background: var(--cw-primary-dark); transform: scale(1.06); }
    #cw-send:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Footer */
    #cw-footer { text-align: center; padding: 6px 0 10px; font-size: 11px; color: #c4c9d4; font-family: sans-serif; background: white; flex-shrink: 0; }

    /* Mobile */
    @media (max-width: 480px) {
        #cw-container { right: 0 !important; left: 0 !important; bottom: 0 !important; width: 100% !important; max-width: 100% !important; height: 100% !important; max-height: 100% !important; border-radius: 0 !important; }
        #cw-toggle.cw-position-bottom-right { bottom: 16px; right: 16px; }
        #cw-toggle.cw-position-bottom-left { bottom: 16px; left: 16px; }
    }
  `;
    document.head.appendChild(styleEl);
}
