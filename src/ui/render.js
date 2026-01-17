// UI rendering functions

import { formatUSD, formatDOP } from './format.js';

/**
 * Render calculation results into a DOM element
 * @param {HTMLElement} el - Target element to render into
 * @param {Object} options - Rendering options
 * @param {string} [options.title] - Optional title
 * @param {Array} [options.lineItems] - Array of { label, valueUSD, note? }
 * @param {number} [options.total] - Total amount to emphasize
 * @param {Array<string>} [options.warnings] - Array of warning messages
 * @param {string} [options.emptyState] - Message to show when no results
 * @param {string} [options.note] - Optional note to show below results
 * @param {Object} [options.summary] - Optional summary card data
 * @param {number} [options.summary.paidOnlineUSD]
 * @param {number} [options.summary.taxTotalUSD]
 * @param {number} [options.summary.taxDueUSD]
 * @param {number} [options.summary.fxRate]
 * @param {number} [options.summary.courierTypicalDOP]
 * @param {boolean} [options.summary.importFeesPaid]
 */
export function renderResults(el, { title, lineItems, total, totalLabel, warnings, emptyState, note, summary }) {
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

    // Summary card (optional)
    if (summary) {
        const { paidOnlineUSD, taxTotalUSD, taxDueUSD, fxRate, courierTypicalDOP, importFeesPaid } = summary;
        const hasPaidOnline = typeof paidOnlineUSD === 'number' && paidOnlineUSD > 0;
        const hasTaxes = typeof taxTotalUSD === 'number' && taxTotalUSD >= 0;
        const hasFx = typeof fxRate === 'number' && fxRate > 0;
        const hasCourier = typeof courierTypicalDOP === 'number' && courierTypicalDOP > 0;
        const dueUSD = typeof taxDueUSD === 'number' ? taxDueUSD : taxTotalUSD;

        if (hasPaidOnline || hasTaxes || hasCourier) {
            const card = document.createElement('div');
            card.className = 'p-4 bg-white border border-gray-200 rounded-lg space-y-3';

            const heading = document.createElement('div');
            heading.className = 'text-sm font-semibold text-gray-700';
            heading.textContent = 'Resumen';
            card.appendChild(heading);

            if (hasPaidOnline) {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between';
                const label = document.createElement('span');
                label.className = 'text-sm text-gray-600';
                label.textContent = 'Pagado online (USD)';
                const value = document.createElement('span');
                value.className = 'font-semibold text-gray-900';
                value.textContent = formatUSD(paidOnlineUSD);
                row.appendChild(label);
                row.appendChild(value);
                card.appendChild(row);
            }

            if (hasTaxes) {
                const row = document.createElement('div');
                row.className = 'flex items-center justify-between';
                const labelWrap = document.createElement('div');
                const label = document.createElement('span');
                label.className = 'text-sm text-gray-600';
                label.textContent = 'Impuestos de importación';
                labelWrap.appendChild(label);
                if (importFeesPaid) {
                    const badge = document.createElement('span');
                    badge.className = 'ml-2 inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-100 rounded-full';
                    badge.textContent = 'ya pagados';
                    labelWrap.appendChild(badge);
                }
                const value = document.createElement('div');
                value.className = 'text-sm font-semibold text-gray-900 text-right';
                value.textContent = formatUSD(taxTotalUSD);
                if (hasFx) {
                    const dop = document.createElement('div');
                    dop.className = 'text-xs text-gray-600';
                    dop.textContent = formatDOP(taxTotalUSD * fxRate);
                    value.appendChild(dop);
                }
                row.appendChild(labelWrap);
                row.appendChild(value);
                card.appendChild(row);
            }

            if (hasFx) {
                const row = document.createElement('div');
                row.className = 'flex items-start justify-between';
                const label = document.createElement('span');
                label.className = 'text-sm text-gray-600';
                label.textContent = 'Total al retirar (RD)';
                const valueWrap = document.createElement('div');
                valueWrap.className = 'text-sm font-semibold text-gray-900 text-right';
                if (hasCourier || (typeof dueUSD === 'number' && dueUSD >= 0)) {
                    const dueDOP = (typeof dueUSD === 'number' ? dueUSD : 0) * fxRate;
                    const courierDOP = hasCourier ? courierTypicalDOP : 0;
                    const totalDOP = dueDOP + courierDOP;
                    valueWrap.textContent = formatDOP(totalDOP);
                    if (hasCourier || dueDOP > 0) {
                        const breakdown = document.createElement('div');
                        breakdown.className = 'text-[11px] text-gray-600';
                        breakdown.textContent = `${hasCourier ? `Courier: ${formatDOP(courierDOP)}` : ''}${hasCourier && dueDOP > 0 ? ' · ' : ''}${dueDOP > 0 ? `Impuestos: ${formatDOP(dueDOP)}` : ''}`;
                        valueWrap.appendChild(breakdown);
                    }
                } else {
                    valueWrap.textContent = '—';
                }
                row.appendChild(label);
                row.appendChild(valueWrap);
                card.appendChild(row);
            } else if (hasCourier || (typeof dueUSD === 'number' && dueUSD > 0)) {
                const helper = document.createElement('div');
                helper.className = 'text-xs text-gray-600';
                helper.textContent = 'Ingresa la tasa USD→DOP para ver el total al retirar.';
                card.appendChild(helper);
            }

            container.appendChild(card);
        }
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

    if (note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'text-xs text-gray-500 mt-3';
        noteDiv.textContent = note;
        container.appendChild(noteDiv);
    }

    el.appendChild(container);
    
    // Smooth fade in
    setTimeout(() => { el.style.opacity = '1'; }, 50);
}
