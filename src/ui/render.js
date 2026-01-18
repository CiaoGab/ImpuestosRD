// UI rendering functions

import { formatUSD, formatDOP } from './format.js';

/**
 * Render calculation results into a DOM element
 * @param {HTMLElement} el - Target element to render into
 * @param {Object} options - Rendering options
 * @param {string} [options.title] - Optional title
 * @param {Array} [options.lineItems] - Array of { label, valueUSD, note? }
 * @param {number} [options.total] - Total amount to emphasize
 * @param {string} [options.totalLabel] - Label for total
 * @param {Array<string>} [options.warnings] - Array of warning messages
 * @param {string} [options.emptyState] - Message to show when no results
 * @param {string} [options.note] - Optional note to show below results
 * @param {Object} [options.summary] - Optional summary data
 * @param {Object} [options.courier] - Optional courier estimate data
 */
export function renderResults(el, { title, lineItems, total, totalLabel, warnings, emptyState, note, summary, courier }) {
    // Smooth transition
    el.style.opacity = '0.7';

    // Handle empty state
    if (emptyState && (!lineItems || lineItems.length === 0)) {
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
    container.className = 'space-y-4';

    if (title) {
        const titleEl = document.createElement('h3');
        titleEl.className = 'text-lg font-semibold text-gray-800';
        titleEl.textContent = title;
        container.appendChild(titleEl);
    }

    const summaryData = summary || {};
    const paidOnlineUSD = typeof summaryData.paidOnlineUSD === 'number' ? summaryData.paidOnlineUSD : null;
    const taxTotalUSD = typeof summaryData.taxTotalUSD === 'number' ? summaryData.taxTotalUSD : null;
    const taxDueUSD = typeof summaryData.taxDueUSD === 'number' ? summaryData.taxDueUSD : taxTotalUSD;
    const fxRate = typeof summaryData.fxRate === 'number' ? summaryData.fxRate : null;
    const courierTypicalDOP = typeof summaryData.courierTypicalDOP === 'number' ? summaryData.courierTypicalDOP : 0;
    const importFeesPaid = summaryData.importFeesPaid === true;
    const localTotalDOP = typeof summaryData.localTotalDOP === 'number'
        ? summaryData.localTotalDOP
        : (fxRate && fxRate > 0 ? (taxDueUSD || 0) * fxRate + (courierTypicalDOP || 0) : null);

    const disclaimerLine = 'Estimacion referencial. Consulta tu courier para montos exactos.';
    const disclaimer = document.createElement('div');
    disclaimer.className = 'rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm sm:text-base font-semibold text-yellow-900';
    disclaimer.textContent = disclaimerLine;
    container.appendChild(disclaimer);

    const hasTotal = typeof total === 'number' && Number.isFinite(total);
    const hasLocalTotal = fxRate && fxRate > 0 && localTotalDOP && localTotalDOP > 0;
    if (hasTotal || hasLocalTotal) {
        const totalBlock = document.createElement('div');
        totalBlock.className = 'pb-3 border-b border-gray-200';

        const label = document.createElement('div');
        label.className = 'text-xs text-gray-500';
        label.textContent = hasLocalTotal
            ? 'Total al retirar (DOP)'
            : (totalLabel && totalLabel.trim() !== '' ? totalLabel : 'Total');
        totalBlock.appendChild(label);

        const value = document.createElement('div');
        value.className = hasLocalTotal
            ? 'text-4xl sm:text-5xl font-bold text-blue-600'
            : 'text-2xl sm:text-3xl font-bold text-blue-600';
        value.textContent = hasLocalTotal ? formatDOP(localTotalDOP) : formatUSD(total);
        totalBlock.appendChild(value);

        if (hasLocalTotal && hasTotal) {
            const usdLine = document.createElement('div');
            usdLine.className = 'text-sm text-gray-600 mt-1';
            usdLine.textContent = `Total (USD): ${formatUSD(total)}`;
            totalBlock.appendChild(usdLine);
        }

        if (hasLocalTotal) {
            const breakdownParts = [];
            const taxDueDOP = taxDueUSD && fxRate ? taxDueUSD * fxRate : 0;
            if (courierTypicalDOP && courierTypicalDOP > 0) {
                breakdownParts.push(`Courier: ${formatDOP(courierTypicalDOP)}`);
            }
            if (taxDueDOP && taxDueDOP > 0) {
                breakdownParts.push(`Impuestos: ${formatDOP(taxDueDOP)}`);
            }
            if (breakdownParts.length > 0) {
                const breakdown = document.createElement('div');
                breakdown.className = 'text-[11px] text-gray-600';
                breakdown.textContent = breakdownParts.join(' | ');
                totalBlock.appendChild(breakdown);
            }
        }

        container.appendChild(totalBlock);
    }

    const hasSummary = paidOnlineUSD || taxTotalUSD !== null || (fxRate && fxRate > 0 && localTotalDOP && localTotalDOP > 0);
    if (hasSummary) {
        const summaryBlock = document.createElement('div');
        summaryBlock.className = 'space-y-2';

        if (paidOnlineUSD && paidOnlineUSD > 0) {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between text-sm';
            const label = document.createElement('span');
            label.className = 'text-gray-600';
            label.textContent = 'Pagado online (USD)';
            const value = document.createElement('span');
            value.className = 'font-semibold text-gray-900';
            value.textContent = formatUSD(paidOnlineUSD);
            row.appendChild(label);
            row.appendChild(value);
            summaryBlock.appendChild(row);
        }

        if (taxTotalUSD !== null) {
            const row = document.createElement('div');
            row.className = 'flex items-start justify-between text-sm';

            const labelWrap = document.createElement('div');
            const label = document.createElement('span');
            label.className = 'text-gray-600';
            label.textContent = 'Impuestos de importacion';
            labelWrap.appendChild(label);
            if (importFeesPaid) {
                const badge = document.createElement('span');
                badge.className = 'ml-2 inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-100 rounded-full';
                badge.textContent = 'ya pagados';
                labelWrap.appendChild(badge);
            }

            const value = document.createElement('div');
            value.className = 'text-right font-semibold text-gray-900';
            value.textContent = formatUSD(taxTotalUSD);
            if (fxRate && fxRate > 0) {
                const dop = document.createElement('div');
                dop.className = 'text-xs text-gray-600';
                dop.textContent = formatDOP(taxTotalUSD * fxRate);
                value.appendChild(dop);
            }

            row.appendChild(labelWrap);
            row.appendChild(value);
            summaryBlock.appendChild(row);
        }

        if ((courierTypicalDOP > 0 || (taxTotalUSD && taxTotalUSD > 0)) && (!fxRate || fxRate <= 0)) {
            const helper = document.createElement('div');
            helper.className = 'text-xs text-gray-600';
            helper.textContent = 'Ingresa la tasa USD a DOP para ver el total local.';
            summaryBlock.appendChild(helper);
        }

        container.appendChild(summaryBlock);
    }

    if (lineItems && lineItems.length > 0) {
        const lineItemsContainer = document.createElement('div');
        lineItemsContainer.className = 'divide-y divide-gray-200';

        lineItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex justify-between items-start py-2';

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

    if (courier) {
        const details = document.createElement('details');
        details.className = 'rounded-md border border-gray-200 bg-white p-3';

        const summaryEl = document.createElement('summary');
        summaryEl.className = 'cursor-pointer text-sm text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1';
        summaryEl.textContent = 'Estimacion de courier';
        details.appendChild(summaryEl);

        const body = document.createElement('div');
        body.className = 'mt-2 space-y-2 text-sm text-gray-600';

        if (!courier.hasWeight) {
            const empty = document.createElement('p');
            empty.textContent = 'Ingresa el peso para estimar los gastos de courier.';
            body.appendChild(empty);
        } else if (!courier.hasEstimate) {
            const empty = document.createElement('p');
            empty.textContent = 'No hay datos suficientes para estimar el courier.';
            body.appendChild(empty);
        } else {
            if (courier.fxRate && courier.fxRate > 0 && courier.typicalDOP && courier.typicalDOP > 0) {
                const typical = document.createElement('div');
                typical.className = 'text-lg font-semibold text-blue-600';
                typical.textContent = formatDOP(courier.typicalDOP);
                body.appendChild(typical);
            } else {
                const helper = document.createElement('p');
                helper.textContent = 'Ingresa la tasa USD a DOP para ver el estimado local.';
                body.appendChild(helper);
            }

            if (courier.isCustom && typeof courier.billedWeight === 'number') {
                const billed = document.createElement('p');
                billed.textContent = `Peso facturable aplicado: ${courier.billedWeight.toFixed(2)} lb.`;
                body.appendChild(billed);
            }

            if (!courier.isCustom && courier.minDOP !== null && courier.maxDOP !== null && courier.minDOP !== courier.maxDOP) {
                const range = document.createElement('p');
                range.textContent = `Rango: ${formatDOP(courier.minDOP)} - ${formatDOP(courier.maxDOP)}`;
                body.appendChild(range);
            }

            const include = document.createElement('p');
            include.textContent = 'Incluye flete estimado por libra.';
            body.appendChild(include);
        }

        details.appendChild(body);
        container.appendChild(details);
    }

    if (note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'text-xs text-gray-500';
        noteDiv.textContent = note;
        container.appendChild(noteDiv);
    }

    el.appendChild(container);

    // Smooth fade in
    setTimeout(() => { el.style.opacity = '1'; }, 50);
}
