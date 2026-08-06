import {
  FormulaLibrary,
  FormulaVersion,
  GasType,
  GwpVersion,
  SupplementaryFieldDefinition,
} from 'src/entities/master-config.entity';

export const SEED_GAS_TYPES: Partial<GasType>[] = [
  { code: 'CO2', name: 'Carbon Dioxide', chemicalFormula: 'CO₂', sortOrder: 1 },
  { code: 'CH4', name: 'Methane', chemicalFormula: 'CH₄', sortOrder: 2 },
  { code: 'N2O', name: 'Nitrous Oxide', chemicalFormula: 'N₂O', sortOrder: 3 },
  { code: 'HFC', name: 'Hydrofluorocarbons', chemicalFormula: 'HFCs', sortOrder: 4 },
  { code: 'PFC', name: 'Perfluorocarbons', chemicalFormula: 'PFCs', sortOrder: 5 },
  { code: 'SF6', name: 'Sulfur Hexafluoride', chemicalFormula: 'SF₆', sortOrder: 6 },
  { code: 'NF3', name: 'Nitrogen Trifluoride', chemicalFormula: 'NF₃', sortOrder: 7 },
];

export const SEED_GWP_VERSIONS: Partial<GwpVersion>[] = [
  {
    code: 'AR6',
    name: 'IPCC Sixth Assessment Report (2021)',
    publicationYear: 2021,
    isDefault: true,
  },
  {
    code: 'AR5',
    name: 'IPCC Fifth Assessment Report (2013)',
    publicationYear: 2013,
    isDefault: false,
  },
];

// Map of GWP values: [gwpVersionCode, gasTypeCode, multiplier]
export const SEED_GAS_MULTIPLIERS: Array<{
  gwpVersionCode: string;
  gasTypeCode: string;
  multiplier: number;
}> = [
  // AR6 (IPCC 2021)
  { gwpVersionCode: 'AR6', gasTypeCode: 'CO2', multiplier: 1.0 },
  { gwpVersionCode: 'AR6', gasTypeCode: 'CH4', multiplier: 27.9 },
  { gwpVersionCode: 'AR6', gasTypeCode: 'N2O', multiplier: 273.0 },
  { gwpVersionCode: 'AR6', gasTypeCode: 'HFC', multiplier: 1430.0 },
  { gwpVersionCode: 'AR6', gasTypeCode: 'PFC', multiplier: 6630.0 },
  { gwpVersionCode: 'AR6', gasTypeCode: 'SF6', multiplier: 25200.0 },
  { gwpVersionCode: 'AR6', gasTypeCode: 'NF3', multiplier: 17400.0 },

  // AR5 (IPCC 2013)
  { gwpVersionCode: 'AR5', gasTypeCode: 'CO2', multiplier: 1.0 },
  { gwpVersionCode: 'AR5', gasTypeCode: 'CH4', multiplier: 28.0 },
  { gwpVersionCode: 'AR5', gasTypeCode: 'N2O', multiplier: 265.0 },
  { gwpVersionCode: 'AR5', gasTypeCode: 'HFC', multiplier: 1300.0 },
  { gwpVersionCode: 'AR5', gasTypeCode: 'PFC', multiplier: 6630.0 },
  { gwpVersionCode: 'AR5', gasTypeCode: 'SF6', multiplier: 23500.0 },
  { gwpVersionCode: 'AR5', gasTypeCode: 'NF3', multiplier: 16100.0 },
];

