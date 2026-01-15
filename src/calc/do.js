// Calculation logic for Dominican Republic import taxes

/**
 * Convert weight to kilograms
 * @param {number} weight - Weight value
 * @param {string} unit - 'lb' or 'kg'
 * @returns {number} Weight in kilograms
 */
export function toKg(weight, unit) {
    if (unit === 'kg') {
        return weight;
    }
    // Convert lb to kg
    return weight * 0.45359237;
}

/**
 * Calculate import taxes for items under $200 USD
 * @param {Object} params
 * @param {number} params.valueUSD - Product value in USD
 * @param {number} params.weight - Weight value
 * @param {string} params.unit - 'lb' or 'kg'
 * @returns {Object} Calculation result with baseUSD, taxTotalUSD, grandTotalUSD, taxLineItems
 */
export function calcUnder200({ valueUSD, weight, unit }) {
    // Clamp negative values to 0
    const safeValueUSD = Math.max(0, valueUSD || 0);
    const safeWeight = Math.max(0, weight || 0);
    
    const weightKg = toKg(safeWeight, unit || 'kg');
    // Ensure ceil works correctly even for very small decimals
    const weightKgCeil = weightKg > 0 ? Math.ceil(weightKg) : 0;
    const dgaFeeUSD = 0.25 * weightKgCeil;
    
    const taxLineItems = [
        {
            label: `Tasa DGA (US$0.25 × ${weightKgCeil} kg)`,
            valueUSD: dgaFeeUSD,
            note: weightKg > 0 ? `Peso: ${weightKg.toFixed(2)} kg (redondeado a ${weightKgCeil} kg)` : undefined
        }
    ];
    
    const baseUSD = safeValueUSD;
    const taxTotalUSD = dgaFeeUSD;
    const grandTotalUSD = baseUSD + taxTotalUSD;
    
    return {
        baseUSD,
        taxTotalUSD,
        grandTotalUSD,
        taxLineItems
    };
}

/**
 * Calculate import taxes for items over $200 USD (estimate)
 * @param {Object} params
 * @param {number} params.valueUSD - Product value in USD
 * @param {number} params.shippingUSD - Shipping cost in USD
 * @param {number} params.tariffPct - Tariff percentage
 * @returns {Object} Calculation result with baseUSD, taxTotalUSD, grandTotalUSD, taxLineItems
 */
export function calcOver200({ valueUSD, shippingUSD, tariffPct }) {
    // Clamp negative values to 0
    const value = Math.max(0, valueUSD || 0);
    const shipping = Math.max(0, shippingUSD || 0);
    const tariffPercent = Math.max(0, Math.min(100, tariffPct || 0)); // Clamp between 0-100
    
    const cif = value + shipping;
    const tariff = cif * (tariffPercent / 100);
    const itbis = (cif + tariff) * 0.18;
    const taxLineItems = [
        {
            label: `Arancel (${tariffPercent}%)`,
            valueUSD: tariff
        },
        {
            label: 'ITBIS (18%)',
            valueUSD: itbis,
            note: 'Sobre CIF + Arancel'
        }
    ];
    
    const baseUSD = value;
    const taxTotalUSD = tariff + itbis;
    const grandTotalUSD = value + shipping + taxTotalUSD;
    
    return {
        baseUSD,
        taxTotalUSD,
        grandTotalUSD,
        taxLineItems
    };
}
