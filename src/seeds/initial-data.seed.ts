import { Service } from 'src/entities/service.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { Facility } from 'src/entities/facility.entity';

export const SEED_SERVICES: Partial<Service>[] = [
  { code: 'CARBON', name: 'CageSuite Carbon', description: 'Corporate Carbon Management and Reporting Module', category: 'Carbon', tags: ['Carbon'], demoUrl: '/services/carbon', isActive: true },
  { code: 'CBAM', name: 'CageSuite CBAM', description: 'EU Carbon Border Adjustment Mechanism Module', category: 'CBAM', tags: ['CBAM'], demoUrl: '/services/cbam', isActive: true },
  { code: 'PEF_TEXTILES', name: 'CageSuite PEF', description: 'EU Product Environmental Footprint Module for Textiles & Apparels', category: 'PEF', tags: ['PEF', 'Textiles & Apparels'], demoUrl: '/services/pef_textiles', isActive: true },
  { code: 'LCA_PLASTICS', name: 'CageSuite LCA', description: 'Product Life Cycle Assessment for Plastic Manufacturing', category: 'LCA', tags: ['LCA', 'Plastics'], demoUrl: '/services/lca_plastics', isActive: true },
  { code: 'LCA_METALS', name: 'CageSuite LCA', description: 'Product Life Cycle Assessment for Metal Manufacturing', category: 'LCA', tags: ['LCA', 'Metals'], demoUrl: '/services/lca_metals', isActive: true },
  { code: 'ESG', name: 'CageSuite ESG', description: 'Corporate Sustainability Management and Reporting Module', category: 'ESG', tags: ['ESG'], demoUrl: '/services/esg', isActive: true },
  { code: 'EPD_CABLES', name: 'CageSuite EPD', description: 'Environmental Product Declarations Module for Cable Industry', category: 'EPD', tags: ['EPD', 'Cables'], demoUrl: '/services/epd_cables', isActive: true },
];

