console.log("ImpuestosRD loaded");

import { calcUnder200, calcOver200 } from './calc/do.js';
import { calcCourierFees, toLb } from './calc/courier-do.js';
import { formatUSD, formatDOP } from './ui/format.js';
import { renderResults } from './ui/render.js';
import { SOURCES_DO } from './data/sources-do.js';
import { COURIERS_DO } from './data/couriers-do.js';

// Configuration
// STRIPE_PAYMENT_LINK_URL: Set your Stripe Payment Link here.
// Remember to configure the Stripe Payment Link success redirect URL to /gracias.html
const STRIPE_PAYMENT_LINK_URL = '<PUT_STRIPE_PAYMENT_LINK_HERE>';
const CONTACT_EMAIL = 'vallejo.juangabriel@gmail.com';
const SHOW_SUPPORT = false; // Feature flag for support section
const SHOW_COURIERS_DIRECTORY = false; // Feature flag for courier directory
const SHOW_COURIER_BREAKDOWN = false; // Future flag to re-enable courier breakdown UI
const DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debug') === '1';

// Courier data
const COURIER_CARDS = [
    {
        name: 'Courier 1',
        bullets: [
            'Envíos rápidos y confiables',
            'Tarifas competitivas',
            'Seguimiento en tiempo real'
        ],
        url: 'https://example.com/courier1'
    },
    {
        name: 'Courier 2',
        bullets: [
            'Atención al cliente 24/7',
            'Cobertura nacional',
            'Seguro incluido'
        ],
        url: 'https://example.com/courier2'
    },
    {
        name: 'Courier 3',
        bullets: [
            'Descuentos para clientes frecuentes',
            'Múltiples opciones de entrega',
            'App móvil disponible'
        ],
        url: 'https://example.com/courier3'
    }
];

// State management
const state = {
    mode: 'under200', // 'under200' or 'over200' - auto-determined by value, can be overridden
    unit: 'lb', // 'lb' or 'kg'
    manualModeOverride: false, // If true, mode is manually set and won't auto-switch
    fxRate: 58.50, // Default USD to DOP rate
    isInterior: false, // Interior delivery flag
    customRate: null, // Custom rate in USD/lb (null = use market estimate)
    customWeightRule: 'ceil', // 'ceil' | 'exact' | 'min1'
    importFeesPaid: false // If true, import taxes already paid at checkout
};

// DOM elements
const elements = {
    advancedToggle: document.getElementById('advanced-toggle'),
    modeToggleContainer: document.getElementById('mode-toggle-container'),
    modeUnder200: document.getElementById('mode-under200'),
    modeOver200: document.getElementById('mode-over200'),
    modeHelperText: document.getElementById('mode-helper-text'),
    modeDebug: document.getElementById('mode-debug'),
    unitLb: document.getElementById('unit-lb'),
    unitKg: document.getElementById('unit-kg'),
    weightContainer: document.getElementById('weight-container'),
    weightDetails: document.getElementById('weight-details'),
    weightSummary: document.getElementById('weight-summary'),
    shippingContainer: document.getElementById('shipping-container'),
    tariffContainer: document.getElementById('tariff-container'),
    tariffCategory: document.getElementById('input-tariff-category'),
    tariffCategoryNote: document.getElementById('tariff-category-note'),
    inputValue: document.getElementById('input-value'),
    inputStoreShipping: document.getElementById('input-store-shipping'),
    inputCheckoutTax: document.getElementById('input-checkout-tax'),
    paidOnlineSummary: document.getElementById('paid-online-summary'),
    paidOnlineTotal: document.getElementById('paid-online-total'),
    inputWeight: document.getElementById('input-weight'),
    inputShipping: document.getElementById('input-shipping'),
    inputTariff: document.getElementById('input-tariff'),
    inputSelectivo: document.getElementById('input-selectivo'),
    inputImportFeesPaid: document.getElementById('input-import-fees-paid'),
    results: document.getElementById('results'),
    shareBtn: document.getElementById('share-btn'),
    shareToast: document.getElementById('share-toast'),
    feedbackLinkPrimary: document.getElementById('feedback-link-primary'),
    supportSection: document.getElementById('support-section'),
    supportBtnPrimary: document.getElementById('support-btn-primary'),
    footerSupportLink: document.getElementById('footer-support-link'),
    footerFeedbackLink: document.getElementById('footer-feedback-link'),
    stickyTotalBar: document.getElementById('sticky-total-bar'),
    stickyTotalValue: document.getElementById('sticky-total-value'),
    stickyShareBtn: document.getElementById('sticky-share-btn'),
    emailModal: document.getElementById('email-modal'),
    emailModalTitle: document.getElementById('email-modal-title'),
    emailClose: document.getElementById('email-close'),
    emailCancel: document.getElementById('email-cancel'),
    emailSend: document.getElementById('email-send'),
    emailFrom: document.getElementById('email-from'),
    emailSubject: document.getElementById('email-subject'),
    emailBody: document.getElementById('email-body'),
    couriersSection: document.getElementById('couriers-section'),
    courierCards: document.getElementById('courier-cards'),
    sourcesList: document.getElementById('sources-list'),
    courierSection: document.getElementById('courier-section'),
    inputFxRate: document.getElementById('input-fx-rate'),
    inputInterior: document.getElementById('input-interior'),
    inputCustomRate: document.getElementById('input-custom-rate'),
    inputCustomWeightRule: document.getElementById('input-custom-weight-rule'),
    interiorNote: document.getElementById('interior-note'),
    courierResults: document.getElementById('courier-results')
};

// Input bounds constants
const INPUT_BOUNDS = {
    value: { min: 0, max: 100000 },
    storeShipping: { min: 0, max: 10000 },
    checkoutTax: { min: 0, max: 10000 },
    weight: { min: 0, max: 500 },
    shipping: { min: 0, max: 10000 },
    tariff: { min: 0, max: 50 },
    selectivo: { min: 0, max: 50 }
};

// Get input value as number (treat empty as 0, clamp to bounds)
function getInputValue(element, bounds = null) {
    const value = parseFloat(element.value);
    if (isNaN(value)) {
        return 0;
    }
    // Clamp negative values to 0
    let clamped = Math.max(0, value);
    // Apply bounds if provided
    if (bounds) {
        clamped = Math.max(bounds.min, Math.min(bounds.max, clamped));
    }
    return clamped;
}

// Validate and clamp input value on change
function validateInput(element, bounds = null) {
    const value = parseFloat(element.value);
    if (isNaN(value) || value < 0) {
        element.value = '';
        return;
    }
    // Apply bounds if provided
    if (bounds) {
        const clamped = Math.max(bounds.min, Math.min(bounds.max, value));
        if (clamped !== value) {
            element.value = clamped;
        }
    }
    // Format to prevent extremely long decimals
    if (element.value.includes('.')) {
        const parts = element.value.split('.');
        if (parts[1] && parts[1].length > 2) {
            element.value = parseFloat(element.value).toFixed(2);
        }
    }
}

