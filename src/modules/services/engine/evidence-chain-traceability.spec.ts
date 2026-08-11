import { CalculationRun } from 'src/entities/calculation-run.entity';
import { CalculationFactorSnapshot } from 'src/entities/calculation-factor-snapshot.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { EvidenceCitation } from 'src/entities/evidence-citation.entity';
import { SourceDocument } from 'src/entities/source-document.entity';

describe('Audit Trail & Evidence Chain Traceability Audit (Phase 4)', () => {
  let sourceDoc: SourceDocument;
  let citation: EvidenceCitation;
  let factor: EmissionFactor;
  let factorSnapshot: CalculationFactorSnapshot;
  let run: CalculationRun;

  beforeEach(() => {
    // 1. Create Source Document entity
    sourceDoc = new SourceDocument();
    sourceDoc.id = 101;
    sourceDoc.documentType = 'FACTOR_SOURCE_GUIDE';
    sourceDoc.fileName = 'GHG_Conversion_Factors_2024.pdf';
    sourceDoc.storageUri =
      's3://co2-suite-evidence/2024/GHG_Conversion_Factors_2024.pdf';
    sourceDoc.sha256Hash =
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    sourceDoc.publisher = 'UK DEFRA / DESNZ';
    sourceDoc.publicationDate = '2024-06-01';
    sourceDoc.version = '1.0';

    // 2. Create Evidence Citation entity mapping exact location in document
    citation = new EvidenceCitation();
    citation.id = 202;
    citation.sourceDocumentId = sourceDoc.id;
    citation.sourceDocument = sourceDoc;
    citation.pageNumber = 42;
    citation.sectionName = 'Fuels - Stationary Combustion';
    citation.tableReference = 'Table 1.1';
    citation.rowReference = 'Diesel (average biofuel blend)';
    citation.columnReference = 'kg CO2e per Litre';
    citation.quotedValue = 2.68412;
    citation.quotedUnit = 'kg CO2e/L';
    citation.verificationStatus = 'VERIFIED';
    citation.verifiedBy = 7;
    citation.verifiedAt = new Date('2024-06-02T12:00:00Z');

    // 3. Create Emission Factor entity with link to citation
    factor = new EmissionFactor();
    factor.id = 303;
    factor.datasetVersionId = 1;
    factor.fuelId = 5;
    factor.unitId = 2;
    factor.factorValue = 2.68412;
    factor.evidenceCitationId = citation.id;
    factor.evidenceCitation = citation;
    factor.validFrom = '2024-01-01';

    // 4. Create Calculation Factor Snapshot & Calculation Run
    run = new CalculationRun();
    run.id = 404;
    run.activityId = 88;
    run.status = 'ACTIVE';

    factorSnapshot = new CalculationFactorSnapshot();
    factorSnapshot.id = 505;
    factorSnapshot.calculationRunId = run.id;
    factorSnapshot.calculationRun = run;
    factorSnapshot.factorId = factor.id;
    factorSnapshot.datasetCode = 'DEFRA';
    factorSnapshot.datasetVersion = '2024';
    factorSnapshot.factorValue = factor.factorValue;
    factorSnapshot.factorUnit = 'kg CO2e/L';
    factorSnapshot.factorBasis = 'CO2E_TOTAL';

    run.factorSnapshots = [factorSnapshot];
  });

  it('should traverse complete audit chain: CalculationRun -> FactorSnapshot -> EmissionFactor -> EvidenceCitation -> SourceDocument', () => {
    // 1. Verify link from Calculation Run to Factor Snapshot
    expect(run.factorSnapshots[0].factorId).toBe(factor.id);

    // 2. Verify link from Factor Snapshot to Emission Factor
    expect(factor.id).toBe(303);
    expect(factor.factorValue).toBe(factorSnapshot.factorValue);

    // 3. Verify link from Emission Factor to Evidence Citation
    expect(factor.evidenceCitation.id).toBe(citation.id);
    expect(factor.evidenceCitation.quotedValue).toBe(2.68412);

    // 4. Verify link from Evidence Citation to Source Document
    const doc = factor.evidenceCitation.sourceDocument;
    expect(doc.id).toBe(sourceDoc.id);
    expect(doc.fileName).toBe('GHG_Conversion_Factors_2024.pdf');

    // 5. Verify page, table, row, column location granularity
    expect(citation.pageNumber).toBe(42);
    expect(citation.tableReference).toBe('Table 1.1');
    expect(citation.rowReference).toBe('Diesel (average biofuel blend)');
    expect(citation.columnReference).toBe('kg CO2e per Litre');
    expect(citation.verificationStatus).toBe('VERIFIED');
  });
});
