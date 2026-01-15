// Courier rate configurations for Dominican Republic
// Based on published rates from courier websites
// Rates are in USD per pound unless otherwise noted

export const COURIERS_DO = {
  'bm-cargo': {
    id: 'bm-cargo',
    name: 'BM Cargo',
    roundingRule: 'exact', // Use entered weight for base freight, "per lb or fraction" only for specific fees
    rateTiers: [
      { min: 0, max: 1, rate: 3.50 },
      { min: 1, max: 5, rate: 3.00 },
      { min: 5, max: 10, rate: 2.75 },
      { min: 10, max: 20, rate: 2.50 },
      { min: 20, max: 50, rate: 2.25 },
      { min: 50, max: Infinity, rate: 2.00 }
    ],
    extras: [
      {
        name: 'Transferencia Local',
        type: 'per-lb-or-fraction',
        rate: 0.50,
        note: 'Por lb o fracción'
      },
      {
        name: 'SED (Seguro)',
        type: 'coverage-tier',
        tiers: [
          { min: 0, max: 100, rate: 0 },
          { min: 100, max: 500, rate: 5.00 },
          { min: 500, max: 1000, rate: 10.00 },
          { min: 1000, max: Infinity, rate: 15.00 }
        ],
        note: 'Seguro según valor declarado'
      }
    ],
    notes: [
      'Tarifas base publicadas. Pueden aplicarse cargos adicionales por manejo, combustible, o políticas del courier.',
      'El redondeo de peso para tarifas base puede variar según políticas del courier.'
    ],
    sourceUrl: 'https://bmcargo.com/tarifas'
  },
  'aeropaq': {
    id: 'aeropaq',
    name: 'Aeropaq',
    roundingRule: 'min-1-lb-ceil', // Minimum 1 lb, then round up
    rateTiers: [
      { min: 0, max: 1, rate: 3.50 },
      { min: 1, max: 5, rate: 3.00 },
      { min: 5, max: 10, rate: 2.75 },
      { min: 10, max: 20, rate: 2.50 },
      { min: 20, max: 50, rate: 2.25 },
      { min: 50, max: Infinity, rate: 2.00 }
    ],
    extras: [
      {
        name: 'Transporte Interior',
        type: 'per-lb',
        rate: 0.50,
        conditional: 'isInterior',
        note: 'Solo si es envío al interior'
      }
    ],
    notes: [
      'Tarifas publicadas no incluyen ITBIS / Impuesto DGA / combustible / seguro / Airport Fee.',
      'Puede variar por libras volumétricas, manejo, combustible, seguro, airport fee y políticas del courier.',
      'Mínimo 1 libra. El peso se redondea hacia arriba.'
    ],
    sourceUrl: 'https://aeropaq.com/tarifas'
  },
  'tupaq': {
    id: 'tupaq',
    name: 'TuPaq',
    roundingRule: 'exact-fraction', // Exact fraction, no rounding
    rateTiers: [
      { min: 0, max: 1, rate: 3.50 },
      { min: 1, max: 5, rate: 3.00 },
      { min: 5, max: 10, rate: 2.75 },
      { min: 10, max: 20, rate: 2.50 },
      { min: 20, max: 50, rate: 2.25 },
      { min: 50, max: Infinity, rate: 2.00 }
    ],
    extras: [],
    notes: [
      'El peso facturado es exacto (fracción), sin redondeo.',
      'Pueden aplicarse cargos adicionales por manejo, combustible, o políticas del courier.'
    ],
    sourceUrl: 'https://tupaq.com/tarifas'
  },
  'manual': {
    id: 'manual',
    name: 'Manual',
    roundingRule: 'none',
    rateTiers: [],
    extras: [],
    notes: [
      'Ingresa manualmente los costos del courier.'
    ],
    sourceUrl: null
  }
};
