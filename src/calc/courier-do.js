// Courier fee calculation for Dominican Republic couriers

import { COURIERS_DO } from '../data/couriers-do.js';

/**
 * Convert weight to pounds
 * @param {number} weight - Weight value
 * @param {string} unit - 'lb' or 'kg'
 * @returns {number} Weight in pounds
 */
export function toLb(weight, unit) {
    if (unit === 'lb') {
        return weight;
    }
    // Convert kg to lb
    return weight * 2.20462;
}

/**
 * Calculate billed weight based on courier rounding rules
 * @param {number} weightLb - Weight in pounds
 * @param {string} roundingRule - Rounding rule type
 * @returns {number} Billed weight in pounds
 */
function calculateBilledWeight(weightLb, roundingRule) {
    if (weightLb <= 0) return 0;
    
    switch (roundingRule) {
        case 'min-1-lb-ceil':
            // Minimum 1 lb, then round up
            return Math.max(1, Math.ceil(weightLb));
        case 'exact-fraction':
            // Exact fraction, no rounding
            return weightLb;
        case 'exact':
            // Use entered weight (for base freight)
            return weightLb;
        default:
            return weightLb;
    }
}

/**
 * Find rate tier for a given weight
 * @param {Array} tiers - Array of rate tiers
 * @param {number} weightLb - Weight in pounds
 * @returns {Object} Rate tier object
 */
function findRateTier(tiers, weightLb) {
    for (const tier of tiers) {
        if (weightLb >= tier.min && (tier.max === Infinity || weightLb < tier.max)) {
            return tier;
        }
    }
    // Fallback to last tier
    return tiers[tiers.length - 1];
}

/**
 * Calculate base freight cost
 * @param {Object} courier - Courier configuration
 * @param {number} weightLb - Weight in pounds
 * @returns {number} Base freight cost in USD
 */
function calculateBaseFreight(courier, weightLb) {
    if (courier.rateTiers.length === 0) {
        return 0;
    }
    
    const billedWeight = calculateBilledWeight(weightLb, courier.roundingRule);
    const tier = findRateTier(courier.rateTiers, billedWeight);
    
    return billedWeight * tier.rate;
}

/**
 * Calculate extra fees
 * @param {Object} courier - Courier configuration
 * @param {number} weightLb - Weight in pounds
 * @param {number} valueUSD - Declared value in USD
 * @param {boolean} isInterior - Whether it's interior delivery
 * @returns {Array} Array of extra fee objects
 */
function calculateExtras(courier, weightLb, valueUSD, isInterior) {
    const extras = [];
    
    if (!courier.extras || courier.extras.length === 0) {
        return extras;
    }
    
    for (const extra of courier.extras) {
        // Check conditional extras
        if (extra.conditional === 'isInterior' && !isInterior) {
            continue;
        }
        
        let feeAmount = 0;
        let billedWeight = weightLb;
        
        switch (extra.type) {
            case 'per-lb':
                billedWeight = calculateBilledWeight(weightLb, courier.roundingRule);
                feeAmount = billedWeight * extra.rate;
                break;
                
            case 'per-lb-or-fraction':
                // Round up for per-lb-or-fraction fees
                billedWeight = Math.ceil(weightLb);
                feeAmount = billedWeight * extra.rate;
                break;
                
            case 'coverage-tier':
                if (extra.tiers) {
                    const tier = findRateTier(extra.tiers, valueUSD);
                    feeAmount = tier.rate;
                }
                break;
                
            case 'flat':
                feeAmount = extra.rate;
                break;
        }
        
        if (feeAmount > 0) {
            extras.push({
                name: extra.name,
                amountUSD: feeAmount,
                note: extra.note || ''
            });
        }
    }
    
    return extras;
}

/**
 * Calculate courier fees
 * @param {Object} params
 * @param {string} params.courierId - Courier ID
 * @param {number} params.weightLb - Weight in pounds
 * @param {number} params.valueUSD - Declared value in USD
 * @param {boolean} [params.isInterior] - Whether it's interior delivery
 * @param {number} [params.fxRate] - USD to DOP exchange rate
 * @returns {Object} Calculation result
 */
export function calcCourierFees({ courierId, weightLb, valueUSD, isInterior = false, fxRate = 0 }) {
    const courier = COURIERS_DO[courierId];
    
    if (!courier) {
        return {
            error: 'Courier no encontrado',
            billedWeightLb: 0,
            lineItemsUSD: [],
            lineItemsDOP: [],
            subtotalUSD: 0,
            subtotalDOP: 0,
            notes: []
        };
    }
    
    // Manual courier - return empty result
    if (courierId === 'manual') {
        return {
            billedWeightLb: weightLb,
            lineItemsUSD: [],
            lineItemsDOP: [],
            subtotalUSD: 0,
            subtotalDOP: 0,
            notes: courier.notes || []
        };
    }
    
    const billedWeightLb = calculateBilledWeight(weightLb, courier.roundingRule);
    const baseFreight = calculateBaseFreight(courier, weightLb);
    const extras = calculateExtras(courier, weightLb, valueUSD, isInterior);
    
    // Build line items
    const lineItemsUSD = [];
    const lineItemsDOP = [];
    
    if (baseFreight > 0) {
        lineItemsUSD.push({
            label: `Flete base (${billedWeightLb.toFixed(2)} lb)`,
            amountUSD: baseFreight
        });
        
        if (fxRate > 0) {
            lineItemsDOP.push({
                label: `Flete base (${billedWeightLb.toFixed(2)} lb)`,
                amountDOP: baseFreight * fxRate
            });
        }
    }
    
    // Add extras
    extras.forEach(extra => {
        lineItemsUSD.push({
            label: extra.name,
            amountUSD: extra.amountUSD,
            note: extra.note
        });
        
        if (fxRate > 0) {
            lineItemsDOP.push({
                label: extra.name,
                amountDOP: extra.amountUSD * fxRate,
                note: extra.note
            });
        }
    });
    
    // Calculate subtotals
    const subtotalUSD = baseFreight + extras.reduce((sum, e) => sum + e.amountUSD, 0);
    const subtotalDOP = fxRate > 0 ? subtotalUSD * fxRate : 0;
    
    return {
        billedWeightLb,
        lineItemsUSD,
        lineItemsDOP,
        subtotalUSD,
        subtotalDOP,
        notes: courier.notes || []
    };
}