// Auto-determine mode based on value
function determineMode(valueUSD) {
    if (state.manualModeOverride) {
        return state.mode; // Keep current mode if manually overridden
    }
    return valueUSD >= 200 ? 'over200' : 'under200';
}

// Calculate billed weight for custom rate
function getCustomBilledWeight(weightLb, rule) {
    if (weightLb <= 0) return 0;
    switch (rule) {
        case 'min1':
            return Math.max(1, Math.ceil(weightLb));
        case 'exact':
            return weightLb;
        case 'ceil':
        default:
            return Math.ceil(weightLb);
    }
}

// Check if share button should be enabled
function shouldEnableShare() {
    if (state.mode === 'under200') {
        const weight = getInputValue(elements.inputWeight);
        return weight > 0;
    } else {
        const valueUSD = getInputValue(elements.inputValue);
        return valueUSD > 0;
    }
}

// Update share button state
function updateShareButton() {
    const enabled = shouldEnableShare();
    if (enabled) {
        elements.shareBtn.disabled = false;
        elements.shareBtn.className = 'w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
    } else {
        elements.shareBtn.disabled = true;
        elements.shareBtn.className = 'w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
    }

    if (elements.stickyShareBtn) {
        elements.stickyShareBtn.disabled = !enabled;
        elements.stickyShareBtn.className = enabled
            ? 'px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            : 'px-4 py-2 text-sm bg-gray-200 text-gray-500 rounded-md cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    }
}

let shareToastTimeout;
function showShareToast(message) {
    if (!elements.shareToast) return;
    elements.shareToast.textContent = message;
    elements.shareToast.classList.remove('hidden');
    clearTimeout(shareToastTimeout);
    shareToastTimeout = setTimeout(() => {
        elements.shareToast.classList.add('hidden');
    }, 2000);
}

function setTariffCategoryNote(state) {
    if (!elements.tariffCategoryNote) return;

    if (state === 'suggested') {
        elements.tariffCategoryNote.textContent = 'Sugerido por categoría (editable)';
        elements.tariffCategoryNote.classList.remove('hidden');
        return;
    }
    if (state === 'modified') {
        elements.tariffCategoryNote.textContent = 'Modificado manualmente';
        elements.tariffCategoryNote.classList.remove('hidden');
        return;
    }

    elements.tariffCategoryNote.classList.add('hidden');
}

