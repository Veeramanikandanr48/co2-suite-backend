-- Migration 003: Create Tenant Activity Data & Fuel Types Tables

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."activity_data" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "facility_id" uuid REFERENCES {{SCHEMA_NAME}}."facilities"("id") ON DELETE SET NULL,
  "meter_id" uuid REFERENCES {{SCHEMA_NAME}}."meters"("id") ON DELETE SET NULL,
  "scope" varchar(20) NOT NULL, -- Scope 1, Scope 2, Scope 3
  "category" varchar(100) NOT NULL, -- Stationary Combustion, Mobile, Electricity, Waste, Water
  "emission_source" varchar(255) NOT NULL,
  "activity_value" numeric(15,4) NOT NULL,
  "unit" varchar(50) NOT NULL,
  "period_start" date,
  "period_end" date,
  "data_quality_score" numeric(3,2) DEFAULT 1.0,
  "created_at" timestamp with time zone DEFAULT now()
);
