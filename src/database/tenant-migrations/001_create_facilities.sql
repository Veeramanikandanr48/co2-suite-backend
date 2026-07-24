-- Migration 001: Create Tenant Facilities & Departments Tables

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."facilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "facility_code" varchar(50) UNIQUE,
  "country" varchar(100),
  "state" varchar(100),
  "city" varchar(100),
  "address" text,
  "latitude" numeric(10,6),
  "longitude" numeric(10,6),
  "gross_floor_area_sqm" numeric(12,2),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}."departments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "facility_id" uuid REFERENCES {{SCHEMA_NAME}}."facilities"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "code" varchar(50),
  "created_at" timestamp with time zone DEFAULT now()
);