// Build shareable URL with query params
function buildShareUrl() {
    const params = new URLSearchParams();
    
    params.set('mode', state.mode);
    
    const valueUSD = getInputValue(elements.inputValue);
    if (valueUSD > 0) {
        params.set('value', valueUSD.toString());
    }
    
    // Store shipping and checkout tax (always include if > 0)
    if (elements.inputStoreShipping) {
        const storeShipping = getInputValue(elements.inputStoreShipping, INPUT_BOUNDS.storeShipping);
        if (storeShipping > 0) {
            params.set('storeShipping', storeShipping.toString());
        }
    }
    if (elements.inputCheckoutTax) {
        const checkoutTax = getInputValue(elements.inputCheckoutTax, INPUT_BOUNDS.checkoutTax);
        if (checkoutTax > 0) {
            params.set('checkoutTax', checkoutTax.toString());
        }
    }
    
    if (state.mode === 'under200') {
        params.set('unit', state.unit);
        const weight = getInputValue(elements.inputWeight);
        if (weight > 0) {
            params.set('weight', weight.toString());
        }
    } else {
        const shippingUSD = getInputValue(elements.inputShipping);
        const tariffPct = getInputValue(elements.inputTariff);
        if (shippingUSD > 0) {
            params.set('shipping', shippingUSD.toString());
        }
        if (tariffPct > 0) {
            params.set('tariff', tariffPct.toString());
        }
        if (elements.tariffCategory && elements.tariffCategory.value !== '') {
            const categoryValue = parseFloat(elements.tariffCategory.value);
            if (!isNaN(categoryValue) && isFinite(categoryValue)) {
                const clampedCategory = Math.max(INPUT_BOUNDS.tariff.min, Math.min(INPUT_BOUNDS.tariff.max, categoryValue));
                params.set('tariffCategory', clampedCategory.toString());
            }
        }
        const selectivoPct = elements.inputSelectivo
            ? getInputValue(elements.inputSelectivo, INPUT_BOUNDS.selectivo)
            : 0;
        if (selectivoPct > 0) {
            params.set('selectivo', selectivoPct.toString());
        }
        if (state.importFeesPaid) {
            params.set('importFeesPaid', '1');
        }
    }
    
    // Courier market estimate params
    const fxRate = getInputValue(elements.inputFxRate, { min: 0, max: 1000 });
    if (fxRate > 0) {
        params.set('fx', fxRate.toString());
    }
    if (state.isInterior) {
        params.set('interior', '1');
    }
    if (elements.inputCustomRate) {
        const customRate = parseFloat(elements.inputCustomRate.value);
        if (!isNaN(customRate) && customRate > 0) {
            params.set('customRate', customRate.toString());
        }
    }
    if (state.customWeightRule) {
        params.set('customWeightRule', state.customWeightRule);
    }
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

// Copy to clipboard and show success message
async function copyShareUrl() {
    const url = buildShareUrl();
    
    try {
        await navigator.clipboard.writeText(url);
        
        // Show success message
        const originalText = elements.shareBtn.textContent;
        elements.shareBtn.textContent = 'Link copiado ✅';
        elements.shareBtn.className = 'w-full px-4 py-2 bg-green-600 text-white rounded-md transition';
        showShareToast('Link copiado ✅');
        
        // Reset after 2 seconds
        setTimeout(() => {
            elements.shareBtn.textContent = originalText;
            updateShareButton();
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            const originalText = elements.shareBtn.textContent;
            elements.shareBtn.textContent = 'Link copiado ✅';
            elements.shareBtn.className = 'w-full px-4 py-2 bg-green-600 text-white rounded-md transition';
        showShareToast('Link copiado ✅');
            setTimeout(() => {
                elements.shareBtn.textContent = originalText;
                updateShareButton();
            }, 2000);
        } catch (fallbackErr) {
            console.error('Failed to copy:', fallbackErr);
        }
        
        document.body.removeChild(textArea);
    }
}

// Parse query params and prefill inputs (with sanitization)
function parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Parse mode (sanitize - only accept valid values)
    const mode = params.get('mode');
    if (mode === 'under200' || mode === 'over200') {
        state.mode = mode;
        state.manualModeOverride = true; // URL params imply manual override
    }
    
    // Parse unit (sanitize - only accept valid values)
    const unit = params.get('unit');
    if (unit === 'lb' || unit === 'kg') {
        state.unit = unit;
    }
    
    // Parse value (sanitize - numbers only, clamp to bounds)
    const value = params.get('value');
    if (value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
            const clamped = Math.max(INPUT_BOUNDS.value.min, Math.min(INPUT_BOUNDS.value.max, numValue));
            if (clamped > 0) {
                elements.inputValue.value = clamped;
            }
        }
    }
    
    // Parse store shipping (sanitize - numbers only, clamp to bounds)
    const storeShipping = params.get('storeShipping');
    if (storeShipping && elements.inputStoreShipping) {
        const numStoreShipping = parseFloat(storeShipping);
        if (!isNaN(numStoreShipping) && isFinite(numStoreShipping)) {
            const clamped = Math.max(INPUT_BOUNDS.storeShipping.min, Math.min(INPUT_BOUNDS.storeShipping.max, numStoreShipping));
            if (clamped > 0) {
                elements.inputStoreShipping.value = clamped;
            }
        }
    }
    
    // Parse checkout tax (sanitize - numbers only, clamp to bounds)
    const checkoutTax = params.get('checkoutTax');
    if (checkoutTax && elements.inputCheckoutTax) {
        const numCheckoutTax = parseFloat(checkoutTax);
        if (!isNaN(numCheckoutTax) && isFinite(numCheckoutTax)) {
            const clamped = Math.max(INPUT_BOUNDS.checkoutTax.min, Math.min(INPUT_BOUNDS.checkoutTax.max, numCheckoutTax));
            if (clamped > 0) {
                elements.inputCheckoutTax.value = clamped;
            }
        }
    }
    
    // Parse weight (sanitize - numbers only, clamp to bounds)
    const weight = params.get('weight');
    if (weight) {
        const numWeight = parseFloat(weight);
        if (!isNaN(numWeight) && isFinite(numWeight)) {
            const clamped = Math.max(INPUT_BOUNDS.weight.min, Math.min(INPUT_BOUNDS.weight.max, numWeight));
            if (clamped > 0) {
                elements.inputWeight.value = clamped;
            }
        }
    }
    
    // Parse shipping (sanitize - numbers only, clamp to bounds)
    const shipping = params.get('shipping');
    if (shipping) {
        const numShipping = parseFloat(shipping);
        if (!isNaN(numShipping) && isFinite(numShipping)) {
            const clamped = Math.max(INPUT_BOUNDS.shipping.min, Math.min(INPUT_BOUNDS.shipping.max, numShipping));
            if (clamped > 0) {
                elements.inputShipping.value = clamped;
            }
        }
    }
    
    // Parse tariff (sanitize - numbers only, clamp to bounds)
    const tariff = params.get('tariff');
    if (tariff) {
        const numTariff = parseFloat(tariff);
        if (!isNaN(numTariff) && isFinite(numTariff)) {
            const clamped = Math.max(INPUT_BOUNDS.tariff.min, Math.min(INPUT_BOUNDS.tariff.max, numTariff));
            if (clamped > 0) {
                elements.inputTariff.value = clamped;
            }
        }
    }

    // Parse tariff category preset (optional shortcut)
    const tariffCategory = params.get('tariffCategory');
    if (tariffCategory && elements.tariffCategory) {
        const numCategory = parseFloat(tariffCategory);
        if (!isNaN(numCategory) && isFinite(numCategory)) {
            const clamped = Math.max(INPUT_BOUNDS.tariff.min, Math.min(INPUT_BOUNDS.tariff.max, numCategory));
            elements.tariffCategory.value = clamped.toString();
            if (!tariff) {
                elements.inputTariff.value = clamped;
                setTariffCategoryNote('suggested');
            } else {
                setTariffCategoryNote();
            }
        }
    }

    // Parse selectivo (sanitize - numbers only, clamp to bounds)
    const selectivo = params.get('selectivo');
    if (selectivo && elements.inputSelectivo) {
        const numSelectivo = parseFloat(selectivo);
        if (!isNaN(numSelectivo) && isFinite(numSelectivo)) {
            const clamped = Math.max(INPUT_BOUNDS.selectivo.min, Math.min(INPUT_BOUNDS.selectivo.max, numSelectivo));
            if (clamped > 0) {
                elements.inputSelectivo.value = clamped;
            }
        }
    }

    // Parse import fees paid flag
    const importFeesPaid = params.get('importFeesPaid');
    if (importFeesPaid === '1' && elements.inputImportFeesPaid) {
        state.importFeesPaid = true;
        elements.inputImportFeesPaid.checked = true;
    }

    // Parse FX rate
    const fxRate = params.get('fx');
    if (fxRate && elements.inputFxRate) {
        const numFx = parseFloat(fxRate);
        if (!isNaN(numFx) && isFinite(numFx) && numFx > 0) {
            const clamped = Math.max(0, Math.min(1000, numFx));
            elements.inputFxRate.value = clamped;
            state.fxRate = clamped;
        }
    }

    // Parse interior flag
    const interior = params.get('interior');
    if (interior === '1' && elements.inputInterior) {
        state.isInterior = true;
        elements.inputInterior.checked = true;
        if (elements.interiorNote) {
            elements.interiorNote.classList.remove('hidden');
        }
    }

    // Parse custom rate
    const customRate = params.get('customRate');
    if (customRate && elements.inputCustomRate) {
        const numCustom = parseFloat(customRate);
        if (!isNaN(numCustom) && isFinite(numCustom) && numCustom > 0) {
            const clamped = Math.max(0, Math.min(100, numCustom));
            elements.inputCustomRate.value = clamped;
            state.customRate = clamped;
        }
    }

    // Parse custom weight rule
    const customWeightRule = params.get('customWeightRule');
    if (customWeightRule && elements.inputCustomWeightRule) {
        if (['ceil', 'exact', 'min1'].includes(customWeightRule)) {
            state.customWeightRule = customWeightRule;
            elements.inputCustomWeightRule.value = customWeightRule;
        }
    }
}

