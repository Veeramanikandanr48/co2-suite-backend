/**
 * Seed: IPCC AR6 Global Default Emission Factors
 *
 * Source: IPCC Sixth Assessment Report (AR6), 2021
 * Factor Source Code: IPCC
 * Factor Version:     AR6
 * GWP Version:        AR6 (CH₄=27.2, N₂O=273)
 *
 * Usage:
 *   npx ts-node seed/IPCC/ar6-factors.ts
 *
 * This seed is idempotent — re-running will upsert by composite key.
 * Do NOT modify existing entries after they are published.
 * Add new entries or supersede existing ones via EmissionFactorRevision.
 */

export interface SeedFactor {
  scopeCode: string;
  activityCode: string;
  fuelCode: string;
  unitCode: string;
  countryCode: string | null; // null = global default
  regionCode: string | null;
  totalEmissionFactor: number;
  gases: Array<{ gasCode: string; value: number; gwpVersion: string }>;
  formulaCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  priority: number;
  metadata: {
    dataQuality: string;
    confidenceScore: number;
    sourcePublisher: string;
    sourceDocument: string;
    referenceUrl: string;
    citation: string;
  };
}

export const IPCC_AR6_FACTORS: SeedFactor[] = [
  // ── Scope 1: Stationary Combustion — Diesel ────────────────────────────────
  {
    scopeCode: 'SCOPE_1',
    activityCode: 'STATIONARY_COMBUSTION',
    fuelCode: 'DIESEL',
    unitCode: 'LITER',
    countryCode: null,
    regionCode: null,
    totalEmissionFactor: 2.68,
    gases: [
      { gasCode: 'CO2', value: 2.657,   gwpVersion: 'AR6' },
      { gasCode: 'CH4', value: 0.00011, gwpVersion: 'AR6' },
      { gasCode: 'N2O', value: 0.00021, gwpVersion: 'AR6' },
    ],
    formulaCode: 'FUEL_COMBUSTION_MASS',
    effectiveFrom: '2021-01-01',
    effectiveTo: null,
    priority: 5,
    metadata: {
      dataQuality: 'TIER_1',
      confidenceScore: 97.0,
      sourcePublisher: 'IPCC',
      sourceDocument: 'IPCC AR6 WGI Chapter 7 Supplementary Material',
      referenceUrl: 'https://www.ipcc.ch/report/ar6/wg1/',
      citation: 'IPCC, 2021: Climate Change 2021: The Physical Science Basis.',
    },
  },
  // ── Scope 1: Stationary Combustion — Natural Gas ───────────────────────────
  {
    scopeCode: 'SCOPE_1',
    activityCode: 'STATIONARY_COMBUSTION',
    fuelCode: 'NATURAL_GAS',
    unitCode: 'SM3',
    countryCode: null,
    regionCode: null,
    totalEmissionFactor: 2.02,
    gases: [
      { gasCode: 'CO2', value: 1.998,   gwpVersion: 'AR6' },
      { gasCode: 'CH4', value: 0.00054, gwpVersion: 'AR6' },
      { gasCode: 'N2O', value: 0.00006, gwpVersion: 'AR6' },
    ],
    formulaCode: 'FUEL_COMBUSTION_VOLUME',
    effectiveFrom: '2021-01-01',
    effectiveTo: null,
    priority: 5,
    metadata: {
      dataQuality: 'TIER_1',
      confidenceScore: 96.0,
      sourcePublisher: 'IPCC',
      sourceDocument: 'IPCC AR6 WGI Chapter 7 Supplementary Material',
      referenceUrl: 'https://www.ipcc.ch/report/ar6/wg1/',
      citation: 'IPCC, 2021: Climate Change 2021: The Physical Science Basis.',
    },
  },
  // ── Scope 1: Stationary Combustion — Coal ─────────────────────────────────
  {
    scopeCode: 'SCOPE_1',
    activityCode: 'STATIONARY_COMBUSTION',
    fuelCode: 'COAL',
    unitCode: 'KG',
    countryCode: null,
    regionCode: null,
    totalEmissionFactor: 2.42,
    gases: [
      { gasCode: 'CO2', value: 2.411,   gwpVersion: 'AR6' },
      { gasCode: 'CH4', value: 0.00109, gwpVersion: 'AR6' },
      { gasCode: 'N2O', value: 0.00027, gwpVersion: 'AR6' },
    ],
    formulaCode: 'FUEL_COMBUSTION_MASS',
    effectiveFrom: '2021-01-01',
    effectiveTo: null,
    priority: 5,
    metadata: {
      dataQuality: 'TIER_1',
      confidenceScore: 95.0,
      sourcePublisher: 'IPCC',
      sourceDocument: 'IPCC AR6 WGI Chapter 7 Supplementary Material',
      referenceUrl: 'https://www.ipcc.ch/report/ar6/wg1/',
      citation: 'IPCC, 2021: Climate Change 2021: The Physical Science Basis.',
    },
  },
  // ── Scope 1: Stationary Combustion — LPG ──────────────────────────────────
  {
    scopeCode: 'SCOPE_1',
    activityCode: 'STATIONARY_COMBUSTION',
    fuelCode: 'LPG',
    unitCode: 'LITER',
    countryCode: null,
    regionCode: null,
    totalEmissionFactor: 1.61,
    gases: [
      { gasCode: 'CO2', value: 1.598,   gwpVersion: 'AR6' },
      { gasCode: 'CH4', value: 0.00005, gwpVersion: 'AR6' },
      { gasCode: 'N2O', value: 0.00010, gwpVersion: 'AR6' },
    ],
    formulaCode: 'FUEL_COMBUSTION_VOLUME',
    effectiveFrom: '2021-01-01',
    effectiveTo: null,
    priority: 5,
    metadata: {
      dataQuality: 'TIER_1',
      confidenceScore: 96.5,
      sourcePublisher: 'IPCC',
      sourceDocument: 'IPCC AR6 WGI Chapter 7 Supplementary Material',
      referenceUrl: 'https://www.ipcc.ch/report/ar6/wg1/',
      citation: 'IPCC, 2021: Climate Change 2021: The Physical Science Basis.',
    },
  },
  // ── Scope 1: Fugitive Emissions — CH₄ (natural gas system) ────────────────
  {
    scopeCode: 'SCOPE_1',
    activityCode: 'FUGITIVE_EMISSIONS',
    fuelCode: 'NATURAL_GAS',
    unitCode: 'SM3',
    countryCode: null,
    regionCode: null,
    totalEmissionFactor: 0.764, // 28 × CH4 GWP AR6 (27.2) expressed as CO2e
    gases: [
      { gasCode: 'CH4', value: 0.0281, gwpVersion: 'AR6' },
    ],
    formulaCode: 'FUGITIVE_GAS_VOLUME',
    effectiveFrom: '2021-01-01',
    effectiveTo: null,
    priority: 5,
    metadata: {
      dataQuality: 'TIER_2',
      confidenceScore: 85.0,
      sourcePublisher: 'IPCC',
      sourceDocument: 'IPCC AR6 WGI Chapter 7',
      referenceUrl: 'https://www.ipcc.ch/report/ar6/wg1/',
      citation: 'IPCC, 2021: Climate Change 2021: The Physical Science Basis.',
    },
  },
];
