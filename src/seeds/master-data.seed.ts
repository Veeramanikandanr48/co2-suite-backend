import { MasterScope } from 'src/entities/master-scope.entity';
import { MasterCategory } from 'src/entities/master-category.entity';
import { MasterDatasource } from 'src/entities/master-datasource.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { MasterUnit } from 'src/entities/master-unit.entity';

// ─── Scope seed ───────────────────────────────────────────────────────────────

export const SEED_MASTER_SCOPES: Partial<MasterScope>[] = [
  { id: 1, name: 'Scope 1', code: 'S1', description: 'Direct GHG Emissions from owned or controlled sources', isActive: true },
  { id: 2, name: 'Scope 2', code: 'S2', description: 'Indirect GHG Emissions from purchased electricity, heating & cooling', isActive: true },
  { id: 3, name: 'Scope 3', code: 'S3', description: 'All other indirect emissions across value chain', isActive: true },
];

// ─── Category seed (NO formConfig — auto-built from form field seed) ──────────

export const SEED_MASTER_CATEGORIES: Partial<MasterCategory>[] = [
  // Scope 1
  { scopeId: 1, scope: 'Scope 1', name: 'Stationary Combustion', code: 'SC', description: 'Boilers, DG sets, burners, cook stoves', isActive: true },
  { scopeId: 1, scope: 'Scope 1', name: 'Mobile Combustion', code: 'MC', description: 'Cars, vans, heavy vehicles, company fleet', isActive: true },
  { scopeId: 1, scope: 'Scope 1', name: 'Fugitive Emissions', code: 'FE', description: 'AC refrigerants, fire extinguishers, gas leaks', isActive: true },
  { scopeId: 1, scope: 'Scope 1', name: 'Process Emissions', code: 'DPE', description: 'Welding, cutting, polishing, cleaning, chemical processes', isActive: true },
  // Scope 2
  { scopeId: 2, scope: 'Scope 2', name: 'Purchased Electricity', code: 'PE', description: 'Facility grid electricity consumption', isActive: true },
  { scopeId: 2, scope: 'Scope 2', name: 'Purchased Heating & Cooling', code: 'PHC', description: 'District heating, cooling, and industrial steam', isActive: true },
  // Scope 3
  { scopeId: 3, scope: 'Scope 3', name: 'Purchased Goods and Services', code: 'PGS', description: 'Upstream product materials and purchased services', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Capital Goods', code: 'CG', description: 'Capital equipment, plant machinery, buildings', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Fuel- and Energy-Related Activities', code: 'FERA', description: 'Upstream fuel emissions and T&D losses', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Upstream Transportation and Distribution', code: 'UTD', description: 'Tier 1 supplier freight and logistics', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Waste Generated in Operations', code: 'WGB', description: 'Solid waste, wastewater, recycling, composting', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Business Travel', code: 'BT', description: 'Flights, train, taxi, hotel stays', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Employee Commuting', code: 'EC', description: 'Employee daily commute and teleworking', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Downstream Transportation and Distribution', code: 'DTD', description: 'Distribution of sold products to end customers', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Processing of Sold Products', code: 'PSP', description: 'Intermediate products processed by 3rd parties', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Use of Sold Products', code: 'USP', description: 'Direct lifetime use emissions of sold goods', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'End-of-Life Treatment of Sold Products', code: 'EOL', description: 'Disposal and recycling of sold products at end of life', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Franchises', code: 'FR', description: 'Independent franchise operations', isActive: true },
  { scopeId: 3, scope: 'Scope 3', name: 'Investments', code: 'INV', description: 'Financed emissions and equity investments', isActive: true },
];

// ─── Datasource seed ──────────────────────────────────────────────────────────

export const SEED_MASTER_DATASOURCES: Partial<MasterDatasource>[] = [
  { name: 'DEFRA 2024', code: 'DEFRA', description: 'UK Department for Environment, Food & Rural Affairs', isActive: true },
  { name: 'IPCC', code: 'IPCC', description: 'Intergovernmental Panel on Climate Change Guidelines', isActive: true },
  { name: 'DEWA (Dubai)', code: 'DEWA', description: 'Dubai Electricity and Water Authority Grid Factor', isActive: true },
  { name: 'India (CEA)', code: 'INDIA_CEA', description: 'India Central Electricity Authority Grid Factors', isActive: true },
  { name: 'Local Authority', code: 'LOCAL_AUTHORITY', description: 'Local municipal utility grid provider factor', isActive: true },
  { name: 'IAEG', code: 'IAEG', description: 'International Aerospace Environmental Group Scope 3 Factors', isActive: true },
  { name: 'Custom', code: 'CUSTOM', description: 'User-defined custom factor datasource', isActive: true },
];