// Calculate and render results
function calculateAndRender() {
    // Auto-determine mode based on value (unless manually overridden)
    const valueUSD = getInputValue(elements.inputValue, INPUT_BOUNDS.value);
    const newMode = determineMode(valueUSD);
    if (newMode !== state.mode && !state.manualModeOverride) {
        state.mode = newMode;
        render(); // Re-render UI to reflect mode change
        return; // render() will call calculateAndRender() again
    }
    
    let result;
    let hasKeyInput = true;
    const warnings = [];
    
    if (state.mode === 'under200') {
        const weight = getInputValue(elements.inputWeight, INPUT_BOUNDS.weight);
        
        // Check if key input (weight) is missing
        if (elements.inputWeight.value.trim() === '') {
            hasKeyInput = false;
        }
        
        // Warning: value + shipping might exceed $200
        const shippingUSD = getInputValue(elements.inputShipping, INPUT_BOUNDS.shipping);
        if (valueUSD < 200 && (valueUSD + shippingUSD) >= 200) {
            warnings.push('Ojo: si el total supera US$200, puede variar.');
        }
        
        if (hasKeyInput) {
            try {
                result = calcUnder200({
                    valueUSD,
                    weight,
                    unit: state.unit
                });
            } catch (err) {
                console.error('Calculation error:', err);
                renderResults(elements.results, { 
                    emptyState: 'Error al calcular. Por favor verifica los valores ingresados.' 
                });
                updateShareButton();
                return;
            }
        }
    } else {
        const shippingUSD = getInputValue(elements.inputShipping, INPUT_BOUNDS.shipping);
        const tariffPct = getInputValue(elements.inputTariff, INPUT_BOUNDS.tariff);
        const selectivoPct = elements.inputSelectivo
            ? getInputValue(elements.inputSelectivo, INPUT_BOUNDS.selectivo)
            : 0;
        
        // Check if key input (value) is missing
        if (elements.inputValue.value.trim() === '') {
            hasKeyInput = false;
        }
        
        // Warning: tariff is 0 or empty
        if (tariffPct === 0 || elements.inputTariff.value.trim() === '') {
            warnings.push('El arancel varía por producto; este cálculo puede subestimar.');
        }
        
        if (hasKeyInput) {
            try {
                result = calcOver200({
                    valueUSD,
                    shippingUSD,
                    tariffPct,
                    selectivoPct
                });
            } catch (err) {
                console.error('Calculation error:', err);
                renderResults(elements.results, { 
                    emptyState: 'Error al calcular. Por favor verifica los valores ingresados.' 
                });
                updateShareButton();
                return;
            }
        }
    }
    
    // Render results
    if (!hasKeyInput) {
        const emptyState = state.mode === 'under200' 
            ? 'Por favor ingresa el peso del producto para calcular los impuestos.'
            : 'Por favor ingresa el valor del producto para calcular los impuestos.';
        renderResults(elements.results, { emptyState });
        updateShareButton();
        return;
    }
    
    if (!result) {
        renderResults(elements.results, { 
            emptyState: 'Los resultados aparecerán aquí' 
        });
        updateShareButton();
        return;
    }
    
    // Build line items for summary card
    const lineItems = [];
    if (state.mode === 'under200') {
        lineItems.push({
            label: 'Valor del producto',
            valueUSD: result.baseUSD
        });
        result.taxLineItems.forEach(item => lineItems.push(item));
    } else {
        const shippingUSD = getInputValue(elements.inputShipping, INPUT_BOUNDS.shipping);
        const cif = result.baseUSD + shippingUSD;
        lineItems.push(
            { label: 'Valor del producto', valueUSD: result.baseUSD },
            { label: 'Costo de envío', valueUSD: shippingUSD },
            { label: 'CIF (Valor + Envío)', valueUSD: cif }
        );
        result.taxLineItems.forEach(item => lineItems.push(item));
    }
    
    // Render with results
    const importFeesNote = state.mode === 'over200' && state.importFeesPaid
        ? 'Nota: marcaste Import Fees, por eso los impuestos no se suman al total local.'
        : undefined;

    renderResults(elements.results, {
        lineItems,
        total: result.grandTotalUSD,
        totalLabel: 'Total (valor + impuestos)',
        warnings: warnings.length > 0 ? warnings : undefined,
        note: importFeesNote
    });
    
    // Update share button state
    updateShareButton();
    
    // Calculate and render courier fees (if courier section exists)
    if (elements.courierResults) {
        calculateAndRenderCourier();
    }
}

// Calculate and render courier fees (market estimate)
function calculateAndRenderCourier() {
    if (!elements.courierResults) {
        return;
    }
    
    const weight = getInputValue(elements.inputWeight, INPUT_BOUNDS.weight);
    const valueUSD = getInputValue(elements.inputValue, INPUT_BOUNDS.value);
    const fxRate = getInputValue(elements.inputFxRate, { min: 0, max: 1000 });
    const importFeesPaid = state.importFeesPaid;
    
    // Convert weight to pounds
    const weightLb = toLb(weight, state.unit);
    
    // Get tax result for combining
    let taxResult = null;
    if (state.mode === 'under200') {
        if (weight > 0) {
            try {
                taxResult = calcUnder200({
                    valueUSD,
                    weight,
                    unit: state.unit
                });
            } catch (err) {
                console.error('Tax calculation error:', err);
            }
        }
    } else {
        if (valueUSD > 0) {
            const shippingUSD = getInputValue(elements.inputShipping, INPUT_BOUNDS.shipping);
            const tariffPct = getInputValue(elements.inputTariff, INPUT_BOUNDS.tariff);
            const selectivoPct = elements.inputSelectivo
                ? getInputValue(elements.inputSelectivo, INPUT_BOUNDS.selectivo)
                : 0;
            try {
                taxResult = calcOver200({
                    valueUSD,
                    shippingUSD,
                    tariffPct,
                    selectivoPct
                });
            } catch (err) {
                console.error('Tax calculation error:', err);
            }
        }
    }
    
    // Check if we have required inputs
    if (weightLb <= 0) {
        elements.courierResults.classList.remove('hidden');
        elements.courierResults.textContent = '';
        const empty = document.createElement('p');
        empty.className = 'text-sm text-gray-500 text-center';
        empty.textContent = 'Ingresa el peso para estimar los gastos de courier.';
        elements.courierResults.appendChild(empty);
        updateStickyBar(null);
        return;
    }
    
    // Check if custom rate is provided
    const customRate = elements.inputCustomRate ? parseFloat(elements.inputCustomRate.value) : null;
    const customRule = state.customWeightRule || 'ceil';
    if (!isNaN(customRate) && customRate > 0) {
        // Use custom rate
        const billedWeight = getCustomBilledWeight(weightLb, customRule);
        const customTotalUSD = billedWeight * customRate;
        const customTotalDOP = fxRate > 0 ? customTotalUSD * fxRate : 0;
        
        renderMarketEstimateResults({
            typicalDOP: customTotalDOP,
            minDOP: customTotalDOP,
            maxDOP: customTotalDOP,
            isCustom: true,
            billedWeight
        }, taxResult, fxRate);
        return;
    }
    
    // Calculate market estimate: loop through all non-manual couriers
    const courierTotalsUSD = [];
    const courierIds = Object.keys(COURIERS_DO).filter(id => id !== 'manual');
    
    for (const courierId of courierIds) {
        try {
            const courierResult = calcCourierFees({
                courierId,
                weightLb,
                valueUSD,
                isInterior: state.isInterior,
                fxRate: 0 // Don't convert to DOP yet, we'll do it after aggregation
            });
            
            if (!courierResult.error && courierResult.subtotalUSD > 0) {
                courierTotalsUSD.push(courierResult.subtotalUSD);
            }
        } catch (err) {
            console.error(`Error calculating courier ${courierId}:`, err);
        }
    }
    
    if (courierTotalsUSD.length === 0) {
        elements.courierResults.classList.add('hidden');
        updateStickyBar(null);
        return;
    }
    
    // Calculate min, median (typical), max
    courierTotalsUSD.sort((a, b) => a - b);
    const minUSD = courierTotalsUSD[0];
    const maxUSD = courierTotalsUSD[courierTotalsUSD.length - 1];
    
    // Calculate median (handles 1, 2, or more values)
    let medianUSD;
    if (courierTotalsUSD.length === 1) {
        medianUSD = courierTotalsUSD[0];
    } else if (courierTotalsUSD.length === 2) {
        medianUSD = (courierTotalsUSD[0] + courierTotalsUSD[1]) / 2;
    } else if (courierTotalsUSD.length % 2 === 0) {
        const mid = courierTotalsUSD.length / 2;
        medianUSD = (courierTotalsUSD[mid - 1] + courierTotalsUSD[mid]) / 2;
    } else {
        medianUSD = courierTotalsUSD[Math.floor(courierTotalsUSD.length / 2)];
    }
    
    // Convert to DOP
    const minDOP = fxRate > 0 ? minUSD * fxRate : 0;
    const typicalDOP = fxRate > 0 ? medianUSD * fxRate : 0;
    const maxDOP = fxRate > 0 ? maxUSD * fxRate : 0;
    
    // Render market estimate results
    renderMarketEstimateResults({
        typicalDOP,
        minDOP,
        maxDOP,
        isCustom: false
    }, taxResult, fxRate, state.importFeesPaid);
}

