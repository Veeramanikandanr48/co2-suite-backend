-- Migration 002: Create Tenant Buildings, Assets & Meters Tables

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."buildings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "facility_id" uuid REFERENCES {{SCHEMA_NAME}}."facilities"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "building_type" varchar(100),
  "area_sqm" numeric(12,2),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "facility_id" uuid REFERENCES {{SCHEMA_NAME}}."facilities"("id") ON DELETE CASCADE,
  "asset_name" varchar(255) NOT NULL,
  "asset_category" varchar(100),
  "serial_number" varchar(100),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."meters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "facility_id" uuid REFERENCES {{SCHEMA_NAME}}."facilities"("id") ON DELETE CASCADE,
  "meter_name" varchar(255) NOT NULL,
  "utility_type" varchar(50) NOT NULL, -- Electricity, Natural Gas, Diesel, Water
  "serial_number" varchar(100),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);
