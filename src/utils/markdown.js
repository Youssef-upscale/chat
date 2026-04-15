/**
 * @file markdown.js
 * Very basic, lightweight markdown string to HTML converter.
 */

/**
 * Strips HTML tags or encodes to prevent basic XSS and parses markdown syntax
 * @param {string} text - Raw Markdown text
 * @returns {string} - Rendered HTML
 */
export function formatMarkdown(text) {
    if (!text) return '';
    return text
        // 1. Defang basic HTML/XSS
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

        // 2. Syntax replacements
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^### (.+)$/gm, '<strong>$1</strong>')

        // Lists (- item)
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')

        // Links [text](url)
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

        // Newlines to <br>
        .replace(/\n/g, '<br>');
}