export const SEED_FORMULA_LIBRARIES: Array<{
  library: Partial<FormulaLibrary>;
  defaultVersion: Partial<FormulaVersion>;
}> = [
  {
    library: {
      code: 'ACTIVITY_MULTIPLIER',
      name: 'Activity Multiplier',
      description: 'Standard emission formula: (amount * factor) / 1000',
      category: 'Combustion',
      isSystemDefault: true,
    },
    defaultVersion: {
      version: 1,
      expression: '(amount * factor) / 1000',
      variables: JSON.stringify(['amount', 'factor']),
      isDefault: true,
    },
  },
  {
    library: {
      code: 'DISTANCE_WEIGHT',
      name: 'Distance x Weight Transport',
      description: 'Freight transport formula: (distance * weight * factor) / 1000',
      category: 'Transport',
      isSystemDefault: true,
    },
    defaultVersion: {
      version: 1,
      expression: '(distance * weight * factor) / 1000',
      variables: JSON.stringify(['distance', 'weight', 'factor']),
      isDefault: true,
    },
  },
  {
    library: {
      code: 'SPEND_EEIO',
      name: 'Spend-Based EEIO',
      description: 'Environmentally Extended Input-Output formula: (spend * eeio_factor) / 1000',
      category: 'EEIO',
      isSystemDefault: true,
    },
    defaultVersion: {
      version: 1,
      expression: '(spend * eeio_factor) / 1000',
      variables: JSON.stringify(['spend', 'eeio_factor']),
      isDefault: true,
    },
  },
  {
    library: {
      code: 'FUGITIVE_GWP',
      name: 'Fugitive Refrigerant GWP',
      description: 'Refrigerant leakage formula: (amount * (leakage / 100) * gwp) / 1000',
      category: 'Fugitive',
      isSystemDefault: true,
    },
    defaultVersion: {
      version: 1,
      expression: '(amount * (leakage / 100) * gwp) / 1000',
      variables: JSON.stringify(['amount', 'leakage', 'gwp']),
      isDefault: true,
    },
  },
  {
    library: {
      code: 'INVESTMENT_EQUITY',
      name: 'Investee Equity Share',
      description: 'Scope 3 Category 15 formula: investee_emissions * (equity_share / 100)',
      category: 'Investment',
      isSystemDefault: true,
    },
    defaultVersion: {
      version: 1,
      expression: 'investee_emissions * (equity_share / 100)',
      variables: JSON.stringify(['investee_emissions', 'equity_share']),
      isDefault: true,
    },
  },
];

export const SEED_SUPPLEMENTARY_FIELDS: Partial<SupplementaryFieldDefinition>[] = [
  {
    category: 'Fugitive Emissions',
    fieldKey: 'refrigerantGasType',
    label: 'Refrigerant Gas Type',
    fieldType: 'select',
    options: JSON.stringify(['R-134a', 'R-410A', 'R-404A', 'R-32', 'R-22', 'R-507A']),
    isRequired: true,
    sortOrder: 1,
  },
  {
    category: 'Fugitive Emissions',
    fieldKey: 'leakageRatePercent',
    label: 'Annual Leakage Rate (%)',
    fieldType: 'number',
    defaultValue: '5.0',
    isRequired: false,
    sortOrder: 2,
  },
  {
    category: 'Upstream Transportation',
    fieldKey: 'transportMode',
    label: 'Transport Mode',
    fieldType: 'select',
    options: JSON.stringify(['Heavy Goods Vehicle (HGV)', 'Container Ship (Sea)', 'Air Cargo', 'Rail Freight']),
    isRequired: true,
    sortOrder: 1,
  },
  {
    category: 'Upstream Transportation',
    fieldKey: 'distanceKm',
    label: 'Distance (km)',
    fieldType: 'number',
    isRequired: true,
    sortOrder: 2,
  },
  {
    category: 'Upstream Transportation',
    fieldKey: 'weightTonnes',
    label: 'Cargo Weight (tonnes)',
    fieldType: 'number',
    isRequired: true,
    sortOrder: 3,
  },
  {
    category: 'Investments',
    fieldKey: 'investeeName',
    label: 'Investee Company Name',
    fieldType: 'text',
    isRequired: true,
    sortOrder: 1,
  },
  {
    category: 'Investments',
    fieldKey: 'equitySharePercent',
    label: 'Equity Share (%)',
    fieldType: 'number',
    isRequired: true,
    sortOrder: 2,
  },
];
