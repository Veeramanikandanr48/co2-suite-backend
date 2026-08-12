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
  {
    scopeId: 1,
    scope: 'Scope 1',
    name: 'Stationary Combustion',
    code: 'SC',
    description: 'Boilers, DG sets, burners, cook stoves',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'inventoryName', label: 'Emission Source Equipment', type: 'select', options: ['Boiler', 'DG Set (Generator)', 'Burner', 'Cook Stove', 'Furnace / Heater'], required: true },
        { key: 'fuelOrGasType', label: 'Fuel Type', type: 'select', optionsSource: 'fuels', required: true },
        { key: 'amount', label: 'Activity Data Amount (Litre)', type: 'number', placeholder: 'Please enter fuel volume in Litre (L)', unit: 'L', required: true },
      ],
    },
  },
  {
    scopeId: 1,
    scope: 'Scope 1',
    name: 'Mobile Combustion',
    code: 'MC',
    description: 'Cars, vans, heavy vehicles, company fleet',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'inventoryName', label: 'Vehicle Type', type: 'select', options: ['Car', 'Van', 'Heavy Vehicle (HV)', 'Motorcycle'], required: true },
        { key: 'fuelOrGasType', label: 'Fuel Type', type: 'select', optionsSource: 'fuels', required: true },
        { key: 'amount', label: 'Activity Data (Litre / Km)', type: 'number', placeholder: 'Please enter volume in Litre (L) or Distance (Km)', required: true },
      ],
    },
  },
  {
    scopeId: 1,
    scope: 'Scope 1',
    name: 'Fugitive Emissions',
    code: 'FE',
    description: 'AC refrigerants, fire extinguishers, gas leaks',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'fuelOrGasType', label: 'Gas / Refrigerant Type (AC / Fire Extinguisher)', type: 'select', options: ['R-410A', 'R-134a', 'R-22', 'CO2 (Fire Extinguisher)', 'FM200', 'Novec 1230', 'HFC-32'], required: true },
        { key: 'fugitiveType', label: 'Calculation Method', type: 'radio', options: ['filling', 'leakage'], required: true },
        { key: 'leakagePercent', label: 'Leakage (%)', type: 'number', placeholder: 'Please enter leakage %' },
        { key: 'amount', label: 'Activity Data Amount (kg)', type: 'number', placeholder: 'Please enter amount in kg', unit: 'kg', required: true },
      ],
    },
  },
  {
    scopeId: 1,
    scope: 'Scope 1',
    name: 'Process Emissions',
    code: 'DPE',
    description: 'Welding, cutting, polishing, cleaning, chemical processes',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'inventoryName', label: 'Process Emission Activity', type: 'select', options: ['Welding', 'Cutting', 'Polishing', 'Cleaning', 'Chemical Reaction'], required: true },
        { key: 'amount', label: 'Manual Data Entry Amount (kg CO₂e)', type: 'number', placeholder: 'Please enter process emission amount', unit: 'kgCO2', required: true },
        { key: 'dataAcquisitionMethod', label: 'Data Acquisition Method', type: 'select', options: ['Direct Mass Balance', 'Stoichiometric Model', 'Continuous Emission Monitoring (CEMS)', 'Sample Analysis'] },
      ],
    },
  },

  // Scope 2
  {
    scopeId: 2,
    scope: 'Scope 2',
    name: 'Purchased Electricity',
    code: 'PE',
    description: 'Facility grid electricity consumption',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'fuelOrGasType', label: 'Supplier / Energy Subtype', type: 'select', options: ['Grid Electricity', 'Renewable Solar PPA', 'Green Tariff Grid'], required: true },
        { key: 'energyAmount', label: 'Energy Amount', type: 'number', placeholder: 'e.g. 12500', required: true },
        { key: 'unit', label: 'Energy Unit', type: 'select', options: ['kWh', 'MWh'], required: true },
      ],
    },
  },
  {
    scopeId: 2,
    scope: 'Scope 2',
    name: 'Purchased Heating & Cooling',
    code: 'PHC',
    description: 'District heating, cooling, and industrial steam',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'fuelOrGasType', label: 'Heating & Cooling Subtype', type: 'select', options: ['District Heating', 'District Chilled Water', 'Industrial Steam'], required: true },
        { key: 'energyAmount', label: 'Consumption Amount', type: 'number', placeholder: 'e.g. 5000', required: true },
        { key: 'unit', label: 'Energy Unit', type: 'select', options: ['kWh', 'MWh', 'GJ'], required: true },
      ],
    },
  },

  // Scope 3
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Purchased Goods and Services',
    code: 'PGS',
    description: 'Upstream product materials and purchased services',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'goodsCategory', label: 'Goods / Service Category', type: 'text', placeholder: 'e.g. Raw Materials / IT Services', required: true },
        { key: 'goodsSubCategory', label: 'Sub-Category', type: 'text', placeholder: 'e.g. Steel Alloys / Consulting' },
        { key: 'amount', label: 'Activity Data Amount (kg / ton / USD)', type: 'number', placeholder: 'Please enter activity amount', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Capital Goods',
    code: 'CG',
    description: 'Capital equipment, plant machinery, buildings',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'goodsCategory', label: 'Capital Goods Category', type: 'text', placeholder: 'e.g. Machinery / Vehicles', required: true },
        { key: 'goodsSubCategory', label: 'Asset Sub-Category', type: 'text', placeholder: 'e.g. CNC Lathe / Delivery Truck' },
        { key: 'amount', label: 'Activity Data Amount (units / USD)', type: 'number', placeholder: 'Please enter quantity or spend', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Fuel- and Energy-Related Activities',
    code: 'FERA',
    description: 'Upstream fuel emissions and T&D losses',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'fuelType', label: 'Energy Sub-Type / Scope Connection', type: 'select', options: ['Scope 1 - Upstream Emissions from Purchased Fuels (DEFRA)', 'Scope 2 - Transmission & Distribution (T&D) Loss (%)'], required: true },
        { key: 'amount', label: 'Activity Data Amount (kWh / Litre)', type: 'number', placeholder: 'Please enter energy or fuel activity data', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Upstream Transportation and Distribution',
    code: 'UTD',
    description: 'Tier 1 supplier freight and logistics',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'transportMode', label: 'Mode of Transport', type: 'select', options: ['Land (HGV / Freight Train)', 'Air Freight', 'Sea Freight (Cargo Ship)'], required: true },
        { key: 'typeOption', label: 'Vehicle / Freight Type', type: 'text', placeholder: 'e.g. HGV (all diesel)' },
        { key: 'sizeOption', label: 'Vehicle Size / Fuel Load', type: 'text', placeholder: 'e.g. Rigid (>7.5t - 17t) / 100% Laden' },
        { key: 'distance', label: 'Distance (km)', type: 'number', placeholder: 'Please enter transport distance in km' },
        { key: 'amount', label: 'Activity Data (Weight in tonnes / ton.km)', type: 'number', placeholder: 'Please enter weight or t-km', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Waste Generated in Operations',
    code: 'WGB',
    description: 'Solid waste, wastewater, recycling, composting',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'sourceOption', label: 'Waste Category', type: 'select', options: ['Solid Waste', 'Liquid / Wastewater', 'Hazardous Waste'], required: true },
        { key: 'wasteType', label: 'Waste Type', type: 'select', options: ['Paper & Board', 'Plastics', 'Metals', 'Food & Organic Waste', 'Mixed Commercial Waste'], required: true },
        { key: 'wasteHandling', label: 'Waste Handling / Disposal Method', type: 'select', options: ['Open Loop Recycling', 'Closed Loop Recycling', 'Incineration (with energy recovery)', 'Composting', 'Landfill', 'Anaerobic Digestion'], required: true },
        { key: 'amount', label: 'Activity Data Amount (ton)', type: 'number', placeholder: 'Please enter waste quantity in tonnes (ton)', unit: 'ton', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Business Travel',
    code: 'BT',
    description: 'Flights, train, taxi, hotel stays',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'transportMode', label: 'Mode of Transport', type: 'select', options: ['Land - Car (Taxi / Leased)', 'Land - Rail / Train', 'Land - Bus / Coach', 'Air - Domestic Flight', 'Air - Short Haul Flight', 'Air - Long Haul Flight', 'Air - International First/Business', 'Water - Ferry (Passenger)', 'Water - Cruise / Boat'], required: true },
        { key: 'inventoryName', label: 'Category / Subcategory', type: 'text', placeholder: 'e.g. Executive Travel' },
        { key: 'typeOption', label: 'Vehicle / Flight Type', type: 'text', placeholder: 'e.g. Medium Car / Boeing 777' },
        { key: 'withRf', label: 'Radiative Forcing (RF)', type: 'radio', options: ['With Radiative Forcing', 'Without RF'] },
        { key: 'amount', label: 'Activity Data (pas.km / km)', type: 'number', placeholder: 'Please enter distance in passenger km', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Employee Commuting',
    code: 'EC',
    description: 'Employee daily commute and teleworking',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'transportMode', label: 'Mode of Transport', type: 'select', options: ['Land - Car (Petrol)', 'Land - Car (Diesel)', 'Land - Train / Metro', 'Land - Bus', 'Land - Motorcycle'], required: true },
        { key: 'employeeName', label: 'Name of Employee / Team', type: 'text', placeholder: 'e.g. John Doe / Team Alpha', required: true },
        { key: 'daysTravelled', label: 'No. of Days Travelled (TD)', type: 'number', placeholder: 'e.g. 220 days', required: true },
        { key: 'dailyDistance', label: 'Daily Travel Distance (AD km)', type: 'number', placeholder: 'e.g. 25 km', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Downstream Transportation and Distribution',
    code: 'DTD',
    description: 'Distribution of sold products to end customers',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'transportMode', label: 'Mode of Transport', type: 'select', options: ['Land (HGV / Freight Train)', 'Air Freight', 'Sea Freight (Cargo Ship)'], required: true },
        { key: 'typeOption', label: 'Vehicle / Freight Type', type: 'text', placeholder: 'e.g. HGV (all diesel)' },
        { key: 'distance', label: 'Distance (km)', type: 'number', placeholder: 'Please enter transport distance in km' },
        { key: 'amount', label: 'Activity Data (Weight in tonnes / ton.km)', type: 'number', placeholder: 'Please enter weight or t-km', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Processing of Sold Products',
    code: 'PSP',
    description: 'Intermediate products processed by 3rd parties',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'goodsCategory', label: 'Product Type', type: 'text', placeholder: 'e.g. Plastic Granules / Steel Sheets', required: true },
        { key: 'amount', label: 'Quantity Sold (kg / ton)', type: 'number', placeholder: 'Please enter quantity', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Use of Sold Products',
    code: 'USP',
    description: 'Direct lifetime use emissions of sold goods',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'inventoryName', label: 'Product Name / Type', type: 'text', placeholder: 'e.g. Electric Vehicle / Gas Heater', required: true },
        { key: 'amount', label: 'Total Lifetime Energy / Gas Consumed', type: 'number', placeholder: 'Please enter lifetime energy use', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'End-of-Life Treatment of Sold Products',
    code: 'EOL',
    description: 'Disposal and recycling of sold products at end of life',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'wasteType', label: 'Product Material Type', type: 'select', options: ['Plastics', 'Metals', 'Paper & Board', 'Electronics'], required: true },
        { key: 'wasteHandling', label: 'Disposal Method', type: 'select', options: ['Recycling', 'Incineration', 'Landfill'], required: true },
        { key: 'amount', label: 'Quantity Sold at End of Life (ton)', type: 'number', placeholder: 'Please enter mass in tonnes', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Franchises',
    code: 'FR',
    description: 'Independent franchise operations',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'inventoryName', label: 'Franchise Location / Name', type: 'text', placeholder: 'e.g. Branch #104', required: true },
        { key: 'amount', label: 'Total Franchise Energy Use (kWh)', type: 'number', placeholder: 'Please enter franchise energy consumption', required: true },
      ],
    },
  },
  {
    scopeId: 3,
    scope: 'Scope 3',
    name: 'Investments',
    code: 'INV',
    description: 'Financed emissions and equity investments',
    isActive: true,
    formConfig: {
      fields: [
        { key: 'inventoryName', label: 'Investee Company Name', type: 'text', placeholder: 'e.g. Apex Tech Ltd.', required: true },
        { key: 'investeeScope1', label: 'Investee Scope 1 Emissions (tCO₂e)', type: 'number', placeholder: 'e.g. 5000' },
        { key: 'investeeScope2', label: 'Investee Scope 2 Emissions (tCO₂e)', type: 'number', placeholder: 'e.g. 1200' },
        { key: 'equityShare', label: 'Equity Share Percentage (%)', type: 'number', placeholder: 'e.g. 25%', required: true },
      ],
    },
  },
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
