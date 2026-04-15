/**
 * @file config.js
 * Reads configuration from the `<script>` tag's data- attributes.
 */

function getScriptElement() {
    return document.currentScript || document.querySelector('script[data-backend-url]') || null;
}

export function loadConfig() {
    const el = getScriptElement();

    return {
        backendUrl: el?.dataset.backendUrl || 'http://localhost:5678/webhook/chat',
        primaryColor: el?.dataset.primaryColor || '#6366f1',
        botName: el?.dataset.botName || 'Assistant',
        botAvatar: el?.dataset.botAvatar || '🤖',
        headerTitle: el?.dataset.headerTitle || el?.dataset.botName || 'Assistant',
        headerColor: el?.dataset.headerColor || '',
        footerText: el?.dataset.footerText || 'Powered by AI',
        footerColor: el?.dataset.footerColor || '#c4c9d4',
        welcomeMsg: el?.dataset.welcomeMsg || '👋 Hi there! How can I help you today?',
        position: el?.dataset.position || 'bottom-right',
        siteId: el?.dataset.siteId || 'default-site',

        maxRetries: 3,
        retryDelay: 1000,
    };
}

export const CONFIG = loadConfig();