function updateStickyBar(localTotalDOP) {
    if (!elements.stickyTotalBar || !elements.stickyTotalValue) {
        return;
    }

    if (!localTotalDOP || localTotalDOP <= 0) {
        elements.stickyTotalBar.classList.add('hidden');
        return;
    }

    elements.stickyTotalValue.textContent = formatDOP(localTotalDOP);
    elements.stickyTotalBar.classList.remove('hidden');
}

// Render market estimate results
function renderMarketEstimateResults({ typicalDOP, minDOP, maxDOP, isCustom, billedWeight }, taxResult, fxRate, importFeesPaid) {
    if (!elements.courierResults) return;
    
    elements.courierResults.classList.remove('hidden');
    elements.courierResults.textContent = '';
    
    const container = document.createElement('div');
    container.className = 'space-y-4';

    // Local total (DOP) - taxes + courier fees
    if (fxRate > 0 && (taxResult || typicalDOP > 0)) {
        const taxUSD = taxResult ? taxResult.taxTotalUSD : 0;
        const effectiveTaxUSDForLocal = importFeesPaid ? 0 : taxUSD;
        const taxDOP = effectiveTaxUSDForLocal * fxRate;
        const localTotalDOP = taxDOP + typicalDOP;

        if (localTotalDOP > 0) {
            const totalDiv = document.createElement('div');
            totalDiv.className = 'pb-3 border-b border-gray-200';

            const totalLabel = document.createElement('div');
            totalLabel.className = 'text-xs text-gray-500';
            totalLabel.textContent = 'Total a pagar localmente (DOP)';
            totalDiv.appendChild(totalLabel);

            const totalValue = document.createElement('div');
            totalValue.className = 'text-2xl sm:text-3xl font-bold text-blue-600';
            totalValue.textContent = formatDOP(localTotalDOP);
            totalDiv.appendChild(totalValue);

            const breakdown = document.createElement('div');
            breakdown.className = 'mt-2 text-xs text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-2';

            const courierLine = document.createElement('div');
            courierLine.textContent = `Courier: ${formatDOP(typicalDOP)}`;
            breakdown.appendChild(courierLine);

            const taxLine = document.createElement('div');
            taxLine.textContent = `Impuestos importaciA3n: ${formatDOP(taxDOP)}`;
            breakdown.appendChild(taxLine);

            totalDiv.appendChild(breakdown);
            container.appendChild(totalDiv);

            updateStickyBar(localTotalDOP);
        } else {
            updateStickyBar(null);
        }
    } else {
        updateStickyBar(null);
    }
    
    // Market estimate section
    const estimateDiv = document.createElement('div');
    estimateDiv.className = 'border-b border-gray-300 pb-3';
    
    const label = document.createElement('div');
    label.className = 'text-sm font-medium text-gray-600 mb-2';
    label.textContent = 'Gastos de courier (estimación de mercado)';
    estimateDiv.appendChild(label);
    
    // Typical estimate
    const typicalDiv = document.createElement('div');
    typicalDiv.className = 'text-xl font-bold text-blue-600 mb-2';
    typicalDiv.textContent = formatDOP(typicalDOP);
    estimateDiv.appendChild(typicalDiv);
    
    const scopeLine = document.createElement('div');
    scopeLine.className = 'text-xs text-gray-600';
    scopeLine.textContent = 'Incluye flete estimado por libra. Cargos adicionales pueden variar.';
    estimateDiv.appendChild(scopeLine);
    
    // Range (only show if not custom and there's variation)
    if (!isCustom && minDOP !== maxDOP && fxRate > 0) {
        const rangeDiv = document.createElement('div');
        rangeDiv.className = 'text-xs text-gray-500';
        rangeDiv.textContent = `Rango: ${formatDOP(minDOP)} – ${formatDOP(maxDOP)}`;
        estimateDiv.appendChild(rangeDiv);
    }
    
    container.appendChild(estimateDiv);
    
    // "How this estimate is calculated" expandable section
    const detailsDiv = document.createElement('details');
    detailsDiv.className = 'mt-2';
    
    const summary = document.createElement('summary');
    summary.className = 'cursor-pointer text-sm text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1';
    summary.textContent = '¿Cómo se calcula esta estimación?';
    detailsDiv.appendChild(summary);
    
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 space-y-1';
    
    if (isCustom) {
        const p1 = document.createElement('p');
        p1.textContent = '• Se usa tu tarifa personalizada multiplicada por el peso facturable.';
        explanationDiv.appendChild(p1);
        if (billedWeight !== undefined) {
            const p2 = document.createElement('p');
            p2.textContent = `• Peso facturable aplicado: ${billedWeight.toFixed(2)} lb.`;
            explanationDiv.appendChild(p2);
        }
    } else {
        const p1 = document.createElement('p');
        p1.textContent = '• Se calculan las tarifas de múltiples couriers del mercado.';
        explanationDiv.appendChild(p1);
        const p2 = document.createElement('p');
        p2.textContent = '• Se muestra la mediana (típica) y el rango mínimo-máximo.';
        explanationDiv.appendChild(p2);
        const p3 = document.createElement('p');
        p3.textContent = '• Para algunas tarifas públicas, interior puede agregar transporte.';
        explanationDiv.appendChild(p3);
    }
    
    detailsDiv.appendChild(explanationDiv);
    container.appendChild(detailsDiv);
    
    // Taxes section
    if (taxResult && taxResult.taxTotalUSD > 0) {
        const taxesDiv = document.createElement('div');
        taxesDiv.className = 'border-b border-gray-300 pb-3';
        
        const taxLabel = document.createElement('div');
        taxLabel.className = 'text-sm font-medium text-gray-600 mb-2';
        taxLabel.textContent = 'Impuestos';
        taxesDiv.appendChild(taxLabel);

        const taxHelper = document.createElement('div');
        taxHelper.className = 'text-xs text-gray-500 mb-2';
        taxHelper.textContent = 'Impuestos de importaciA3n (Aduanas/DGII). No incluye ITBIS del courier.';
        taxesDiv.appendChild(taxHelper);
        
        const taxUSD = document.createElement('div');
        taxUSD.className = 'text-base font-semibold text-gray-900 mb-1';
        taxUSD.textContent = `USD: ${formatUSD(taxResult.taxTotalUSD)}`;
        taxesDiv.appendChild(taxUSD);
        
        if (fxRate > 0) {
            const taxDOP = document.createElement('div');
            taxDOP.className = 'text-base font-semibold text-blue-600';
            taxDOP.textContent = `DOP: ${formatDOP(taxResult.taxTotalUSD * fxRate)}`;
            taxesDiv.appendChild(taxDOP);
        }
        
        container.appendChild(taxesDiv);
    }
    
    // Trust disclaimer
    const trustDisclaimer = document.createElement('div');
    trustDisclaimer.className = 'mt-3 text-xs text-gray-500';
    trustDisclaimer.textContent = 'Estimación basada en promedios; tu courier puede cobrar distinto.';
    container.appendChild(trustDisclaimer);
    
    // General disclaimer
    const generalDisclaimer = document.createElement('div');
    generalDisclaimer.className = 'mt-2 text-xs text-gray-600 italic';
    generalDisclaimer.textContent = 'No incluye peso volumétrico ni cargos especiales. Puede variar por libras volumétricas, manejo, combustible, seguro, airport fee y políticas del courier.';
    container.appendChild(generalDisclaimer);
    
    elements.courierResults.appendChild(container);
}