export const SEED_MASTER_FACTOR_VERSIONS: Partial<MasterFactorVersion>[] = [
  { datasourceId: 1, version: '2024', year: 2024, description: 'DEFRA 2024 conversion factors', isActive: true },
  { datasourceId: 2, version: 'AR6', year: 2021, description: 'IPCC 6th Assessment Report GWP values', isActive: true },
  { datasourceId: 2, version: 'AR5', year: 2014, description: 'IPCC 5th Assessment Report GWP values', isActive: true },
  { datasourceId: 3, version: '2023', year: 2023, description: 'DEWA 2023 Grid Emission Factor', isActive: true },
  { datasourceId: 4, version: '2023', year: 2023, description: 'CEA India Grid Baseline Database v19', isActive: true },
  { datasourceId: 7, version: 'Custom', year: 2026, description: 'Custom Version', isActive: true },
];

export const SEED_MASTER_FUELS: Partial<MasterFuel>[] = [
  // Stationary
  { scopeId: 1, name: 'Diesel', code: 'DIESEL', description: 'Stationary diesel fuel', isActive: true },
  { scopeId: 1, name: 'Petrol', code: 'PETROL', description: 'Stationary motor gasoline', isActive: true },
  { scopeId: 1, name: 'Natural Gas', code: 'NAT_GAS', description: 'Grid natural gas', isActive: true },
  { scopeId: 1, name: 'LPG', code: 'LPG', description: 'Liquefied Petroleum Gas', isActive: true },
  { scopeId: 1, name: 'Butane', code: 'BUTANE', description: 'Butane gas', isActive: true },
  { scopeId: 1, name: 'Boiler Fuel', code: 'BOILER_FUEL', description: 'Boiler stationary fuel', isActive: true },
  { scopeId: 1, name: 'DG Set Generator', code: 'DG_SET', description: 'Diesel generator set fuel', isActive: true },
  { scopeId: 1, name: 'Burner Fuel', code: 'BURNER', description: 'Industrial burner fuel', isActive: true },
  { scopeId: 1, name: 'Cook Stove Gas', code: 'COOK_STOVE', description: 'Commercial cooking fuel', isActive: true },
  // Mobile
  { scopeId: 1, name: 'Car (Petrol)', code: 'MOB_CAR_PETROL', description: 'Fleet passenger car petrol', isActive: true },
  { scopeId: 1, name: 'Car (Diesel)', code: 'MOB_CAR_DIESEL', description: 'Fleet passenger car diesel', isActive: true },
  { scopeId: 1, name: 'Van (Diesel)', code: 'MOB_VAN', description: 'Light commercial van', isActive: true },
  { scopeId: 1, name: 'Heavy Vehicle (HV)', code: 'MOB_HV', description: 'Heavy goods vehicle / truck', isActive: true },
  { scopeId: 1, name: 'Motorcycle', code: 'MOB_MC', description: 'Two-wheeler motorcycle', isActive: true },
  // Fugitive
  { scopeId: 1, name: 'R-410A', code: 'R410A', description: 'HFC blend refrigerant R-410A', isActive: true },
  { scopeId: 1, name: 'R-134a', code: 'R134A', description: 'HFC refrigerant R-134a', isActive: true },
  { scopeId: 1, name: 'R-22', code: 'R22', description: 'HCFC refrigerant R-22', isActive: true },
  { scopeId: 1, name: 'CO2 (Fire Extinguisher)', code: 'CO2_EXT', description: 'Fire suppressant CO2 gas', isActive: true },
  { scopeId: 1, name: 'FM200', code: 'FM200', description: 'Fire suppression FM200 gas', isActive: true },
  { scopeId: 1, name: 'Novec 1230', code: 'NOVEC1230', description: 'Fire suppression fluid', isActive: true },
  // Process
  { scopeId: 1, name: 'Welding Gas', code: 'PROC_WELDING', description: 'Process welding gas emission', isActive: true },
  { scopeId: 1, name: 'Cutting Gas', code: 'PROC_CUTTING', description: 'Thermal cutting process emission', isActive: true },
  { scopeId: 1, name: 'Polishing Process', code: 'PROC_POLISHING', description: 'Abrasive polishing process emission', isActive: true },
  { scopeId: 1, name: 'Cleaning Chemical Process', code: 'PROC_CLEANING', description: 'Solvent cleaning process emission', isActive: true },
  // Scope 2
  { scopeId: 2, name: 'Grid Electricity', code: 'GRID_ELEC', description: 'Purchased grid electricity', isActive: true },
  { scopeId: 2, name: 'District Heating & Cooling', code: 'DIST_HEAT_COOL', description: 'District energy heating & cooling', isActive: true },
  // Scope 3 Waste
  { scopeId: 3, name: 'Paper & Board', code: 'WASTE_PAPER', description: 'Waste paper and cardboard', isActive: true },
  { scopeId: 3, name: 'Plastics', code: 'WASTE_PLASTICS', description: 'Mixed waste plastics', isActive: true },
  { scopeId: 3, name: 'Metals', code: 'WASTE_METALS', description: 'Scrap metal waste', isActive: true },
  { scopeId: 3, name: 'Food & Organic Waste', code: 'WASTE_FOOD', description: 'Organic food waste', isActive: true },
  // Scope 3 Travel & Transport
  { scopeId: 3, name: 'Air - Domestic Flight', code: 'AIR_DOMESTIC', description: 'Domestic flight travel', isActive: true },
  { scopeId: 3, name: 'Air - Short Haul Flight', code: 'AIR_SHORT_HAUL', description: 'Short-haul flight travel', isActive: true },
  { scopeId: 3, name: 'Air - Long Haul Flight', code: 'AIR_LONG_HAUL', description: 'Long-haul flight travel', isActive: true },
  { scopeId: 3, name: 'Land - Rail / Train', code: 'LAND_TRAIN', description: 'Rail passenger transport', isActive: true },
  { scopeId: 3, name: 'Land - Bus / Coach', code: 'LAND_BUS', description: 'Bus passenger transport', isActive: true },
  { scopeId: 3, name: 'Water - Ferry (Passenger)', code: 'WATER_FERRY', description: 'Water ferry transport', isActive: true },
  { scopeId: 3, name: 'HGV Freight (Road)', code: 'FREIGHT_ROAD', description: 'Road freight transportation', isActive: true },
  { scopeId: 3, name: 'Cargo Ship (Sea Freight)', code: 'FREIGHT_SEA', description: 'Sea freight cargo transportation', isActive: true },
];

