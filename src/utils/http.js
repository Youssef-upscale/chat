/**
 * @file http.js
 * Fetch handlers with retry logic.
 */

import { sleep } from './helpers.js';

export async function fetchWithRetry(url, options, retries = 3, retryDelay = 1000) {
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

/**
 * Flexible reply extraction
 */
export function extractReply(data) {
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
