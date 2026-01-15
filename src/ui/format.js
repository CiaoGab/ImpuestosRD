// Formatting utilities

/**
 * Format number as USD currency string
 * @param {number} n - Number to format
 * @returns {string} Formatted string like "US$ 123.45"
 */
export function formatUSD(n) {
    if (isNaN(n) || n === null || n === undefined) {
        return 'US$ 0.00';
    }
    // Handle extremely large numbers
    if (n > 999999999) {
        return 'US$ 999,999,999.00+';
    }
    // Format with commas for readability
    const parts = n.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `US$ ${parts.join('.')}`;
}

/**
 * Format number to 2 decimal places
 * @param {number} n - Number to format
 * @returns {string} Formatted string like "123.45"
 */
export function formatNumber(n) {
    if (isNaN(n) || n === null || n === undefined) {
        return '0.00';
    }
    return n.toFixed(2);
}

/**
 * Format number as DOP currency string
 * @param {number} n - Number to format
 * @returns {string} Formatted string like "RD$ 1,234.56"
 */
export function formatDOP(n) {
    if (isNaN(n) || n === null || n === undefined) {
        return 'RD$ 0.00';
    }
    // Handle extremely large numbers
    if (n > 999999999) {
        return 'RD$ 999,999,999.00+';
    }
    // Format with commas for readability
    const parts = n.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `RD$ ${parts.join('.')}`;
}