// Render function to update UI based on state
function render() {
    // Update mode buttons styling (only if manual override is visible)
    if (elements.modeToggleContainer && !elements.modeToggleContainer.classList.contains('hidden')) {
        if (state.mode === 'under200') {
            elements.modeUnder200.className = 'flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
            elements.modeOver200.className = 'flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
        } else {
            elements.modeUnder200.className = 'flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
            elements.modeOver200.className = 'flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
        }
    }
    
    // Update helper text
    const valueUSD = getInputValue(elements.inputValue, INPUT_BOUNDS.value);
    
    // Update debug mode indicator
    if (elements.modeDebug) {
        if (!DEBUG_ENABLED) {
            elements.modeDebug.classList.add('hidden');
            return;
        }
        elements.modeDebug.classList.remove('hidden');
        const overrideStatus = state.manualModeOverride ? 'override' : 'auto';
        elements.modeDebug.textContent = `Modo actual: ${state.mode} (${overrideStatus}) | FOB: $${valueUSD.toFixed(2)}`;
    }
    
    if (state.mode === 'under200') {
        elements.modeHelperText.textContent = 'Regla ≤ US$200: tasa DGA por kilo o fracción.';
        
        // Show weight input (always visible and open in under200 - required field)
        if (elements.weightDetails) {
            elements.weightDetails.open = true; // Open by default in under200
            if (elements.weightSummary) {
                elements.weightSummary.textContent = 'Peso';
            }
        }
        elements.shippingContainer.classList.add('hidden');
        elements.tariffContainer.classList.add('hidden');
    } else {
        elements.modeHelperText.textContent = `Modo ≥ US$200: cálculo basado en CIF + arancel + ITBIS.`;
        
        // Weight is optional/collapsed in over200 mode
        if (elements.weightDetails) {
            elements.weightDetails.open = false; // Collapsed by default in over200
            if (elements.weightSummary) {
                elements.weightSummary.textContent = 'Peso (opcional)';
            }
        }
        elements.shippingContainer.classList.remove('hidden');
        elements.tariffContainer.classList.remove('hidden');
    }
    
    // Update unit buttons styling
    if (state.unit === 'lb') {
        elements.unitLb.className = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
        elements.unitKg.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
    } else {
        elements.unitLb.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
        elements.unitKg.className = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition';
    }
    
    // Recalculate after UI update
    calculateAndRender();
    updateShareButton();
}

// Event listeners
// Advanced toggle - just shows/hides the mode buttons, doesn't set override
// Override is only set when user explicitly clicks a mode button
elements.advancedToggle.addEventListener('click', (e) => {
    e.preventDefault();
    elements.modeToggleContainer.classList.toggle('hidden');
});

// Manual mode override buttons
elements.modeUnder200.addEventListener('click', (e) => {
    e.preventDefault();
    state.manualModeOverride = true;
    state.mode = 'under200';
    render();
});

elements.modeOver200.addEventListener('click', (e) => {
    e.preventDefault();
    state.manualModeOverride = true;
    state.mode = 'over200';
    render();
});

elements.unitLb.addEventListener('click', (e) => {
    e.preventDefault();
    state.unit = 'lb';
    render();
});

elements.unitKg.addEventListener('click', (e) => {
    e.preventDefault();
    state.unit = 'kg';
    render();
});

// Debounce function for smooth updates
let calculateTimeout;
function debouncedCalculate() {
    clearTimeout(calculateTimeout);
    calculateTimeout = setTimeout(() => {
        calculateAndRender();
    }, 150);
}

// Update paid online summary
function updatePaidOnlineSummary() {
    if (!elements.paidOnlineSummary || !elements.paidOnlineTotal) return;
    
    const fobValue = getInputValue(elements.inputValue, INPUT_BOUNDS.value);
    const storeShipping = elements.inputStoreShipping ? getInputValue(elements.inputStoreShipping, INPUT_BOUNDS.storeShipping) : 0;
    const checkoutTax = elements.inputCheckoutTax ? getInputValue(elements.inputCheckoutTax, INPUT_BOUNDS.checkoutTax) : 0;
    
    const paidOnline = fobValue + storeShipping + checkoutTax;
    
    if (paidOnline > 0) {
        elements.paidOnlineSummary.classList.remove('hidden');
        elements.paidOnlineTotal.textContent = formatUSD(paidOnline);
    } else {
        elements.paidOnlineSummary.classList.add('hidden');
    }
}

function updateTariffCategoryNoteFromInput() {
    if (!elements.tariffCategory || elements.tariffCategory.value === '') {
        setTariffCategoryNote();
        return;
    }

    const categoryValue = parseFloat(elements.tariffCategory.value);
    if (isNaN(categoryValue) || !isFinite(categoryValue)) {
        setTariffCategoryNote();
        return;
    }

    const clampedCategory = Math.max(INPUT_BOUNDS.tariff.min, Math.min(INPUT_BOUNDS.tariff.max, categoryValue));
    const tariffValue = getInputValue(elements.inputTariff, INPUT_BOUNDS.tariff);

    if (tariffValue !== clampedCategory) {
        setTariffCategoryNote('modified');
    } else {
        setTariffCategoryNote('suggested');
    }
}

// Input validation and event listeners
elements.inputValue.addEventListener('input', () => {
    validateInput(elements.inputValue, INPUT_BOUNDS.value);
    updatePaidOnlineSummary();
    debouncedCalculate();
    if (elements.courierResults) {
        calculateAndRenderCourier();
    }
});
elements.inputValue.addEventListener('change', () => {
    validateInput(elements.inputValue, INPUT_BOUNDS.value);
    updatePaidOnlineSummary();
    calculateAndRender();
    if (elements.courierResults) {
        calculateAndRenderCourier();
    }
});