export const SEED_MASTER_UNITS: Partial<MasterUnit>[] = [
  { name: 'Litre', symbol: 'L', description: 'Liquid volume in litres', isActive: true },
  { name: 'Standard Cubic Metre', symbol: 'sm3', description: 'Gas volume in standard m3', isActive: true },
  { name: 'Kilogram', symbol: 'kg', description: 'Mass in kilograms', isActive: true },
  { name: 'Cubic Metre', symbol: 'm3', description: 'Volume in cubic metres', isActive: true },
  { name: 'Kilowatt Hour', symbol: 'kWh', description: 'Energy in kilowatt hours', isActive: true },
  { name: 'Megawatt Hour', symbol: 'MWh', description: 'Energy in megawatt hours', isActive: true },
  { name: 'Kilometer', symbol: 'km', description: 'Distance in kilometers', isActive: true },
  { name: 'Tonne Kilometer', symbol: 'tonne.km', description: 'Freight volume in tonne-kilometers', isActive: true },
  { name: 'Passenger Kilometer', symbol: 'pas.km', description: 'Passenger distance in pas-km', isActive: true },
  { name: 'Metric Tonne', symbol: 'ton', description: 'Mass in metric tonnes', isActive: true },
  { name: 'US Dollar', symbol: 'USD', description: 'Monetary spend in USD', isActive: true },
  { name: 'Gigajoule', symbol: 'GJ', description: 'Energy in gigajoules', isActive: true },
];

// ─── Form Fields seed (normalized — replaces all formConfig.fields inline data) ──

/**
 * Each entry maps to one row in master_form_field.
 * Resolved to a categoryId via categoryCode during bootstrap seeding.
 * optionsSource: 'fuels' | 'units' = pull from master table, no master_option rows needed.
 */
export interface SeedFormField {
  categoryCode: string;
  categoryName?: string;
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  unit?: string;
  optionsSource?: string;
  required?: boolean;
  sortOrder?: number;
}

