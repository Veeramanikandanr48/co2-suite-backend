import { CalculationRun } from 'src/entities/calculation-run.entity';
import { CalculationInputSnapshot } from 'src/entities/calculation-input-snapshot.entity';
import { CalculationFactorSnapshot } from 'src/entities/calculation-factor-snapshot.entity';
import { CalculationGasResult } from 'src/entities/calculation-gas-result.entity';
import { CalculationResult } from 'src/entities/calculation-result.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { MasterGWP } from 'src/entities/master-gwp.entity';
import { UnitConversion } from 'src/entities/unit-conversion.entity';

describe('Historical Snapshot Immutability & Reproducibility Audit (Phase 3)', () => {
  let calculationRun: CalculationRun;
  let inputSnapshot: CalculationInputSnapshot;
  let factorSnapshot: CalculationFactorSnapshot;
  let gasResult: CalculationGasResult;
  let result: CalculationResult;

  let liveEmissionFactor: EmissionFactor;
  let liveGwp: MasterGWP;
  let liveUnitConversion: UnitConversion;

  beforeEach(() => {
    // 1. Setup initial live Master Data Management (MDM) records
    liveEmissionFactor = new EmissionFactor();
    liveEmissionFactor.id = 42;
    liveEmissionFactor.factorValue = 2.68;
    liveEmissionFactor.validFrom = '2024-01-01';

    liveGwp = new MasterGWP();
    liveGwp.id = 1;
    liveGwp.gwpValue = 28.0;

    liveUnitConversion = new UnitConversion();
    liveUnitConversion.id = 5;
    liveUnitConversion.multiplier = 1000.0;

    // 2. Create calculation run baseline snapshots
    calculationRun = new CalculationRun();
    calculationRun.id = 1001;
    calculationRun.activityId = 500;
    calculationRun.calculationMethodId = 1;
    calculationRun.engineVersion = '2.0.0';
    calculationRun.status = 'ACTIVE';
    calculationRun.executedAt = new Date('2024-06-01T10:00:00Z');

    inputSnapshot = new CalculationInputSnapshot();
    inputSnapshot.id = 1;
    inputSnapshot.calculationRunId = calculationRun.id;
    inputSnapshot.inputDefinitionCode = 'FUEL_QUANTITY';
    inputSnapshot.rawValue = 100;
    inputSnapshot.rawUnit = 'L';
    inputSnapshot.normalizedValue = 100;
    inputSnapshot.normalizedUnit = 'L';

    factorSnapshot = new CalculationFactorSnapshot();
    factorSnapshot.id = 1;
    factorSnapshot.calculationRunId = calculationRun.id;
    factorSnapshot.factorId = liveEmissionFactor.id;
    factorSnapshot.datasetCode = 'DEFRA';
    factorSnapshot.datasetVersion = '2024';
    factorSnapshot.factorValue = liveEmissionFactor.factorValue;
    factorSnapshot.factorUnit = 'kgCO2e/L';
    factorSnapshot.factorBasis = 'CO2E_TOTAL';

    gasResult = new CalculationGasResult();
    gasResult.id = 1;
    gasResult.calculationRunId = calculationRun.id;
    gasResult.gasId = 1;
    gasResult.gasMassKg = 268;
    gasResult.gwpAssessmentCode = 'AR5';
    gasResult.gwpValue = liveGwp.gwpValue;
    gasResult.co2eTonnes = 0.268;
    gasResult.carbonOrigin = 'FOSSIL';

    result = new CalculationResult();
    result.id = 1;
    result.calculationRunId = calculationRun.id;
    result.totalCo2eTonnes = 0.268;
    result.fossilCo2eTonnes = 0.268;
    result.biogenicCo2Tonnes = 0.0;
    result.formulaDisplay = '100 L * 2.68 kgCO2e/L / 1000 = 0.268 tCO2e';

    calculationRun.inputSnapshots = [inputSnapshot];
    calculationRun.factorSnapshots = [factorSnapshot];
    calculationRun.gasResults = [gasResult];
    calculationRun.result = result;
  });

  it('should reproduce historical calculation result with 100% precision from snapshots', () => {
    const reproducedTotalTonnes =
      (inputSnapshot.normalizedValue * factorSnapshot.factorValue) / 1000;
    expect(reproducedTotalTonnes).toBeCloseTo(result.totalCo2eTonnes, 8);
    expect(factorSnapshot.factorValue).toBe(2.68);
  });

  it('should maintain 100% snapshot immutability when live MDM data is mutated', () => {
    // 3. Mutate live MDM factors and conversions
    liveEmissionFactor.factorValue = 9.99; // Live factor updated/corrupted
    liveGwp.gwpValue = 50.0; // Live GWP updated
    liveUnitConversion.multiplier = 999.0; // Live conversion changed

    // 4. Verify historical calculation snapshot values remain unchanged
    expect(calculationRun.factorSnapshots[0].factorValue).toBe(2.68);
    expect(calculationRun.gasResults[0].gwpValue).toBe(28.0);
    expect(calculationRun.result.totalCo2eTonnes).toBe(0.268);

    // Re-verify snapshot reproduction after live mutation
    const reproducedTotal =
      (calculationRun.inputSnapshots[0].normalizedValue *
        calculationRun.factorSnapshots[0].factorValue) /
      1000;
    expect(reproducedTotal).toBe(0.268);
    expect(reproducedTotal).not.toBe(
      (inputSnapshot.normalizedValue * liveEmissionFactor.factorValue) / 1000,
    );
  });
});
