// UI rendering functions

import { formatUSD } from './format.js';

/**
 * Render calculation results into a DOM element
 * @param {HTMLElement} el - Target element to render into
 * @param {Object} options - Rendering options
 * @param {string} [options.title] - Optional title
 * @param {Array} [options.lineItems] - Array of { label, valueUSD, note? }
 * @param {number} [options.total] - Total amount to emphasize
 * @param {Array<string>} [options.warnings] - Array of warning messages
 * @param {string} [options.emptyState] - Message to show when no results
 */
// Escape HTML to prevent XSS (simple version for numeric/known-safe content)
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

export function renderResults(el, { title, lineItems, total, totalLabel, warnings, emptyState }) {
    // Smooth transition
    el.style.opacity = '0.7';
    
    // Handle empty state
    if (emptyState && (!lineItems || lineItems.length === 0)) {
        // Use textContent for empty state (safer)
        el.textContent = '';
        const p = document.createElement('p');
        p.className = 'text-gray-500 text-center';
        p.textContent = emptyState;
        el.appendChild(p);
        setTimeout(() => { el.style.opacity = '1'; }, 50);
        return;
    }

    // Clear existing content
    el.textContent = '';
    const container = document.createElement('div');
    container.className = 'space-y-3';

    // Title (optional)
    if (title) {
        const titleEl = document.createElement('h3');
        titleEl.className = 'text-lg font-semibold text-gray-800 mb-3';
        titleEl.textContent = title;
        container.appendChild(titleEl);
    }

    // Warnings
    if (warnings && warnings.length > 0) {
        warnings.forEach(warning => {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded';
            const warningP = document.createElement('p');
            warningP.className = 'text-sm text-yellow-800';
            warningP.textContent = `⚠️ ${warning}`;
            warningDiv.appendChild(warningP);
            container.appendChild(warningDiv);
        });
    }

    // Line items
    if (lineItems && lineItems.length > 0) {
        const lineItemsContainer = document.createElement('div');
        lineItemsContainer.className = 'space-y-2';
        
        lineItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex justify-between items-start py-2 border-b border-gray-200';
            
            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex-1 pr-4';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'font-medium text-gray-700';
            labelDiv.textContent = item.label;
            leftDiv.appendChild(labelDiv);
            
            if (item.note) {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'text-xs text-gray-500 mt-1';
                noteDiv.textContent = item.note;
                leftDiv.appendChild(noteDiv);
            }
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'text-gray-900 font-semibold whitespace-nowrap break-words';
            valueDiv.textContent = formatUSD(item.valueUSD);
            
            itemDiv.appendChild(leftDiv);
            itemDiv.appendChild(valueDiv);
            lineItemsContainer.appendChild(itemDiv);
        });
        
        container.appendChild(lineItemsContainer);
    }

    // Total (emphasized)
    if (total !== undefined && total !== null) {
        const totalDiv = document.createElement('div');
        totalDiv.className = 'flex justify-between items-center pt-4 mt-4 border-t-2 border-gray-300';
        
        const totalLabelEl = document.createElement('div');
        totalLabelEl.className = 'text-lg font-bold text-gray-900';
        totalLabelEl.textContent = totalLabel && totalLabel.trim() !== '' ? totalLabel : 'Total';
        
        const totalValue = document.createElement('div');
        totalValue.className = 'text-xl font-bold text-blue-600 break-words';
        totalValue.textContent = formatUSD(total);
        
        totalDiv.appendChild(totalLabelEl);
        totalDiv.appendChild(totalValue);
        container.appendChild(totalDiv);
    }

    el.appendChild(container);
    
    // Smooth fade in
    setTimeout(() => { el.style.opacity = '1'; }, 50);
}
