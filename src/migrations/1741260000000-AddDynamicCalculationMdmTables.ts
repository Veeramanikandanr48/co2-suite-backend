import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDynamicCalculationMdmTables1741260000000
  implements MigrationInterface
{
  name = 'AddDynamicCalculationMdmTables1741260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create master_emission_factor table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "master_emission_factor" (
        "id" SERIAL PRIMARY KEY,
        "fuel_id" integer,
        "factor_version_id" integer NOT NULL,
        "unit_id" integer NOT NULL,
        "calculation_method" varchar(60) NOT NULL,
        "activity_sub_type" varchar(100),
        "geography" varchar(60),
        "with_rf" boolean,
        "gwp_basis" varchar(20) DEFAULT 'AR6',
        "factor" numeric(12, 6) NOT NULL,
        "co2_factor" numeric(12, 6),
        "ch4_factor" numeric(12, 6),
        "n2o_factor" numeric(12, 6),
        "hfc_factor" numeric(12, 6),
        "pfc_factor" numeric(12, 6),
        "sf6_factor" numeric(12, 6),
        "description" text,
        "source_publisher" varchar(100),
        "dataset_name_and_version" varchar(150),
        "pub_year" integer,
        "document_sheet_table_ref" varchar(255),
        "authoritative_source_url" text,
        "gas_family" varchar(50),
        "blend_composition" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" integer,
        "updated_by" integer,
        CONSTRAINT "FK_mef_fuel" FOREIGN KEY ("fuel_id") REFERENCES "master_fuel"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_mef_version" FOREIGN KEY ("factor_version_id") REFERENCES "master_factor_version"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_mef_unit" FOREIGN KEY ("unit_id") REFERENCES "master_unit"("id") ON DELETE RESTRICT
      )
    `);

    // Add indexes on discriminator lookup columns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_mef_lookup"
      ON "master_emission_factor" ("calculation_method", "factor_version_id", "unit_id", "is_active")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_mef_subtype"
      ON "master_emission_factor" ("activity_sub_type")
    `);

    // 2. Extend master_formula with methodCode and gasRatios
    await queryRunner.query(`
      ALTER TABLE "master_formula"
      ADD COLUMN IF NOT EXISTS "method_code" varchar(60) UNIQUE,
      ADD COLUMN IF NOT EXISTS "gas_ratios" jsonb
    `);

    // 3. Extend inventory_entries with dynamic calculation & gas breakdown columns
    await queryRunner.query(`
      ALTER TABLE "inventory_entries"
      ADD COLUMN IF NOT EXISTS "emission_factor_id" integer,
      ADD COLUMN IF NOT EXISTS "formula_id" integer,
      ADD COLUMN IF NOT EXISTS "calculation_method" varchar(60),
      ADD COLUMN IF NOT EXISTS "activity_sub_type" varchar(100),
      ADD COLUMN IF NOT EXISTS "location_based_tco2e" numeric(12, 6),
      ADD COLUMN IF NOT EXISTS "market_based_tco2e" numeric(12, 6),
      ADD COLUMN IF NOT EXISTS "co2_tco2e" numeric(12, 6),
      ADD COLUMN IF NOT EXISTS "ch4_tco2e" numeric(12, 6),
      ADD COLUMN IF NOT EXISTS "n2o_tco2e" numeric(12, 6)
    `);

    // Add FKs to inventory_entries if constraint doesn't already exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_inventory_emission_factor'
        ) THEN
          ALTER TABLE "inventory_entries"
          ADD CONSTRAINT "FK_inventory_emission_factor"
          FOREIGN KEY ("emission_factor_id") REFERENCES "master_emission_factor"("id") ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_inventory_formula'
        ) THEN
          ALTER TABLE "inventory_entries"
          ADD CONSTRAINT "FK_inventory_formula"
          FOREIGN KEY ("formula_id") REFERENCES "master_formula"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inventory_entries"
      DROP CONSTRAINT IF EXISTS "FK_inventory_formula",
      DROP CONSTRAINT IF EXISTS "FK_inventory_emission_factor",
      DROP COLUMN IF EXISTS "n2o_tco2e",
      DROP COLUMN IF EXISTS "ch4_tco2e",
      DROP COLUMN IF EXISTS "co2_tco2e",
      DROP COLUMN IF EXISTS "market_based_tco2e",
      DROP COLUMN IF EXISTS "location_based_tco2e",
      DROP COLUMN IF EXISTS "activity_sub_type",
      DROP COLUMN IF EXISTS "calculation_method",
      DROP COLUMN IF EXISTS "formula_id",
      DROP COLUMN IF EXISTS "emission_factor_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "master_formula"
      DROP COLUMN IF EXISTS "gas_ratios",
      DROP COLUMN IF EXISTS "method_code"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "master_emission_factor"
    `);
  }
}
