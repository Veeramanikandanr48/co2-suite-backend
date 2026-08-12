import { MasterScope } from 'src/entities/master-scope.entity';
import { MasterCategory } from 'src/entities/master-category.entity';
import { MasterDatasource } from 'src/entities/master-datasource.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { MasterUnit } from 'src/entities/master-unit.entity';

export const SEED_MASTER_SCOPES: Partial<MasterScope>[] = [
  { id: 1, name: 'Scope 1', code: 'S1', description: 'Direct GHG Emissions from owned or controlled sources', isActive: true },
  { id: 2, name: 'Scope 2', code: 'S2', description: 'Indirect GHG Emissions from purchased electricity, heating & cooling', isActive: true },
  { id: 3, name: 'Scope 3', code: 'S3', description: 'All other indirect emissions across value chain', isActive: true },
];

export const SEED_MASTER_CATEGORIES: Partial<MasterCategory>[] = [
  // Scope 1
  { scopeId: 1, scope: 'Scope 1', name: 'Stationary Combustion', code: 'SC', description: 'Boilers, DG sets, burners, cook stoves', isActive: true },
  { scopeId: 1, scope: 'Scope 1', name: 'Mobile Combustion', code: 'MC', description: 'Cars, vans, heavy vehicles, company fleet', isActive: true },
  { scopeId: 1, scope: 'Scope 1', name: 'Fugitive Emissions', code: 'FE', description: 'AC refrigerants, fire extinguishers, gas leaks', isActive: true },
  { scopeId: 1, scope: 'Scope 1', name: 'Process Emissions', code: 'DPE', description: 'Welding, cutting, polishing, cleaning, chemical processes', isActive: true },

  // Scope 2
  { scopeId: 2, scope: 'Scope 2', name: 'Purchased Electricity', code: 'PE', description: 'Facility grid electricity consumption', isActive: true },
  { scopeId: 2, scope: 'Scope 2', name: 'Purchased Heating & Cooling', code: 'PHC', description: 'District heating, cooling, and industrial steam', isActive: true },

  // Scope 3 (15 categories)
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
];
