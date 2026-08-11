-- ============================================================================
-- CARBON ACCOUNTING DATA MODEL v2.0 - COMPLETE POSTGRESQL DDL
-- Standard: GHG Protocol Corporate, Scope 2, Scope 3 & ISO 14064-1
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LAYER 1: CORPORATE BOUNDARY & ASSET REGISTER
-- ============================================================================

CREATE TABLE IF NOT EXISTS master_geographies (
    id SERIAL PRIMARY KEY,
    parent_id INT REFERENCES master_geographies(id) ON DELETE SET NULL,
    geography_type VARCHAR(50) NOT NULL, -- GLOBAL, CONTINENT, COUNTRY, REGION, GRID_SUBREGION, UTILITY
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    iso2 VARCHAR(2),
    iso3 VARCHAR(3),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizational_boundaries (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    boundary_method VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL_CONTROL', -- OPERATIONAL_CONTROL, FINANCIAL_CONTROL, EQUITY_SHARE
    effective_from DATE NOT NULL,
    effective_to DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boundary_facilities (
    id SERIAL PRIMARY KEY,
    boundary_id INT NOT NULL REFERENCES organizational_boundaries(id) ON DELETE CASCADE,
    facility_id INT NOT NULL,
    inclusion_status VARCHAR(50) NOT NULL DEFAULT 'INCLUDED', -- INCLUDED, EXCLUDED
    ownership_percentage NUMERIC(5,2) DEFAULT 100.00,
    control_status VARCHAR(50) DEFAULT 'OPERATIONAL_CONTROL',
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    facility_id INT NOT NULL,
    asset_code VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- VEHICLE, COMBUSTION_EQUIPMENT, PROCESS_SOURCE, REFRIGERATION_EQUIPMENT
    ownership_type VARCHAR(50) NOT NULL DEFAULT 'OWNED', -- OWNED, FINANCE_LEASE, OPERATING_LEASE, EMPLOYEE_OWNED, THIRD_PARTY
    operational_control BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (facility_id, asset_code)
);

-- ============================================================================
-- LAYER 2: ACCOUNTING TAXONOMY & CALCULATION ROUTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS master_calculation_methods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE, -- FUEL_BASED, DISTANCE_BASED, SPEND_BASED, LOCATION_BASED, MARKET_BASED, MASS_BALANCE, REFRIGERANT_RECHARGE, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    formula_type VARCHAR(100) NOT NULL,
    engine_handler VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_type_methods (
    id SERIAL PRIMARY KEY,
    activity_type_id INT NOT NULL,
    calculation_method_id INT NOT NULL REFERENCES master_calculation_methods(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (activity_type_id, calculation_method_id)
);

-- ============================================================================
-- LAYER 3: DIMENSIONAL UNIT SYSTEM & CONVERSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS master_unit_dimensions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- MASS, VOLUME, ENERGY, DISTANCE, AREA, TIME, CURRENCY, PASSENGER_DISTANCE, TONNE_DISTANCE, COUNT
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unit_conversions (
    id SERIAL PRIMARY KEY,
    from_unit_id INT NOT NULL,
    to_unit_id INT NOT NULL,
    multiplier NUMERIC(18,10) NOT NULL,
    offset_val NUMERIC(18,10) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (from_unit_id, to_unit_id)
);

CREATE TABLE IF NOT EXISTS activity_input_definitions (
    id SERIAL PRIMARY KEY,
    activity_type_id INT NOT NULL,
    code VARCHAR(100) NOT NULL, -- FUEL_QUANTITY, DISTANCE, PASSENGER_COUNT, SPEND_AMOUNT, REFRIGERANT_RECHARGED, etc.
    name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'NUMBER', -- NUMBER, STRING, BOOLEAN, ENUM
    unit_dimension_id INT REFERENCES master_unit_dimensions(id) ON DELETE SET NULL,
    is_required BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    validation_schema JSONB,
    display_order INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (activity_type_id, code)
);

-- ============================================================================
-- LAYER 4: FACTOR, REFRIGERANT, EVIDENCE & MDM
-- ============================================================================

CREATE TABLE IF NOT EXISTS factor_dataset_versions (
    id SERIAL PRIMARY KEY,
    datasource_id INT NOT NULL,
    dataset_code VARCHAR(100) NOT NULL, -- DEFRA_2025, EPA_2024, IEA_2024, ECOINVENT_3_10
    version VARCHAR(50) NOT NULL,
    publication_date DATE NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    methodology_version VARCHAR(100),
    is_immutable BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (datasource_id, dataset_code, version)
);

CREATE TABLE IF NOT EXISTS master_energy_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- ELECTRICITY, STEAM, HEATING, COOLING
    name VARCHAR(255) NOT NULL,
    default_unit_id INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_gases (
    id SERIAL PRIMARY KEY,
    chemical_formula VARCHAR(50) NOT NULL UNIQUE, -- CO2, CH4, N2O, SF6, NF3, HFC-32, HFC-125, HFC-134a, etc.
    name VARCHAR(255) NOT NULL,
    is_kyoto_ghg BOOLEAN DEFAULT TRUE,
    cas_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gwp_assessments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- AR4, AR5, AR6, SAR
    name VARCHAR(255) NOT NULL,
    publisher VARCHAR(100) DEFAULT 'IPCC',
    publication_year INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_refrigerants (
    id SERIAL PRIMARY KEY,
    blend_code VARCHAR(100) NOT NULL UNIQUE, -- R410A, R404A, R134a, R32, R407C
    name VARCHAR(255) NOT NULL,
    refrigerant_type VARCHAR(50) NOT NULL DEFAULT 'BLEND_ZEOTROPIC', -- PURE, BLEND_AZEOTROPIC, BLEND_ZEOTROPIC
    ashrae_safety_group VARCHAR(10), -- A1, A2L, B1, etc.
    ozone_depletion_potential NUMERIC(6,4) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refrigerant_components (
    id SERIAL PRIMARY KEY,
    refrigerant_id INT NOT NULL REFERENCES master_refrigerants(id) ON DELETE CASCADE,
    gas_id INT NOT NULL REFERENCES master_gases(id) ON DELETE RESTRICT,
    mass_percentage NUMERIC(6,3) NOT NULL, -- e.g. 50.000 for HFC-32 in R410A
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (refrigerant_id, gas_id)
);

CREATE TABLE IF NOT EXISTS source_documents (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL, -- UTILITY_BILL, FUEL_RECEIPT, METER_LOG, CONTRACT, FLIGHT_MANIFEST, FACTOR_SOURCE_GUIDE
    file_name VARCHAR(255) NOT NULL,
    storage_uri VARCHAR(1000) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    publisher VARCHAR(255),
    publication_date DATE,
    version VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_citations (
    id SERIAL PRIMARY KEY,
    source_document_id INT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
    page_number INT,
    section_name VARCHAR(255),
    table_reference VARCHAR(255),
    row_reference VARCHAR(255),
    column_reference VARCHAR(255),
    quoted_value NUMERIC(18,10),
    quoted_unit VARCHAR(50),
    verification_status VARCHAR(50) DEFAULT 'UNVERIFIED', -- UNVERIFIED, VERIFIED, REJECTED
    verified_by INT,
    verified_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emission_factors (
    id SERIAL PRIMARY KEY,
    dataset_version_id INT NOT NULL REFERENCES factor_dataset_versions(id) ON DELETE RESTRICT,
    activity_type_id INT,
    fuel_id INT,
    energy_type_id INT REFERENCES master_energy_types(id) ON DELETE RESTRICT,
    unit_id INT NOT NULL,
    geography_id INT REFERENCES master_geographies(id) ON DELETE RESTRICT,
    factor_basis VARCHAR(50) NOT NULL DEFAULT 'CO2E_TOTAL', -- CO2E_TOTAL, CO2E_COMPONENT, GAS_MASS
    factor_value NUMERIC(18,10) NOT NULL,
    calorific_basis VARCHAR(50) DEFAULT 'GROSS_CV', -- GROSS_CV, NET_CV, NOT_APPLICABLE
    density NUMERIC(12,6),
    evidence_citation_id INT REFERENCES evidence_citations(id) ON DELETE SET NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ef_lookup ON emission_factors(dataset_version_id, activity_type_id, fuel_id, energy_type_id, unit_id, geography_id);

CREATE TABLE IF NOT EXISTS emission_factor_components (
    id SERIAL PRIMARY KEY,
    emission_factor_id INT NOT NULL REFERENCES emission_factors(id) ON DELETE CASCADE,
    gas_id INT NOT NULL REFERENCES master_gases(id) ON DELETE RESTRICT,
    component_value NUMERIC(18,10) NOT NULL,
    component_unit_id INT NOT NULL,
    basis VARCHAR(50) NOT NULL DEFAULT 'GAS_MASS', -- GAS_MASS, CO2E_COMPONENT
    gwp_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (emission_factor_id, gas_id)
);

-- ============================================================================
-- LAYER 5: ACTIVITY DATA & SCOPE SUBTYPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_activities (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL,
    reporting_period_id INT NOT NULL,
    facility_id INT NOT NULL,
    asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
    activity_type_id INT NOT NULL,
    activity_date DATE NOT NULL,
    activity_end_date DATE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, CALCULATED, VERIFIED, LOCKED
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_inputs (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL REFERENCES inventory_activities(id) ON DELETE CASCADE,
    input_definition_id INT NOT NULL REFERENCES activity_input_definitions(id) ON DELETE RESTRICT,
    raw_value NUMERIC(18,6) NOT NULL,
    unit_id INT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (activity_id, input_definition_id)
);

CREATE TABLE IF NOT EXISTS activity_sources (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL REFERENCES inventory_activities(id) ON DELETE CASCADE,
    source_document_id INT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
    evidence_citation_id INT REFERENCES evidence_citations(id) ON DELETE SET NULL,
    attachment_type VARCHAR(50) DEFAULT 'SUPPORTING_INVOICE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scope 1 Subtypes
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL UNIQUE REFERENCES assets(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100) NOT NULL,
    fuel_id INT NOT NULL,
    registration_number VARCHAR(50),
    model_year INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS combustion_equipment (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL UNIQUE REFERENCES assets(id) ON DELETE CASCADE,
    equipment_type VARCHAR(100) NOT NULL, -- BOILER, TURBINE, GENERATOR, FURNACE
    primary_fuel_id INT NOT NULL,
    rated_capacity_mw NUMERIC(10,4),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refrigeration_equipment (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL UNIQUE REFERENCES assets(id) ON DELETE CASCADE,
    equipment_type VARCHAR(100) NOT NULL, -- CHILLER, HVAC, REFRIGERATED_VAN, HEAT_PUMP
    refrigerant_id INT NOT NULL REFERENCES master_refrigerants(id) ON DELETE RESTRICT,
    charge_capacity_kg NUMERIC(10,4) NOT NULL,
    normal_leak_rate_pct NUMERIC(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fugitive_measurements (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL REFERENCES inventory_activities(id) ON DELETE CASCADE,
    refrigeration_equipment_id INT NOT NULL REFERENCES refrigeration_equipment(id) ON DELETE RESTRICT,
    emission_mode VARCHAR(50) NOT NULL, -- DIRECT_RELEASE, RECHARGE_TOPUP, INVENTORY_DIFFERENCE, ESTIMATED_LEAKAGE
    measurement_type VARCHAR(50) NOT NULL, -- START_INV, PURCHASED, RECOVERED, END_INV, TOPUP_AMOUNT
    quantity NUMERIC(14,4) NOT NULL,
    unit_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scope 2 Subtypes
CREATE TABLE IF NOT EXISTS energy_supply_contracts (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    contract_number VARCHAR(100) NOT NULL,
    energy_product VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    market_region_id INT REFERENCES master_geographies(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchased_energy_activities (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL UNIQUE REFERENCES inventory_activities(id) ON DELETE CASCADE,
    energy_type_id INT NOT NULL REFERENCES master_energy_types(id) ON DELETE RESTRICT,
    contract_id INT REFERENCES energy_supply_contracts(id) ON DELETE SET NULL,
    meter_reference VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS energy_attribute_instruments (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES energy_supply_contracts(id) ON DELETE CASCADE,
    instrument_type VARCHAR(50) NOT NULL, -- EAC, REC, GO, I_REC
    certificate_id VARCHAR(100) NOT NULL,
    quantity_mwh NUMERIC(14,4) NOT NULL,
    generation_start DATE,
    generation_end DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scope 3 Subtypes
CREATE TABLE IF NOT EXISTS scope3_activities (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL UNIQUE REFERENCES inventory_activities(id) ON DELETE CASCADE,
    category_number INT NOT NULL CHECK (category_number BETWEEN 1 AND 15),
    allocation_method VARCHAR(50) DEFAULT 'AVERAGE_DATA', -- SUPPLIER_SPECIFIC, HYBRID, AVERAGE_DATA, SPEND_BASED
    supplier_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_travel_details (
    id SERIAL PRIMARY KEY,
    scope3_activity_id INT NOT NULL UNIQUE REFERENCES scope3_activities(id) ON DELETE CASCADE,
    travel_mode VARCHAR(50) NOT NULL, -- AIR, RAIL, HOTEL, CAR_RENTAL, TAXI
    cabin_class VARCHAR(50), -- ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
    passenger_count INT DEFAULT 1,
    has_radiative_forcing BOOLEAN DEFAULT TRUE,
    hotel_nights INT,
    hotel_rooms INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_commuting_details (
    id SERIAL PRIMARY KEY,
    scope3_activity_id INT NOT NULL UNIQUE REFERENCES scope3_activities(id) ON DELETE CASCADE,
    commute_mode VARCHAR(50) NOT NULL, -- CAR, BUS, TRAIN, SUBWAY, BICYCLE, WALKING, TELEWORK
    employee_count INT NOT NULL DEFAULT 1,
    working_days_per_year INT DEFAULT 240,
    telework_pct NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_details (
    id SERIAL PRIMARY KEY,
    scope3_activity_id INT NOT NULL UNIQUE REFERENCES scope3_activities(id) ON DELETE CASCADE,
    transport_direction VARCHAR(50) NOT NULL DEFAULT 'UPSTREAM', -- UPSTREAM (Cat 4), DOWNSTREAM (Cat 9)
    vehicle_mode VARCHAR(50) NOT NULL, -- ROAD_RIGID, ROAD_ARTICULATED, RAIL_FREIGHT, SEA_CONTAINER, AIR_FREIGHT
    cargo_weight_tonnes NUMERIC(12,4),
    distance_km NUMERIC(12,4),
    load_factor_pct NUMERIC(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waste_details (
    id SERIAL PRIMARY KEY,
    scope3_activity_id INT NOT NULL UNIQUE REFERENCES scope3_activities(id) ON DELETE CASCADE,
    waste_type VARCHAR(100) NOT NULL, -- MUNICIPAL_SOLID, PLASTIC, FOOD, PAPER, HAZARDOUS, E_WASTE
    disposal_method VARCHAR(50) NOT NULL, -- LANDFILL, OPEN_DUMP, RECYCLING, COMPOSTING, INCINERATION_ENERGY, INCINERATION_NO_ENERGY
    waste_mass_tonnes NUMERIC(12,4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LAYER 6: CALCULATION LEDGER, ASSURANCE & DISCLOSURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calculation_runs (
    id SERIAL PRIMARY KEY,
    activity_id INT NOT NULL REFERENCES inventory_activities(id) ON DELETE CASCADE,
    calculation_method_id INT NOT NULL REFERENCES master_calculation_methods(id) ON DELETE RESTRICT,
    engine_version VARCHAR(50) NOT NULL DEFAULT '2.0.0',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUPERSEDED, FAILED
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_by INT,
    error_log TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calculation_input_snapshots (
    id SERIAL PRIMARY KEY,
    calculation_run_id INT NOT NULL REFERENCES calculation_runs(id) ON DELETE CASCADE,
    input_definition_code VARCHAR(100) NOT NULL,
    raw_value NUMERIC(18,6) NOT NULL,
    raw_unit VARCHAR(50),
    normalized_value NUMERIC(18,6),
    normalized_unit VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calculation_factor_snapshots (
    id SERIAL PRIMARY KEY,
    calculation_run_id INT NOT NULL REFERENCES calculation_runs(id) ON DELETE CASCADE,
    factor_id INT,
    dataset_code VARCHAR(100) NOT NULL,
    dataset_version VARCHAR(50) NOT NULL,
    factor_value NUMERIC(18,10) NOT NULL,
    factor_unit VARCHAR(50) NOT NULL,
    factor_basis VARCHAR(50) NOT NULL,
    geography_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calculation_gas_results (
    id SERIAL PRIMARY KEY,
    calculation_run_id INT NOT NULL REFERENCES calculation_runs(id) ON DELETE CASCADE,
    gas_id INT NOT NULL REFERENCES master_gases(id) ON DELETE RESTRICT,
    gas_mass_kg NUMERIC(18,8) NOT NULL,
    gwp_assessment_code VARCHAR(50) NOT NULL, -- AR6, AR5, AR4
    gwp_value NUMERIC(10,4) NOT NULL,
    co2e_tonnes NUMERIC(18,8) NOT NULL,
    carbon_origin VARCHAR(50) NOT NULL DEFAULT 'FOSSIL', -- FOSSIL, BIOGENIC
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (calculation_run_id, gas_id, carbon_origin)
);

CREATE TABLE IF NOT EXISTS calculation_results (
    id SERIAL PRIMARY KEY,
    calculation_run_id INT NOT NULL UNIQUE REFERENCES calculation_runs(id) ON DELETE CASCADE,
    total_co2e_tonnes NUMERIC(18,8) NOT NULL DEFAULT 0,
    fossil_co2e_tonnes NUMERIC(18,8) NOT NULL DEFAULT 0,
    biogenic_co2_tonnes NUMERIC(18,8) NOT NULL DEFAULT 0,
    formula_display TEXT,
    normalized_quantity NUMERIC(18,6),
    normalized_unit VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_reports (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL,
    reporting_period_id INT NOT NULL,
    boundary_id INT REFERENCES organizational_boundaries(id) ON DELETE RESTRICT,
    report_title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, VERIFIED, PUBLISHED
    published_at TIMESTAMP,
    created_by INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_lines (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL REFERENCES inventory_reports(id) ON DELETE CASCADE,
    calculation_result_id INT NOT NULL REFERENCES calculation_results(id) ON DELETE RESTRICT,
    scope_code VARCHAR(50) NOT NULL, -- SCOPE_1, SCOPE_2, SCOPE_3
    category_code VARCHAR(100) NOT NULL,
    facility_id INT NOT NULL,
    reported_co2e_tonnes NUMERIC(18,8) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