export const SEED_MASTER_FORM_FIELDS: SeedFormField[] = [
  // ── Stationary Combustion (SC) ──────────────────────────────────────────────
  { categoryCode: 'SC', key: 'inventoryName', label: 'Emission Source Equipment', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'SC', key: 'fuelOrGasType', label: 'Fuel Type', type: 'select', optionsSource: 'fuels', required: true, sortOrder: 1 },
  { categoryCode: 'SC', key: 'amount', label: 'Activity Data Amount (Litre)', type: 'number', placeholder: 'Please enter fuel volume in Litre (L)', unit: 'L', required: true, sortOrder: 2 },

  // ── Mobile Combustion (MC) ────────────────────────────────────────────────────
  { categoryCode: 'MC', key: 'inventoryName', label: 'Vehicle Type', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'MC', key: 'fuelOrGasType', label: 'Fuel Type', type: 'select', optionsSource: 'fuels', required: true, sortOrder: 1 },
  { categoryCode: 'MC', key: 'amount', label: 'Activity Data (Litre / Km)', type: 'number', placeholder: 'Please enter volume in Litre (L) or Distance (Km)', required: true, sortOrder: 2 },

  // ── Fugitive Emissions (FE) ──────────────────────────────────────────────────
  { categoryCode: 'FE', key: 'fuelOrGasType', label: 'Gas / Refrigerant Type (AC / Fire Extinguisher)', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'FE', key: 'fugitiveType', label: 'Calculation Method', type: 'radio', required: true, sortOrder: 1 },
  { categoryCode: 'FE', key: 'leakagePercent', label: 'Leakage (%)', type: 'number', placeholder: 'Please enter leakage %', sortOrder: 2 },
  { categoryCode: 'FE', key: 'amount', label: 'Activity Data Amount (kg)', type: 'number', placeholder: 'Please enter amount in kg', unit: 'kg', required: true, sortOrder: 3 },

  // ── Process Emissions (DPE) ──────────────────────────────────────────────────
  { categoryCode: 'DPE', key: 'inventoryName', label: 'Process Emission Activity', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'DPE', key: 'amount', label: 'Manual Data Entry Amount (kg CO₂e)', type: 'number', placeholder: 'Please enter process emission amount', unit: 'kgCO2', required: true, sortOrder: 1 },
  { categoryCode: 'DPE', key: 'dataAcquisitionMethod', label: 'Data Acquisition Method', type: 'select', sortOrder: 2 },

  // ── Purchased Electricity (PE) ───────────────────────────────────────────────
  { categoryCode: 'PE', key: 'fuelOrGasType', label: 'Supplier / Energy Subtype', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'PE', key: 'energyAmount', label: 'Energy Amount', type: 'number', placeholder: 'e.g. 12500', required: true, sortOrder: 1 },
  { categoryCode: 'PE', key: 'unit', label: 'Energy Unit', type: 'select', required: true, sortOrder: 2 },

  // ── Purchased Heating & Cooling (PHC) ───────────────────────────────────────
  { categoryCode: 'PHC', key: 'fuelOrGasType', label: 'Heating & Cooling Subtype', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'PHC', key: 'energyAmount', label: 'Consumption Amount', type: 'number', placeholder: 'e.g. 5000', required: true, sortOrder: 1 },
  { categoryCode: 'PHC', key: 'unit', label: 'Energy Unit', type: 'select', required: true, sortOrder: 2 },

  // ── Purchased Goods and Services (PGS) ─────────────────────────────────────
  { categoryCode: 'PGS', key: 'goodsCategory', label: 'Goods / Service Category', type: 'text', placeholder: 'e.g. Raw Materials / IT Services', required: true, sortOrder: 0 },
  { categoryCode: 'PGS', key: 'goodsSubCategory', label: 'Sub-Category', type: 'text', placeholder: 'e.g. Steel Alloys / Consulting', sortOrder: 1 },
  { categoryCode: 'PGS', key: 'amount', label: 'Activity Data Amount (kg / ton / USD)', type: 'number', placeholder: 'Please enter activity amount', required: true, sortOrder: 2 },

  // ── Capital Goods (CG) ───────────────────────────────────────────────────────
  { categoryCode: 'CG', key: 'goodsCategory', label: 'Capital Goods Category', type: 'text', placeholder: 'e.g. Machinery / Vehicles', required: true, sortOrder: 0 },
  { categoryCode: 'CG', key: 'goodsSubCategory', label: 'Asset Sub-Category', type: 'text', placeholder: 'e.g. CNC Lathe / Delivery Truck', sortOrder: 1 },
  { categoryCode: 'CG', key: 'amount', label: 'Activity Data Amount (units / USD)', type: 'number', placeholder: 'Please enter quantity or spend', required: true, sortOrder: 2 },

  // ── Fuel and Energy Related Activities (FERA) ───────────────────────────────
  { categoryCode: 'FERA', key: 'fuelType', label: 'Energy Sub-Type / Scope Connection', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'FERA', key: 'amount', label: 'Activity Data Amount (kWh / Litre)', type: 'number', placeholder: 'Please enter energy or fuel activity data', required: true, sortOrder: 1 },

  // ── Upstream Transportation and Distribution (UTD) ──────────────────────────
  { categoryCode: 'UTD', key: 'transportMode', label: 'Mode of Transport', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'UTD', key: 'typeOption', label: 'Vehicle / Freight Type', type: 'text', placeholder: 'e.g. HGV (all diesel)', sortOrder: 1 },
  { categoryCode: 'UTD', key: 'sizeOption', label: 'Vehicle Size / Fuel Load', type: 'text', placeholder: 'e.g. Rigid (>7.5t - 17t) / 100% Laden', sortOrder: 2 },
  { categoryCode: 'UTD', key: 'distance', label: 'Distance (km)', type: 'number', placeholder: 'Please enter transport distance in km', sortOrder: 3 },
  { categoryCode: 'UTD', key: 'amount', label: 'Activity Data (Weight in tonnes / ton.km)', type: 'number', placeholder: 'Please enter weight or t-km', required: true, sortOrder: 4 },

  // ── Waste Generated in Operations (WGB) ─────────────────────────────────────
  { categoryCode: 'WGB', key: 'sourceOption', label: 'Waste Category', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'WGB', key: 'wasteType', label: 'Waste Type', type: 'select', required: true, sortOrder: 1 },
  { categoryCode: 'WGB', key: 'wasteHandling', label: 'Waste Handling / Disposal Method', type: 'select', required: true, sortOrder: 2 },
  { categoryCode: 'WGB', key: 'amount', label: 'Activity Data Amount (ton)', type: 'number', placeholder: 'Please enter waste quantity in tonnes (ton)', unit: 'ton', required: true, sortOrder: 3 },

  // ── Business Travel (BT) ────────────────────────────────────────────────────
  { categoryCode: 'BT', key: 'transportMode', label: 'Mode of Transport', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'BT', key: 'inventoryName', label: 'Category / Subcategory', type: 'text', placeholder: 'e.g. Executive Travel', sortOrder: 1 },
  { categoryCode: 'BT', key: 'typeOption', label: 'Vehicle / Flight Type', type: 'text', placeholder: 'e.g. Medium Car / Boeing 777', sortOrder: 2 },
  { categoryCode: 'BT', key: 'withRf', label: 'Radiative Forcing (RF)', type: 'radio', sortOrder: 3 },
  { categoryCode: 'BT', key: 'amount', label: 'Activity Data (pas.km / km)', type: 'number', placeholder: 'Please enter distance in passenger km', required: true, sortOrder: 4 },

  // ── Employee Commuting (EC) ─────────────────────────────────────────────────
  { categoryCode: 'EC', key: 'transportMode', label: 'Mode of Transport', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'EC', key: 'employeeName', label: 'Name of Employee / Team', type: 'text', placeholder: 'e.g. John Doe / Team Alpha', required: true, sortOrder: 1 },
  { categoryCode: 'EC', key: 'daysTravelled', label: 'No. of Days Travelled (TD)', type: 'number', placeholder: 'e.g. 220 days', required: true, sortOrder: 2 },
  { categoryCode: 'EC', key: 'dailyDistance', label: 'Daily Travel Distance (AD km)', type: 'number', placeholder: 'e.g. 25 km', required: true, sortOrder: 3 },

  // ── Downstream Transportation and Distribution (DTD) ────────────────────────
  { categoryCode: 'DTD', key: 'transportMode', label: 'Mode of Transport', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'DTD', key: 'typeOption', label: 'Vehicle / Freight Type', type: 'text', placeholder: 'e.g. HGV (all diesel)', sortOrder: 1 },
  { categoryCode: 'DTD', key: 'distance', label: 'Distance (km)', type: 'number', placeholder: 'Please enter transport distance in km', sortOrder: 2 },
  { categoryCode: 'DTD', key: 'amount', label: 'Activity Data (Weight in tonnes / ton.km)', type: 'number', placeholder: 'Please enter weight or t-km', required: true, sortOrder: 3 },

  // ── Processing of Sold Products (PSP) ───────────────────────────────────────
  { categoryCode: 'PSP', key: 'goodsCategory', label: 'Product Type', type: 'text', placeholder: 'e.g. Plastic Granules / Steel Sheets', required: true, sortOrder: 0 },
  { categoryCode: 'PSP', key: 'amount', label: 'Quantity Sold (kg / ton)', type: 'number', placeholder: 'Please enter quantity', required: true, sortOrder: 1 },

  // ── Use of Sold Products (USP) ──────────────────────────────────────────────
  { categoryCode: 'USP', key: 'inventoryName', label: 'Product Name / Type', type: 'text', placeholder: 'e.g. Electric Vehicle / Gas Heater', required: true, sortOrder: 0 },
  { categoryCode: 'USP', key: 'amount', label: 'Total Lifetime Energy / Gas Consumed', type: 'number', placeholder: 'Please enter lifetime energy use', required: true, sortOrder: 1 },

  // ── End-of-Life Treatment of Sold Products (EOL) ────────────────────────────
  { categoryCode: 'EOL', key: 'wasteType', label: 'Product Material Type', type: 'select', required: true, sortOrder: 0 },
  { categoryCode: 'EOL', key: 'wasteHandling', label: 'Disposal Method', type: 'select', required: true, sortOrder: 1 },
  { categoryCode: 'EOL', key: 'amount', label: 'Quantity Sold at End of Life (ton)', type: 'number', placeholder: 'Please enter mass in tonnes', required: true, sortOrder: 2 },

  // ── Franchises (FR) ─────────────────────────────────────────────────────────
  { categoryCode: 'FR', key: 'inventoryName', label: 'Franchise Location / Name', type: 'text', placeholder: 'e.g. Branch #104', required: true, sortOrder: 0 },
  { categoryCode: 'FR', key: 'amount', label: 'Total Franchise Energy Use (kWh)', type: 'number', placeholder: 'Please enter franchise energy consumption', required: true, sortOrder: 1 },

  // ── Investments (INV) ───────────────────────────────────────────────────────
  { categoryCode: 'INV', key: 'inventoryName', label: 'Investee Company Name', type: 'text', placeholder: 'e.g. Apex Tech Ltd.', required: true, sortOrder: 0 },
  { categoryCode: 'INV', key: 'investeeScope1', label: 'Investee Scope 1 Emissions (tCO₂e)', type: 'number', placeholder: 'e.g. 5000', sortOrder: 1 },
  { categoryCode: 'INV', key: 'investeeScope2', label: 'Investee Scope 2 Emissions (tCO₂e)', type: 'number', placeholder: 'e.g. 1200', sortOrder: 2 },
  { categoryCode: 'INV', key: 'equityShare', label: 'Equity Share Percentage (%)', type: 'number', placeholder: 'e.g. 25%', required: true, sortOrder: 3 },
];