// Store shipping event listeners
if (elements.inputStoreShipping) {
    elements.inputStoreShipping.addEventListener('input', () => {
        validateInput(elements.inputStoreShipping, INPUT_BOUNDS.storeShipping);
        updatePaidOnlineSummary();
    });
    elements.inputStoreShipping.addEventListener('change', () => {
        validateInput(elements.inputStoreShipping, INPUT_BOUNDS.storeShipping);
        updatePaidOnlineSummary();
    });
}

// Checkout tax event listeners
if (elements.inputCheckoutTax) {
    elements.inputCheckoutTax.addEventListener('input', () => {
        validateInput(elements.inputCheckoutTax, INPUT_BOUNDS.checkoutTax);
        updatePaidOnlineSummary();
    });
    elements.inputCheckoutTax.addEventListener('change', () => {
        validateInput(elements.inputCheckoutTax, INPUT_BOUNDS.checkoutTax);
        updatePaidOnlineSummary();
    });
}

elements.inputWeight.addEventListener('input', () => {
    validateInput(elements.inputWeight, INPUT_BOUNDS.weight);
    debouncedCalculate();
    if (elements.courierResults) {
        calculateAndRenderCourier();
    }
});
elements.inputWeight.addEventListener('change', () => {
    validateInput(elements.inputWeight, INPUT_BOUNDS.weight);
    calculateAndRender();
    if (elements.courierResults) {
        calculateAndRenderCourier();
    }
});

elements.inputShipping.addEventListener('input', () => {
    validateInput(elements.inputShipping, INPUT_BOUNDS.shipping);
    debouncedCalculate();
});
elements.inputShipping.addEventListener('change', () => {
    validateInput(elements.inputShipping, INPUT_BOUNDS.shipping);
    calculateAndRender();
});

elements.inputTariff.addEventListener('input', () => {
    validateInput(elements.inputTariff, INPUT_BOUNDS.tariff);
    updateTariffCategoryNoteFromInput();
    debouncedCalculate();
});
elements.inputTariff.addEventListener('change', () => {
    validateInput(elements.inputTariff, INPUT_BOUNDS.tariff);
    updateTariffCategoryNoteFromInput();
    calculateAndRender();
});

if (elements.tariffCategory) {
    elements.tariffCategory.addEventListener('change', () => {
        const selectedValue = elements.tariffCategory.value;
        if (selectedValue === '') {
            setTariffCategoryNote();
            return;
        }
        elements.inputTariff.value = selectedValue;
        validateInput(elements.inputTariff, INPUT_BOUNDS.tariff);
        setTariffCategoryNote('suggested');
        calculateAndRender();
    });
}

if (elements.inputSelectivo) {
    elements.inputSelectivo.addEventListener('input', () => {
        validateInput(elements.inputSelectivo, INPUT_BOUNDS.selectivo);
        debouncedCalculate();
    });
    elements.inputSelectivo.addEventListener('change', () => {
        validateInput(elements.inputSelectivo, INPUT_BOUNDS.selectivo);
        calculateAndRender();
    });
}

if (elements.inputImportFeesPaid) {
    elements.inputImportFeesPaid.addEventListener('change', (e) => {
        state.importFeesPaid = e.target.checked;
        calculateAndRender();
        if (elements.courierResults) {
            calculateAndRenderCourier();
        }
    });
}

// Share button event listener
elements.shareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!elements.shareBtn.disabled) {
        copyShareUrl();
    }
});

if (elements.stickyShareBtn) {
    elements.stickyShareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!elements.stickyShareBtn.disabled) {
            copyShareUrl();
        }
    });
}

// Setup support links with Stripe Payment Link URL
function setupSupportLinks() {
    const footerSupportContainer = elements.footerSupportLink ? elements.footerSupportLink.parentElement : null;

    if (SHOW_SUPPORT) {
        if (elements.supportSection) {
            elements.supportSection.classList.remove('hidden');
        }
        if (footerSupportContainer) {
            footerSupportContainer.classList.remove('hidden');
        }
        if (elements.supportBtnPrimary) {
            elements.supportBtnPrimary.href = STRIPE_PAYMENT_LINK_URL;
            elements.supportBtnPrimary.removeAttribute('aria-hidden');
            elements.supportBtnPrimary.removeAttribute('tabindex');
        }
        if (elements.footerSupportLink) {
            elements.footerSupportLink.href = STRIPE_PAYMENT_LINK_URL;
            elements.footerSupportLink.removeAttribute('aria-hidden');
            elements.footerSupportLink.removeAttribute('tabindex');
        }
        return;
    }

    if (elements.supportSection) {
        elements.supportSection.classList.add('hidden');
    }
    if (footerSupportContainer) {
        footerSupportContainer.classList.add('hidden');
    }
    if (elements.supportBtnPrimary) {
        elements.supportBtnPrimary.removeAttribute('href');
        elements.supportBtnPrimary.removeAttribute('target');
        elements.supportBtnPrimary.removeAttribute('rel');
        elements.supportBtnPrimary.setAttribute('aria-hidden', 'true');
        elements.supportBtnPrimary.setAttribute('tabindex', '-1');
    }
    if (elements.footerSupportLink) {
        elements.footerSupportLink.removeAttribute('href');
        elements.footerSupportLink.removeAttribute('target');
        elements.footerSupportLink.removeAttribute('rel');
        elements.footerSupportLink.setAttribute('aria-hidden', 'true');
        elements.footerSupportLink.setAttribute('tabindex', '-1');
    }
}

// Render courier cards
function renderCourierCards() {
    if (!SHOW_COURIERS_DIRECTORY || !elements.courierCards) {
        return;
    }
    
    // Sanitize courier data before rendering
    const safeCouriers = COURIER_CARDS.map(courier => {
        const safeName = String(courier.name || '').replace(/[<>]/g, '');
        const safeBullets = (courier.bullets || []).map(b => String(b || '').replace(/[<>]/g, ''));
        const safeUrl = String(courier.url || '').replace(/[<>]/g, '');
        return { name: safeName, bullets: safeBullets, url: safeUrl };
    });
    
    elements.courierCards.innerHTML = safeCouriers.map(courier => `
        <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-semibold mb-3 text-gray-800">${courier.name}</h3>
            <ul class="text-sm text-gray-600 mb-4 space-y-1" role="list">
                ${courier.bullets.map(bullet => `<li class="flex items-start"><span class="mr-2">•</span><span>${bullet}</span></li>`).join('')}
            </ul>
            <a 
                href="${courier.url}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition text-center"
                aria-label="Ver más sobre ${courier.name}"
            >
                Ver más
            </a>
        </div>
    `).join('');
}

function buildMailtoUrl({ to, subject, body }) {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
}

