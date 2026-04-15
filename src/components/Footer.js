/**
 * @file Footer.js
 * Powered by footer.
 */
export function createFooter() {
    const el = document.createElement('div');
    el.id = 'cw-footer';
    el.textContent = 'Powered by AI';
    return el;
}
