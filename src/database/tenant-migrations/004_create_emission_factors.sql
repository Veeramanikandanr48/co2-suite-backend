-- Migration 004: Create Tenant Emission Factors & Calculations Tables

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."emission_factors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "factor_name" varchar(255) NOT NULL,
  "factor_value" numeric(18,6) NOT NULL,
  "unit" varchar(50) NOT NULL,
  "source" varchar(100),
  "year" integer,
  "region" varchar(100),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."calculations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "period" varchar(20) NOT NULL,
  "scope_1_co2e_kg" numeric(18,4) DEFAULT 0,
  "scope_2_co2e_kg" numeric(18,4) DEFAULT 0,
  "scope_3_co2e_kg" numeric(18,4) DEFAULT 0,
  "total_co2e_kg" numeric(18,4) NOT NULL,
  "status" varchar(50) DEFAULT 'COMPLETED',
  "created_at" timestamp with time zone DEFAULT now()
);