function getEmailTemplate(type) {
    if (type === 'ads') {
        return {
            title: 'Anúnciate en ImpuestosRD',
            subject: 'Publicidad en ImpuestosRD',
            body:
                'Hola,\n\nMe interesa anunciarme en ImpuestosRD.\n\nNombre de la empresa:\nSitio web:\nTipo (courier/tienda):\nPresupuesto mensual (aprox):\nMensaje:\n\nGracias,\n'
        };
    }

    return {
        title: 'Reportar un error',
        subject: 'Bug en ImpuestosRD',
        body:
            'Describe el problema:\n\nPasos para reproducir:\n1)\n2)\n\nResultado esperado:\n\nResultado actual:\n\nLink:\n' +
            `${window.location.href}\n\n` +
            'Datos (si aplica):\nFOB:\nPeso:\nModo:\n\nNavegador:\n' +
            `${navigator.userAgent}\n`
    };
}

function openEmailModal(type) {
    if (!elements.emailModal || !elements.emailSubject || !elements.emailBody) {
        return;
    }

    const template = getEmailTemplate(type);
    if (elements.emailModalTitle) {
        elements.emailModalTitle.textContent = template.title;
    }
    if (elements.emailFrom) {
        elements.emailFrom.value = '';
    }
    elements.emailSubject.value = template.subject;
    elements.emailBody.value = template.body;

    elements.emailModal.classList.remove('hidden');
    elements.emailModal.classList.add('flex');

    setTimeout(() => {
        elements.emailSubject.focus();
    }, 0);
}

function closeEmailModal() {
    if (!elements.emailModal) {
        return;
    }
    elements.emailModal.classList.add('hidden');
    elements.emailModal.classList.remove('flex');
}

// Render official sources list (safe rendering)
function renderSources() {
    if (!elements.sourcesList) return;

    // Clear existing content
    elements.sourcesList.textContent = '';
    
    SOURCES_DO.forEach(src => {
        const div = document.createElement('div');
        div.className = 'rounded-md border border-gray-200 p-3 bg-white';
        
        const link = document.createElement('a');
        link.href = src.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'text-blue-600 hover:underline font-medium break-words';
        link.textContent = src.title;
        div.appendChild(link);
        
        if (src.note) {
            const note = document.createElement('p');
            note.className = 'text-xs text-gray-600 mt-1';
            note.textContent = src.note;
            div.appendChild(note);
        }
        
        elements.sourcesList.appendChild(div);
    });
}


// Event listeners for courier section

if (elements.inputFxRate) {
    // Set default FX rate
    elements.inputFxRate.value = state.fxRate;
    
    let courierTimeout;
    function debouncedCourierCalculate() {
        clearTimeout(courierTimeout);
        courierTimeout = setTimeout(() => {
            calculateAndRenderCourier();
        }, 150);
    }
    
    elements.inputFxRate.addEventListener('input', () => {
        const fxRate = parseFloat(elements.inputFxRate.value);
        if (!isNaN(fxRate) && fxRate > 0) {
            state.fxRate = Math.max(0, Math.min(1000, fxRate));
            debouncedCourierCalculate();
        }
    });
    
    elements.inputFxRate.addEventListener('change', () => {
        const fxRate = parseFloat(elements.inputFxRate.value);
        if (!isNaN(fxRate) && fxRate > 0) {
            state.fxRate = Math.max(0, Math.min(1000, fxRate));
            calculateAndRenderCourier();
        }
    });
}

if (elements.inputInterior) {
    elements.inputInterior.addEventListener('change', (e) => {
        state.isInterior = e.target.checked;
        if (elements.interiorNote) {
            elements.interiorNote.classList.toggle('hidden', !state.isInterior);
        }
        calculateAndRenderCourier();
    });
}

if (elements.inputCustomRate) {
    let customRateTimeout;
    function debouncedCustomRate() {
        clearTimeout(customRateTimeout);
        customRateTimeout = setTimeout(() => {
            calculateAndRenderCourier();
        }, 150);
    }
    
    elements.inputCustomRate.addEventListener('input', () => {
        const customRate = parseFloat(elements.inputCustomRate.value);
        if (!isNaN(customRate) && customRate > 0) {
            state.customRate = Math.max(0, Math.min(100, customRate));
            debouncedCustomRate();
        } else {
            state.customRate = null;
            debouncedCustomRate();
        }
    });
    
    elements.inputCustomRate.addEventListener('change', () => {
        const customRate = parseFloat(elements.inputCustomRate.value);
        if (!isNaN(customRate) && customRate > 0) {
            state.customRate = Math.max(0, Math.min(100, customRate));
        } else {
            state.customRate = null;
        }
        calculateAndRenderCourier();
    });
}

if (elements.inputCustomWeightRule) {
    elements.inputCustomWeightRule.value = state.customWeightRule;
    elements.inputCustomWeightRule.addEventListener('change', (e) => {
        state.customWeightRule = e.target.value;
        calculateAndRenderCourier();
    });
}

// Parse query params and initialize
parseQueryParams();

// Initial render
render();

// Initialize paid online summary
updatePaidOnlineSummary();

// Initialize courier section (no initialization needed for market estimate)

// Render monetization sections
setupSupportLinks();
renderCourierCards();

// Show/hide couriers section based on feature flag
if (elements.couriersSection) {
    if (SHOW_COURIERS_DIRECTORY) {
        elements.couriersSection.classList.remove('hidden');
    } else {
        elements.couriersSection.classList.add('hidden');
    }
}

renderSources();

// Email modal events
document.querySelectorAll('[data-email-type]').forEach(trigger => {
    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        const type = trigger.getAttribute('data-email-type') || 'bug';
        openEmailModal(type);
    });
});

if (elements.emailCancel) {
    elements.emailCancel.addEventListener('click', () => {
        closeEmailModal();
    });
}

if (elements.emailClose) {
    elements.emailClose.addEventListener('click', () => {
        closeEmailModal();
    });
}

if (elements.emailModal) {
    elements.emailModal.addEventListener('click', (event) => {
        if (event.target === elements.emailModal) {
            closeEmailModal();
        }
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.emailModal && !elements.emailModal.classList.contains('hidden')) {
        closeEmailModal();
    }
});

if (elements.emailSend) {
    elements.emailSend.addEventListener('click', () => {
        if (!elements.emailSubject || !elements.emailBody) {
            return;
        }
        const subject = elements.emailSubject.value.trim();
        const body = elements.emailBody.value.trim();

        if (!subject) {
            elements.emailSubject.focus();
            return;
        }
        if (!body) {
            elements.emailBody.focus();
            return;
        }

        const from = elements.emailFrom ? elements.emailFrom.value.trim() : '';
        const fullBody = from ? `Contacto: ${from}\n\n${body}` : body;
        const mailtoUrl = buildMailtoUrl({
            to: CONTACT_EMAIL,
            subject,
            body: fullBody
        });

        window.location.href = mailtoUrl;
        setTimeout(() => {
            closeEmailModal();
        }, 100);
    });
}