// ─── Options seed (normalized — one row per dropdown/radio choice) ─────────────

/**
 * Each entry maps to one row in master_option.
 * Resolved to formFieldId via categoryCode + fieldKey during bootstrap seeding.
 */
export interface SeedOption {
  categoryCode: string;
  fieldKey: string;
  label: string;
  value: string;
  sortOrder?: number;
}

export const SEED_MASTER_OPTIONS: SeedOption[] = [
  // ── SC: inventoryName options ──────────────────────────────────────────────
  { categoryCode: 'SC', fieldKey: 'inventoryName', label: 'Boiler', value: 'Boiler', sortOrder: 0 },
  { categoryCode: 'SC', fieldKey: 'inventoryName', label: 'DG Set (Generator)', value: 'DG Set (Generator)', sortOrder: 1 },
  { categoryCode: 'SC', fieldKey: 'inventoryName', label: 'Burner', value: 'Burner', sortOrder: 2 },
  { categoryCode: 'SC', fieldKey: 'inventoryName', label: 'Cook Stove', value: 'Cook Stove', sortOrder: 3 },
  { categoryCode: 'SC', fieldKey: 'inventoryName', label: 'Furnace / Heater', value: 'Furnace / Heater', sortOrder: 4 },

  // ── MC: inventoryName options ──────────────────────────────────────────────
  { categoryCode: 'MC', fieldKey: 'inventoryName', label: 'Car', value: 'Car', sortOrder: 0 },
  { categoryCode: 'MC', fieldKey: 'inventoryName', label: 'Van', value: 'Van', sortOrder: 1 },
  { categoryCode: 'MC', fieldKey: 'inventoryName', label: 'Heavy Vehicle (HV)', value: 'Heavy Vehicle (HV)', sortOrder: 2 },
  { categoryCode: 'MC', fieldKey: 'inventoryName', label: 'Motorcycle', value: 'Motorcycle', sortOrder: 3 },

  // ── FE: fuelOrGasType options ──────────────────────────────────────────────
  { categoryCode: 'FE', fieldKey: 'fuelOrGasType', label: 'R-410A', value: 'R-410A', sortOrder: 0 },
  { categoryCode: 'FE', fieldKey: 'fuelOrGasType', label: 'R-134a', value: 'R-134a', sortOrder: 1 },
  { categoryCode: 'FE', fieldKey: 'fuelOrGasType', label: 'R-22', value: 'R-22', sortOrder: 2 },
  { categoryCode: 'FE', fieldKey: 'fuelOrGasType', label: 'CO2 (Fire Extinguisher)', value: 'CO2 (Fire Extinguisher)', sortOrder: 3 },
  { categoryCode: 'FE', fieldKey: 'fuelOrGasType', label: 'FM200', value: 'FM200', sortOrder: 4 },
  { categoryCode: 'FE', fieldKey: 'fuelOrGasType', label: 'Novec 1230', value: 'Novec 1230', sortOrder: 5 },
  { categoryCode: 'FE', fieldKey: 'fuelOrGasType', label: 'HFC-32', value: 'HFC-32', sortOrder: 6 },
  // FE: fugitiveType options
  { categoryCode: 'FE', fieldKey: 'fugitiveType', label: 'Filling', value: 'filling', sortOrder: 0 },
  { categoryCode: 'FE', fieldKey: 'fugitiveType', label: 'Leakage', value: 'leakage', sortOrder: 1 },

  // ── DPE: inventoryName options ─────────────────────────────────────────────
  { categoryCode: 'DPE', fieldKey: 'inventoryName', label: 'Welding', value: 'Welding', sortOrder: 0 },
  { categoryCode: 'DPE', fieldKey: 'inventoryName', label: 'Cutting', value: 'Cutting', sortOrder: 1 },
  { categoryCode: 'DPE', fieldKey: 'inventoryName', label: 'Polishing', value: 'Polishing', sortOrder: 2 },
  { categoryCode: 'DPE', fieldKey: 'inventoryName', label: 'Cleaning', value: 'Cleaning', sortOrder: 3 },
  { categoryCode: 'DPE', fieldKey: 'inventoryName', label: 'Chemical Reaction', value: 'Chemical Reaction', sortOrder: 4 },
  // DPE: dataAcquisitionMethod options
  { categoryCode: 'DPE', fieldKey: 'dataAcquisitionMethod', label: 'Direct Mass Balance', value: 'Direct Mass Balance', sortOrder: 0 },
  { categoryCode: 'DPE', fieldKey: 'dataAcquisitionMethod', label: 'Stoichiometric Model', value: 'Stoichiometric Model', sortOrder: 1 },
  { categoryCode: 'DPE', fieldKey: 'dataAcquisitionMethod', label: 'Continuous Emission Monitoring (CEMS)', value: 'Continuous Emission Monitoring (CEMS)', sortOrder: 2 },
  { categoryCode: 'DPE', fieldKey: 'dataAcquisitionMethod', label: 'Sample Analysis', value: 'Sample Analysis', sortOrder: 3 },

  // ── PE: fuelOrGasType options ──────────────────────────────────────────────
  { categoryCode: 'PE', fieldKey: 'fuelOrGasType', label: 'Grid Electricity', value: 'Grid Electricity', sortOrder: 0 },
  { categoryCode: 'PE', fieldKey: 'fuelOrGasType', label: 'Renewable Solar PPA', value: 'Renewable Solar PPA', sortOrder: 1 },
  { categoryCode: 'PE', fieldKey: 'fuelOrGasType', label: 'Green Tariff Grid', value: 'Green Tariff Grid', sortOrder: 2 },
  // PE: unit options
  { categoryCode: 'PE', fieldKey: 'unit', label: 'kWh', value: 'kWh', sortOrder: 0 },
  { categoryCode: 'PE', fieldKey: 'unit', label: 'MWh', value: 'MWh', sortOrder: 1 },

  // ── PHC: fuelOrGasType options ─────────────────────────────────────────────
  { categoryCode: 'PHC', fieldKey: 'fuelOrGasType', label: 'District Heating', value: 'District Heating', sortOrder: 0 },
  { categoryCode: 'PHC', fieldKey: 'fuelOrGasType', label: 'District Chilled Water', value: 'District Chilled Water', sortOrder: 1 },
  { categoryCode: 'PHC', fieldKey: 'fuelOrGasType', label: 'Industrial Steam', value: 'Industrial Steam', sortOrder: 2 },
  // PHC: unit options
  { categoryCode: 'PHC', fieldKey: 'unit', label: 'kWh', value: 'kWh', sortOrder: 0 },
  { categoryCode: 'PHC', fieldKey: 'unit', label: 'MWh', value: 'MWh', sortOrder: 1 },
  { categoryCode: 'PHC', fieldKey: 'unit', label: 'GJ', value: 'GJ', sortOrder: 2 },

  // ── FERA: fuelType options ─────────────────────────────────────────────────
  { categoryCode: 'FERA', fieldKey: 'fuelType', label: 'Scope 1 - Upstream Emissions from Purchased Fuels (DEFRA)', value: 'Scope 1 - Upstream Emissions from Purchased Fuels (DEFRA)', sortOrder: 0 },
  { categoryCode: 'FERA', fieldKey: 'fuelType', label: 'Scope 2 - Transmission & Distribution (T&D) Loss (%)', value: 'Scope 2 - Transmission & Distribution (T&D) Loss (%)', sortOrder: 1 },

  // ── UTD: transportMode options ─────────────────────────────────────────────
  { categoryCode: 'UTD', fieldKey: 'transportMode', label: 'Land (HGV / Freight Train)', value: 'Land (HGV / Freight Train)', sortOrder: 0 },
  { categoryCode: 'UTD', fieldKey: 'transportMode', label: 'Air Freight', value: 'Air Freight', sortOrder: 1 },
  { categoryCode: 'UTD', fieldKey: 'transportMode', label: 'Sea Freight (Cargo Ship)', value: 'Sea Freight (Cargo Ship)', sortOrder: 2 },

  // ── WGB: sourceOption options ──────────────────────────────────────────────
  { categoryCode: 'WGB', fieldKey: 'sourceOption', label: 'Solid Waste', value: 'Solid Waste', sortOrder: 0 },
  { categoryCode: 'WGB', fieldKey: 'sourceOption', label: 'Liquid / Wastewater', value: 'Liquid / Wastewater', sortOrder: 1 },
  { categoryCode: 'WGB', fieldKey: 'sourceOption', label: 'Hazardous Waste', value: 'Hazardous Waste', sortOrder: 2 },
  // WGB: wasteType options
  { categoryCode: 'WGB', fieldKey: 'wasteType', label: 'Paper & Board', value: 'Paper & Board', sortOrder: 0 },
  { categoryCode: 'WGB', fieldKey: 'wasteType', label: 'Plastics', value: 'Plastics', sortOrder: 1 },
  { categoryCode: 'WGB', fieldKey: 'wasteType', label: 'Metals', value: 'Metals', sortOrder: 2 },
  { categoryCode: 'WGB', fieldKey: 'wasteType', label: 'Food & Organic Waste', value: 'Food & Organic Waste', sortOrder: 3 },
  { categoryCode: 'WGB', fieldKey: 'wasteType', label: 'Mixed Commercial Waste', value: 'Mixed Commercial Waste', sortOrder: 4 },
  // WGB: wasteHandling options
  { categoryCode: 'WGB', fieldKey: 'wasteHandling', label: 'Open Loop Recycling', value: 'Open Loop Recycling', sortOrder: 0 },
  { categoryCode: 'WGB', fieldKey: 'wasteHandling', label: 'Closed Loop Recycling', value: 'Closed Loop Recycling', sortOrder: 1 },
  { categoryCode: 'WGB', fieldKey: 'wasteHandling', label: 'Incineration (with energy recovery)', value: 'Incineration (with energy recovery)', sortOrder: 2 },
  { categoryCode: 'WGB', fieldKey: 'wasteHandling', label: 'Composting', value: 'Composting', sortOrder: 3 },
  { categoryCode: 'WGB', fieldKey: 'wasteHandling', label: 'Landfill', value: 'Landfill', sortOrder: 4 },
  { categoryCode: 'WGB', fieldKey: 'wasteHandling', label: 'Anaerobic Digestion', value: 'Anaerobic Digestion', sortOrder: 5 },

  // ── BT: transportMode options ──────────────────────────────────────────────
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Land - Car (Taxi / Leased)', value: 'Land - Car (Taxi / Leased)', sortOrder: 0 },
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Land - Rail / Train', value: 'Land - Rail / Train', sortOrder: 1 },
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Land - Bus / Coach', value: 'Land - Bus / Coach', sortOrder: 2 },
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Air - Domestic Flight', value: 'Air - Domestic Flight', sortOrder: 3 },
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Air - Short Haul Flight', value: 'Air - Short Haul Flight', sortOrder: 4 },
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Air - Long Haul Flight', value: 'Air - Long Haul Flight', sortOrder: 5 },
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Air - International First/Business', value: 'Air - International First/Business', sortOrder: 6 },
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Water - Ferry (Passenger)', value: 'Water - Ferry (Passenger)', sortOrder: 7 },
  { categoryCode: 'BT', fieldKey: 'transportMode', label: 'Water - Cruise / Boat', value: 'Water - Cruise / Boat', sortOrder: 8 },
  // BT: withRf options
  { categoryCode: 'BT', fieldKey: 'withRf', label: 'With Radiative Forcing', value: 'With Radiative Forcing', sortOrder: 0 },
  { categoryCode: 'BT', fieldKey: 'withRf', label: 'Without RF', value: 'Without RF', sortOrder: 1 },

  // ── EC: transportMode options ──────────────────────────────────────────────
  { categoryCode: 'EC', fieldKey: 'transportMode', label: 'Land - Car (Petrol)', value: 'Land - Car (Petrol)', sortOrder: 0 },
  { categoryCode: 'EC', fieldKey: 'transportMode', label: 'Land - Car (Diesel)', value: 'Land - Car (Diesel)', sortOrder: 1 },
  { categoryCode: 'EC', fieldKey: 'transportMode', label: 'Land - Train / Metro', value: 'Land - Train / Metro', sortOrder: 2 },
  { categoryCode: 'EC', fieldKey: 'transportMode', label: 'Land - Bus', value: 'Land - Bus', sortOrder: 3 },
  { categoryCode: 'EC', fieldKey: 'transportMode', label: 'Land - Motorcycle', value: 'Land - Motorcycle', sortOrder: 4 },

  // ── DTD: transportMode options ─────────────────────────────────────────────
  { categoryCode: 'DTD', fieldKey: 'transportMode', label: 'Land (HGV / Freight Train)', value: 'Land (HGV / Freight Train)', sortOrder: 0 },
  { categoryCode: 'DTD', fieldKey: 'transportMode', label: 'Air Freight', value: 'Air Freight', sortOrder: 1 },
  { categoryCode: 'DTD', fieldKey: 'transportMode', label: 'Sea Freight (Cargo Ship)', value: 'Sea Freight (Cargo Ship)', sortOrder: 2 },

  // ── EOL: wasteType options ─────────────────────────────────────────────────
  { categoryCode: 'EOL', fieldKey: 'wasteType', label: 'Plastics', value: 'Plastics', sortOrder: 0 },
  { categoryCode: 'EOL', fieldKey: 'wasteType', label: 'Metals', value: 'Metals', sortOrder: 1 },
  { categoryCode: 'EOL', fieldKey: 'wasteType', label: 'Paper & Board', value: 'Paper & Board', sortOrder: 2 },
  { categoryCode: 'EOL', fieldKey: 'wasteType', label: 'Electronics', value: 'Electronics', sortOrder: 3 },
  // EOL: wasteHandling options
  { categoryCode: 'EOL', fieldKey: 'wasteHandling', label: 'Recycling', value: 'Recycling', sortOrder: 0 },
  { categoryCode: 'EOL', fieldKey: 'wasteHandling', label: 'Incineration', value: 'Incineration', sortOrder: 1 },
  { categoryCode: 'EOL', fieldKey: 'wasteHandling', label: 'Landfill', value: 'Landfill', sortOrder: 2 },
];
