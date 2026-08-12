import { BadRequestException } from '@nestjs/common';
import { CalculationMethodEngine } from './calculation-method.engine';
import { SCOPE2_METHODOLOGY } from './scope2-methodology.constants';

describe('Scope 2 Calculation Engine — Dual Accounting & Quality Criteria (GHG Protocol 2015)', () => {
  let engine: CalculationMethodEngine;

  beforeEach(() => {
    engine = new CalculationMethodEngine();
  });

  describe('Scope 2 Methodology Governance', () => {
    it('should operate under SCOPE_2_2015 frozen methodology baseline', () => {
      expect(SCOPE2_METHODOLOGY.standard).toBe('GHG_PROTOCOL');
      expect(SCOPE2_METHODOLOGY.guidance).toBe('SCOPE_2_2015');
      expect(SCOPE2_METHODOLOGY.implementation).toBe('1.0');
    });
  });

  describe('Electricity Dual Accounting (Location-Based & Market-Based)', () => {
    it('should calculate both location-based and market-based results independently for electricity', () => {
      const result = engine.calculateEmission({
        amount: 1000, // 1000 kWh
        ef: 0.42, // Location Grid EF: 0.42 kg CO2e / kWh
        unit: 'kWh',
        method: 'LOCATION_BASED',
        marketAllocations: [
          {
            instrumentType: 'PPA',
            instrumentRef: 'PPA-SOLAR-2025-001',
            supplierName: 'CleanEnergy Power Co',
            allocatedQuantity: 600,
            allocatedUnit: 'kWh',
            factor: 0.0, // Zero carbon PPA
            evidenceRef: 'CERT-RE-0091',
          },
        ],
        residualMixEF: 0.55, // Residual mix: 0.55 kg CO2e / kWh
      });

      expect(result.scope2Result).toBeDefined();
      expect(result.scope2Result?.energyType).toBe('ELECTRICITY');
      expect(result.scope2Result?.methodologyVersion).toBe('SCOPE_2_2015_v1.0');

      // Location-Based: 1000 kWh * 0.42 / 1000 = 0.42 tCO2e
      expect(result.scope2Result?.locationBased.tonnesCO2e).toBe(0.42);
      expect(result.scope2Result?.locationBased.kgCO2e).toBe(420);

      // Market-Based: 600 kWh * 0.0 (PPA) + 400 kWh * 0.55 (Residual Mix) = 0.22 tCO2e
      expect(result.scope2Result?.marketBased.tonnesCO2e).toBe(0.22);
      expect(result.scope2Result?.marketBased.kgCO2e).toBe(220);
      expect(result.scope2Result?.marketBased.factorAllocations.length).toBe(2);
      expect(result.scope2Result?.marketBased.unallocatedQuantity).toBe(400);
    });
  });

  describe('Allocation Conservation Invariant Enforcement', () => {
    it('should throw BadRequestException when total market allocation exceeds activity consumption', () => {
      expect(() =>
        engine.calculateEmission({
          amount: 1000,
          ef: 0.42,
          unit: 'kWh',
          method: 'LOCATION_BASED',
          marketAllocations: [
            {
              instrumentType: 'REC',
              allocatedQuantity: 700,
              factor: 0.0,
            },
            {
              instrumentType: 'PPA',
              allocatedQuantity: 500,
              factor: 0.0,
            },
          ],
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('Instrument Quality Criteria Validation', () => {
    it('should fall back instrument factor to residual mix if quality criteria fail', () => {
      const result = engine.calculateEmission({
        amount: 1000,
        ef: 0.42,
        unit: 'kWh',
        method: 'LOCATION_BASED',
        residualMixEF: 0.50,
        marketAllocations: [
          {
            instrumentType: 'REC',
            allocatedQuantity: 1000,
            factor: 0.0,
            qualityCriteria: {
              conveysEmissionRate: true,
              uniqueClaims: true,
              retiredOrCancelled: false, // Fails Criterion 3: Un-retired REC claim!
              temporalMatching: true,
              geographicBoundary: true,
              supplierSourceValid: true,
              factorAccuracy: true,
              evidenceAuditability: true,
            },
          },
        ],
      });

      // Since quality criteria failed, effective factor falls back to residualMixEF (0.50)
      expect(result.scope2Result?.marketBased.qualityCriteriaPassed).toBe(false);
      expect(result.scope2Result?.marketBased.tonnesCO2e).toBe(0.5);
      expect(
        result.scope2Result?.marketBased.factorAllocations[0].qualityCriteriaMet,
      ).toBe(false);
    });
  });

  describe('Purchased Steam, Heating & Cooling', () => {
    it('should calculate district steam emissions directly in steam mass tonnes without generic kWh conversion', () => {
      const result = engine.calculateEmission({
        amount: 50, // 50 tonnes of steam
        ef: 170.5, // 170.5 kg CO2e / tonne of steam
        unit: 'tonne',
        method: 'PURCHASED_STEAM',
      });

      expect(result.scope2Result?.energyType).toBe('STEAM');
      // 50 tonnes * 170.5 kg/tonne / 1000 = 8.525 tCO2e
      expect(result.scope2Result?.locationBased.tonnesCO2e).toBe(8.525);
    });
  });
});
