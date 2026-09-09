import { AddDynamicCalculationMdmTables1741260000000 } from './1741260000000-AddDynamicCalculationMdmTables';

describe('TypeORM Database Migration Validation', () => {
  let migration: AddDynamicCalculationMdmTables1741260000000;
  let executedQueries: string[];
  let mockQueryRunner: any;

  beforeEach(() => {
    migration = new AddDynamicCalculationMdmTables1741260000000();
    executedQueries = [];
    mockQueryRunner = {
      query: jest.fn().mockImplementation((sql: string) => {
        executedQueries.push(sql.trim());
        return Promise.resolve();
      }),
    };
  });

  it('validates UP migration creates master_emission_factor table with all columns and constraints', async () => {
    await migration.up(mockQueryRunner);

    expect(mockQueryRunner.query).toHaveBeenCalled();

    // 1. Verify CREATE TABLE master_emission_factor
    const createTableQuery = executedQueries.find((q) =>
      q.includes('CREATE TABLE IF NOT EXISTS "master_emission_factor"'),
    );
    expect(createTableQuery).toBeDefined();
    expect(createTableQuery).toContain('"fuel_id" integer');
    expect(createTableQuery).toContain('"factor_version_id" integer NOT NULL');
    expect(createTableQuery).toContain('"unit_id" integer NOT NULL');
    expect(createTableQuery).toContain('"calculation_method" varchar(60) NOT NULL');
    expect(createTableQuery).toContain('"activity_sub_type" varchar(100)');
    expect(createTableQuery).toContain('"geography" varchar(60)');
    expect(createTableQuery).toContain('"with_rf" boolean');
    expect(createTableQuery).toContain('"factor" numeric(12, 6) NOT NULL');
    expect(createTableQuery).toContain('"co2_factor" numeric(12, 6)');
    expect(createTableQuery).toContain('"ch4_factor" numeric(12, 6)');
    expect(createTableQuery).toContain('"n2o_factor" numeric(12, 6)');

    // 2. Verify Foreign Keys
    expect(createTableQuery).toContain('CONSTRAINT "FK_mef_fuel" FOREIGN KEY ("fuel_id") REFERENCES "master_fuel"("id")');
    expect(createTableQuery).toContain('CONSTRAINT "FK_mef_version" FOREIGN KEY ("factor_version_id") REFERENCES "master_factor_version"("id")');
    expect(createTableQuery).toContain('CONSTRAINT "FK_mef_unit" FOREIGN KEY ("unit_id") REFERENCES "master_unit"("id")');

    // 3. Verify Indexes
    const indexQuery = executedQueries.find((q) =>
      q.includes('CREATE INDEX IF NOT EXISTS "IDX_mef_lookup"'),
    );
    expect(indexQuery).toBeDefined();
    expect(indexQuery).toContain('"calculation_method", "factor_version_id", "unit_id", "is_active"');

    // 4. Verify master_formula additions
    const formulaAlter = executedQueries.find((q) =>
      q.includes('ALTER TABLE "master_formula"'),
    );
    expect(formulaAlter).toBeDefined();
    expect(formulaAlter).toContain('"method_code" varchar(60) UNIQUE');
    expect(formulaAlter).toContain('"gas_ratios" jsonb');

    // 5. Verify inventory_entries additions
    const inventoryAlter = executedQueries.find((q) =>
      q.includes('ALTER TABLE "inventory_entries"'),
    );
    expect(inventoryAlter).toBeDefined();
    expect(inventoryAlter).toContain('"emission_factor_id" integer');
    expect(inventoryAlter).toContain('"formula_id" integer');
    expect(inventoryAlter).toContain('"calculation_method" varchar(60)');
    expect(inventoryAlter).toContain('"activity_sub_type" varchar(100)');
    expect(inventoryAlter).toContain('"location_based_tco2e" numeric(12, 6)');
    expect(inventoryAlter).toContain('"market_based_tco2e" numeric(12, 6)');
    expect(inventoryAlter).toContain('"co2_tco2e" numeric(12, 6)');
    expect(inventoryAlter).toContain('"ch4_tco2e" numeric(12, 6)');
    expect(inventoryAlter).toContain('"n2o_tco2e" numeric(12, 6)');
  });

  it('validates DOWN migration cleanly rolls back without orphaned objects', async () => {
    await migration.down(mockQueryRunner);

    expect(mockQueryRunner.query).toHaveBeenCalled();
    const inventoryDrop = executedQueries.find((q) =>
      q.includes('ALTER TABLE "inventory_entries"') && q.includes('DROP CONSTRAINT'),
    );
    expect(inventoryDrop).toBeDefined();

    const formulaDrop = executedQueries.find((q) =>
      q.includes('ALTER TABLE "master_formula"') && q.includes('DROP COLUMN'),
    );
    expect(formulaDrop).toBeDefined();

    const tableDrop = executedQueries.find((q) =>
      q.includes('DROP TABLE IF EXISTS "master_emission_factor"'),
    );
    expect(tableDrop).toBeDefined();
  });
});