export const SEED_SCOPE_ITEMS: Partial<ServiceScopeItem>[] = [
  // Scope 1
  { serviceCode: 'CARBON', scope: 'Scope 1', scopeCode: 'SCOPE_1', name: 'Stationary Combustion', code: 'STATIONARY_COMBUSTION', description: 'Fuel burnt in stationary equipment', sortOrder: 1, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 1', scopeCode: 'SCOPE_1', name: 'Mobile Combustion', code: 'MOBILE_COMBUSTION', description: 'Fuel burnt in company vehicles', sortOrder: 2, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 1', scopeCode: 'SCOPE_1', name: 'Fugitive Emissions', code: 'FUGITIVE_EMISSIONS', description: 'Refrigerants, leaks, and gas escapes', sortOrder: 3, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 1', scopeCode: 'SCOPE_1', name: 'Process Emissions', code: 'PROCESS_EMISSIONS', description: 'Emissions from chemical/physical processes', sortOrder: 4, isActive: true },

  // Scope 2
  { serviceCode: 'CARBON', scope: 'Scope 2', scopeCode: 'SCOPE_2', name: 'Purchased Electricity', code: 'PURCHASED_ELECTRICITY', description: 'Grid electricity consumption', sortOrder: 1, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 2', scopeCode: 'SCOPE_2', name: 'Purchased Heating & Steam', code: 'PURCHASED_HEATING_STEAM', description: 'District heating, cooling & steam', sortOrder: 2, isActive: true },

  // Scope 3
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Purchased Goods and Services', code: 'PURCHASED_GOODS_SERVICES', description: 'Upstream supply chain products/services', sortOrder: 1, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Capital Goods', code: 'CAPITAL_GOODS', description: 'Capital equipment and infrastructure', sortOrder: 2, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Energy and Fuel Related Activities', code: 'ENERGY_FUEL_ACTIVITIES', description: 'Extraction, production of fuels and energy', sortOrder: 3, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Upstream Transportation', code: 'UPSTREAM_TRANSPORTATION', description: 'Freight and logistics by 3rd party providers', sortOrder: 4, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Waste Generated in Operations', code: 'WASTE_GENERATED_OPERATIONS', description: 'Waste disposal and treatment', sortOrder: 5, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Business Travel', code: 'BUSINESS_TRAVEL', description: 'Flights, rail, taxis, hotel stays', sortOrder: 6, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Employee Commuting', code: 'EMPLOYEE_COMMUTING', description: 'Travel between home and workplace', sortOrder: 7, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Downstream Transportation', code: 'DOWNSTREAM_TRANSPORTATION', description: 'Distribution of sold products', sortOrder: 8, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Processing of Sold Products', code: 'PROCESSING_SOLD_PRODUCTS', description: 'Processing of intermediate goods', sortOrder: 9, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Use of Sold Products', code: 'USE_SOLD_PRODUCTS', description: 'Direct use-phase emissions', sortOrder: 10, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'EOL Treatment of Sold Products', code: 'EOL_TREATMENT_SOLD_PRODUCTS', description: 'End of life disposal of products', sortOrder: 11, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Franchise', code: 'FRANCHISE', description: 'Franchise operation emissions', sortOrder: 12, isActive: true },
  { serviceCode: 'CARBON', scope: 'Scope 3', scopeCode: 'SCOPE_3', name: 'Investments', code: 'INVESTMENTS', description: 'Financed emissions and equity investments', sortOrder: 13, isActive: true },
];

export const SEED_EMISSION_FACTORS: Partial<EmissionFactor>[] = [
  // Stationary Combustion
  { category: 'Stationary Combustion', source: 'IPCC (Commercial & Institutional Use)-AR6', version: 'AR6', fuelOrGasType: 'Natural Gas', unit: 'sm3', factor: 1.942, formula: '(amount * factor) / 1000', isActive: true },
  { category: 'Stationary Combustion', source: 'IPCC (Manufacturing & Construction Industries)-AR6', version: 'AR6', fuelOrGasType: 'Natural Gas', unit: 'sm3', factor: 1.938, formula: '(amount * factor) / 1000', isActive: true },
  { category: 'Stationary Combustion', source: 'IPCC (Manufacturing & Construction Industries)-AR6', version: 'AR6', fuelOrGasType: 'Diesel', unit: 'L', factor: 2.634, formula: '(amount * factor) / 1000', isActive: true },

  // Mobile Combustion
  { category: 'Mobile Combustion', source: 'IPCC-AR6', version: 'AR6', fuelOrGasType: 'Diesel - On Road', unit: 'L', factor: 2.666, formula: '(amount * factor) / 1000', isActive: true },

  // Fugitive & Process Emissions
  { category: 'Fugitive Emissions', source: 'IPCC-AR6', version: 'AR6', fuelOrGasType: 'CO2', unit: 'kg', factor: 1.000, formula: '(amount * factor) / 1000', isActive: true },

  // Scope 2: Purchased Electricity
  { category: 'Purchased Electricity', source: 'IEA - 2023 Edition-2021', version: '2023', fuelOrGasType: 'Republic of Türkiye', unit: 'kWh', factor: 0.442, formula: '(amount * factor) / 1000', isActive: true },

  // Scope 3: Purchased Goods
  { category: 'Purchased Goods and Services', source: 'Custom', version: 'Custom', fuelOrGasType: 'Aluminium ingot (India)', unit: 'kg', factor: 2.15, formula: '(amount * factor) / 1000', isActive: true },

  // Scope 3: Upstream & Downstream Transportation
  { category: 'Upstream Transportation', source: 'DEFRA-2024', version: '2024', fuelOrGasType: 'HGV (all diesel), All HGVs, Average laden', unit: 'ton.km', factor: 0.121, formula: '(amount * factor) / 1000', isActive: true },
  { category: 'Downstream Transportation', source: 'DEFRA-2025', version: '2025', fuelOrGasType: 'HGV (all diesel), All HGVs, Average laden', unit: 'tonne', factor: 0.125, formula: '(amount * factor) / 1000', isActive: true },

  // Scope 3: Employee Commuting
  { category: 'Employee Commuting', source: 'IPCC-AR6', version: 'AR6', fuelOrGasType: 'On Road - Diesel', unit: 'L', factor: 2.666, formula: '(amount * factor) / 1000', isActive: true },

  // Scope 3: EOL Treatment
  { category: 'EOL Treatment of Sold Products', source: 'DEFRA', version: 'DEFRA', fuelOrGasType: 'Metal (Mixed Can) - Closed Loop', unit: 'ton', factor: 6.411, formula: '(amount * factor)', isActive: true },
  { category: 'EOL Treatment of Sold Products', source: 'DEFRA', version: 'DEFRA', fuelOrGasType: 'Metal (Mixed Can) - Landfill', unit: 'ton', factor: 8.884, formula: '(amount * factor)', isActive: true },
];

export const SEED_INVENTORY_ENTRIES: Partial<InventoryEntry>[] = [
  // Scope 1: Stationary Combustion
  { organizationId: 1, serviceCode: 'CARBON', category: 'Stationary Combustion', name: 'Natural Gas', amount: 50000, unit: 'sm3', ef: 1.942, efSource: 'IPCC (Commercial & Institutional Use)-AR6', dateFrom: '01.01.2025', dateTo: '31.12.2025', facility: 'Manchester Facility', emission: 97.111, status: 'completed' },

  // Scope 2: Purchased Electricity
  { organizationId: 1, serviceCode: 'CARBON', category: 'Purchased Electricity', name: 'Republic of Türkiye', amount: 32644678, unit: 'kWh', ef: 0.442, efSource: 'IEA - 2023 Edition-2021', dateFrom: '01.01.2024', dateTo: '31.12.2024', facility: 'Manchester Facility', emission: 14428.948, status: 'completed' },

  // Scope 3: Purchased Goods
  { organizationId: 1, serviceCode: 'CARBON', category: 'Purchased Goods and Services', name: 'Aluminium ingot (India)', amount: 150, unit: 'kg', ef: 2.12, efSource: 'Custom-Custom', dateFrom: '10.10.2002', dateTo: '10.10.2002', facility: 'Manchester Facility', emission: 0.318, status: 'completed' },
  { organizationId: 1, serviceCode: 'CARBON', category: 'Purchased Goods and Services', name: 'Aluminium ingot (Russia)', amount: 78000, unit: 'kg', ef: 2.12, efSource: 'Custom-Custom', dateFrom: '01.01.2024', dateTo: '31.12.2024', facility: 'Manchester Facility', emission: 165396, status: 'completed' },

  // Scope 3: Upstream Transportation
  { organizationId: 1, serviceCode: 'CARBON', category: 'Upstream Transportation', name: 'HGV (all diesel), All HGVs, Average laden', amount: 250, unit: 'ton.km', ef: 0.121, efSource: 'DEFRA-2024', dateFrom: '01.04.2024', dateTo: '30.06.2024', facility: 'Leeds Facility', emission: 0.318, status: 'completed' },

  // Scope 3: Waste Generated in Operations
  { organizationId: 1, serviceCode: 'CARBON', category: 'Waste Generated in Operations', name: 'Average Construction - Closed Loop', amount: 1, unit: 'tonne', ef: 0.001, efSource: 'DEFRA-2023', dateFrom: '03.06.2026', dateTo: '10.06.2026', facility: 'Manchester Facility', emission: 1.094, status: 'completed' },

  // Scope 3: Business Travel
  { organizationId: 1, serviceCode: 'CARBON', category: 'Business Travel', name: 'Short Haul - Economy', amount: 1400, unit: 'km', ef: 0.205, efSource: 'DEFRA-2024', dateFrom: '01.01.2024', dateTo: '31.12.2024', facility: 'Manchester Facility', emission: 0.288, status: 'completed' },

  // Scope 3: Employee Commuting
  { organizationId: 1, serviceCode: 'CARBON', category: 'Employee Commuting', name: 'On Road - Diesel', amount: 1500, unit: 'L', ef: 2.666, efSource: 'IPCC-AR6', dateFrom: '01.01.2024', dateTo: '31.12.2024', facility: 'Manchester Facility', emission: 4.002, status: 'completed' },
  { organizationId: 1, serviceCode: 'CARBON', category: 'Employee Commuting', name: 'On Road - Diesel', amount: 920, unit: 'L', ef: 2.666, efSource: 'IPCC-AR6', dateFrom: '01.01.2025', dateTo: '31.12.2025', facility: 'Manchester Facility', emission: 2.453, status: 'completed' },

  // Scope 3: Downstream Transportation
  { organizationId: 1, serviceCode: 'CARBON', category: 'Downstream Transportation', name: 'HGV (all diesel), All HGVs, Average laden', amount: 1, unit: 'tonne', ef: 0.125, efSource: 'DEFRA-2025', dateFrom: '01.01.2024', dateTo: '31.12.2024', facility: 'Manchester Facility', emission: 4382.7, status: 'completed' },
  { organizationId: 1, serviceCode: 'CARBON', category: 'Downstream Transportation', name: 'Cargo Ship, General cargo, Average', amount: 1, unit: 'tonne', ef: 0.016, efSource: 'DEFRA-2024', dateFrom: '01.01.2024', dateTo: '31.12.2024', facility: 'Manchester Facility', emission: 72.945, status: 'completed' },

  // Scope 3: EOL Treatment of Sold Products
  { organizationId: 1, serviceCode: 'CARBON', category: 'EOL Treatment of Sold Products', name: 'Metal (Mixed Can) - Closed Loop', amount: 25, unit: 'ton', ef: 6.411, efSource: 'DEFRA', dateFrom: '01.01.2024', dateTo: '31.12.2024', facility: 'Manchester Facility', emission: 160.265, status: 'completed' },
  { organizationId: 1, serviceCode: 'CARBON', category: 'EOL Treatment of Sold Products', name: 'Metal (Mixed Can) - Landfill', amount: 16.5, unit: 'ton', ef: 8.884, efSource: 'DEFRA', dateFrom: '01.01.2024', dateTo: '31.12.2024', facility: 'Manchester Facility', emission: 146.584, status: 'completed' },
  { organizationId: 1, serviceCode: 'CARBON', category: 'EOL Treatment of Sold Products', name: 'Paper Board - Landfill', amount: 11, unit: 'ton', ef: 1164.489, efSource: 'DEFRA', dateFrom: '01.01.2025', dateTo: '31.12.2025', facility: 'Manchester Facility', emission: 12.809, status: 'completed' },
];

export const SEED_FACILITIES: Partial<Facility>[] = [
  {
    organizationId: 1,
    name: 'WD Solutions Co. LLC',
    address: 'Full installation address, London',
    countryCode: 'UK',
    postCode: 'EC1A 1BB',
    unLocode: 'GB LON',
    isActive: true,
  },
  {
    organizationId: 1,
    name: 'Manchester Facility',
    address: '100 Industrial Estate, Manchester',
    countryCode: 'UK',
    postCode: 'M1 1AA',
    unLocode: 'GB MAN',
    isActive: true,
  },
];
