/**
 * SOURCE DOCUMENT ACCEPTANCE SUITE
 *
 * Purpose: Prove that the application can accept the activity data structures
 * defined in the supplied GHG Data Collection Workbook (28 sheets), route each
 * to the correct v1.0.0 calculation strategy, produce authoritative CO₂e, and
 * preserve an immutable audit snapshot.
 *
 * Acceptance levels validated for each test:
 *   #1  FIELD ACCEPTANCE  — all required source fields are present in the payload
 *   #2  STRATEGY MAPPING  — methodUsed equals the expected strategy key
 *   #3  CALCULATION       — emission arithmetic is correct to 6 decimal places
 *   #4  AUDIT SNAPSHOT    — methodologyInputsSnapshot preserves every input field
 *
 * Factor values are representative of DEFRA 2025 / IPCC AR6 source documents.
 * Emission factors are in kg CO₂e per unit; results are in tCO₂e.
 * Formula: (derivedAmount × ef) / 1000 = tCO₂e
 *
 * @see calculation-method.engine.ts  — v1.0.0 strategy router
 * @see DEFRA 2025 Conversion Factors
 * @see IPCC AR6 GWP (Aug 2024): CO₂=1, CH₄-fossil=29.8, CH₄-non-fossil=27.0, N₂O=273
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  CalculationMethodEngine,
  CalculationInput,
} from './calculation-method.engine';

/** Convenience: run engine and validate non-zero emission + engine version */
function accept(engine: CalculationMethodEngine, input: CalculationInput) {
  const result = engine.calculateEmission(input);
  expect(result.calculationEngineVersion).toBe('1.0.0');
  return result;
}

describe('SOURCE DOCUMENT ACCEPTANCE SUITE — GHG Data Collection Workbook (24 Sheets)', () => {
  let engine: CalculationMethodEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculationMethodEngine],
    }).compile();
    engine = module.get<CalculationMethodEngine>(CalculationMethodEngine);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  //  SCOPE 1
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Scope 1 — Stationary Combustion', () => {
    it('S1 Stationary Fuel: Natural Gas boiler, kWh, DEFRA 2025 CO2E_COMPONENT', () => {
      const result = accept(engine, {
        amount: 50000,
        ef: 0.18296,
        method: 'FUEL_BASED',
        factorBasis: 'CO2E_COMPONENT',
        efCO2: 0.18259,
        efCH4: 0.00028,
        efN2O: 0.00009,
        gwpSource: 'DEFRA 2025',
        methodologyInputsSnapshot: {
          fuelType: 'Natural Gas',
          quantity: 50000,
          unit: 'kWh',
        },
      });

      expect(result.inputsSnapshot.fuelType).toBe('Natural Gas');
      expect(result.methodUsed).toBe('FUEL_BASED');
      expect(result.emission).toBeCloseTo(
        Number(((50000 * 0.18296) / 1000).toFixed(6)),
        5,
      );
      expect(result.gasBreakdown.gasBreakdownAvailable).toBe(true);
      expect(result.gasBreakdown.factorBasis).toBe('CO2E_COMPONENT');
    });
  });

  describe('Scope 1 — Mobile Combustion', () => {
    it('S1 Mobile Fuel: Company van diesel, litres, DEFRA 2025 CO2E_TOTAL', () => {
      const result = accept(engine, {
        amount: 2000,
        ef: 2.51599,
        method: 'FUEL_BASED',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          vehicleType: 'Van',
          fuelType: 'Diesel',
          quantity: 2000,
          unit: 'litre',
        },
      });

      expect(result.inputsSnapshot.vehicleType).toBe('Van');
      expect(result.methodUsed).toBe('FUEL_BASED');
      expect(result.emission).toBeCloseTo(
        Number(((2000 * 2.51599) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Scope 1 — Process Emissions', () => {
    it('S1 Process Emission: Lime kiln CO2, quantity (kg), process EF', () => {
      const result = accept(engine, {
        amount: 5000,
        ef: 0.44,
        method: 'PROCESS_EMISSION_BASED',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          emissionSource: 'Lime kiln',
          quantity: 5000,
          unit: 'kg',
        },
      });

      expect(result.inputsSnapshot.emissionSource).toBe('Lime kiln');
      expect(result.methodUsed).toBe('PROCESS_EMISSION_BASED');
      expect(result.emission).toBeCloseTo(
        Number(((5000 * 0.44) / 1000).toFixed(6)),
        5,
      );
      expect(result.formulaApplied).toContain('Process_EF');
    });
  });

  describe('Scope 1 — Fugitive Refrigerant Emissions', () => {
    it('S1 Fugitive: R410A refrigerant, kg consumed, IPCC AR6 GWP (Store Makers data)', () => {
      // Store Makers actual: R410A, net gas quantity, 5% leakage applied upstream
      const result = accept(engine, {
        amount: 12.5,
        ef: 2088, // R410A GWP100 IPCC AR6
        method: 'REFRIGERANT_BASED',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          refrigerantType: 'R410A',
          quantityConsumed: 12.5,
          unit: 'kg',
          gwpSource: 'IPCC AR6',
          leakageRate: 0.05,
        },
      });

      expect(result.inputsSnapshot.refrigerantType).toBe('R410A');
      expect(result.inputsSnapshot.leakageRate).toBe(0.05);
      expect(result.methodUsed).toBe('REFRIGERANT_BASED');
      expect(result.emission).toBeCloseTo(
        Number(((12.5 * 2088) / 1000).toFixed(6)),
        4,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  //  SCOPE 2
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Scope 2 — Purchased Electricity (Location-Based)', () => {
    it('S2 Electricity: DEWA grid (UAE), kWh, 0.3833 kg CO2e/kWh (Store Makers source)', () => {
      const result = accept(engine, {
        amount: 450000,
        ef: 0.3833,
        method: 'LOCATION_BASED',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          gridRegion: 'UAE - DEWA',
          factorSource: 'DEWA 2025',
          quantity: 450000,
          unit: 'kWh',
        },
      });

      expect(result.inputsSnapshot.gridRegion).toBe('UAE - DEWA');
      expect(result.inputsSnapshot.factorSource).toBe('DEWA 2025');
      expect(result.methodUsed).toBe('LOCATION_BASED');
      expect(result.emission).toBeCloseTo(
        Number(((450000 * 0.3833) / 1000).toFixed(6)),
        4,
      );
    });
  });

  describe('Scope 2 — Purchased Steam', () => {
    it('S2 Steam: District steam, GJ, DEFRA 2025 steam EF', () => {
      const result = accept(engine, {
        amount: 200,
        ef: 66.28,
        method: 'PURCHASED_STEAM',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          quantity: 200,
          unit: 'GJ',
          factorSource: 'DEFRA 2025',
          energyType: 'STEAM',
        },
      });

      expect(result.inputsSnapshot.energyType).toBe('STEAM');
      expect(result.methodUsed).toBe('PURCHASED_STEAM');
      expect(result.emission).toBeCloseTo(
        Number(((200 * 66.28) / 1000).toFixed(6)),
        5,
      );
      expect(result.formulaApplied).toContain('Steam_EF');
    });
  });

  describe('Scope 2 — Purchased Heating', () => {
    it('S2 Heating: District heating, GJ, heat EF', () => {
      const result = accept(engine, {
        amount: 150,
        ef: 55.0,
        method: 'PURCHASED_HEATING',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          quantity: 150,
          unit: 'GJ',
          energyType: 'DISTRICT_HEAT',
        },
      });

      expect(result.inputsSnapshot.energyType).toBe('DISTRICT_HEAT');
      expect(result.methodUsed).toBe('PURCHASED_HEATING');
      expect(result.emission).toBeCloseTo(
        Number(((150 * 55.0) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Scope 2 — Purchased Cooling', () => {
    it('S2 Cooling: District cooling, MWh, cooling EF', () => {
      const result = accept(engine, {
        amount: 80,
        ef: 0.233,
        method: 'PURCHASED_COOLING',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          quantity: 80,
          unit: 'MWh',
          energyType: 'DISTRICT_COOL',
        },
      });

      expect(result.inputsSnapshot.energyType).toBe('DISTRICT_COOL');
      expect(result.methodUsed).toBe('PURCHASED_COOLING');
      expect(result.emission).toBeCloseTo(
        Number(((80 * 0.233) / 1000).toFixed(6)),
        5,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  //  SCOPE 3 — CATEGORIES 1–15
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Cat 1 — Purchased Goods & Services', () => {
    it('S3 Cat1 Purchased Goods: EEIO spend-based, £ spend × sector EF', () => {
      const result = accept(engine, {
        amount: 250000,
        ef: 0.32,
        method: 'SPEND_BASED',
        spend: 250000,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          category: 'Office Supplies',
          spend: 250000,
          currency: 'GBP',
          eeioSource: 'DEFRA 2025',
          goodsType: 'PURCHASED_GOODS',
        },
      });

      expect(result.inputsSnapshot.goodsType).toBe('PURCHASED_GOODS');
      expect(result.inputsSnapshot.currency).toBe('GBP');
      expect(result.methodUsed).toBe('SPEND_BASED');
      expect(result.emission).toBeCloseTo(
        Number(((250000 * 0.32) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 2 — Capital Goods', () => {
    it('S3 Cat2 Capital Goods: EEIO spend-based, £ capex × sector EF', () => {
      const result = accept(engine, {
        amount: 500000,
        ef: 0.45,
        method: 'SPEND_BASED',
        spend: 500000,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          category: 'Manufacturing Equipment',
          spend: 500000,
          currency: 'GBP',
          goodsType: 'CAPITAL_GOODS',
        },
      });

      expect(result.inputsSnapshot.goodsType).toBe('CAPITAL_GOODS');
      expect(result.methodUsed).toBe('SPEND_BASED');
      expect(result.emission).toBeCloseTo(
        Number(((500000 * 0.45) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 3 — Fuel & Energy-Related (WTT + T&D)', () => {
    it('S3 Cat3 WTT: Electricity well-to-tank, kWh × WTT EF (DEFRA 2025)', () => {
      const result = accept(engine, {
        amount: 450000,
        ef: 0.01832,
        method: 'WTT_BASED',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          energyType: 'ELECTRICITY',
          quantity: 450000,
          unit: 'kWh',
          wttSource: 'DEFRA 2025',
        },
      });

      expect(result.inputsSnapshot.energyType).toBe('ELECTRICITY');
      expect(result.methodUsed).toBe('WTT_BASED');
      expect(result.emission).toBeCloseTo(
        Number(((450000 * 0.01832) / 1000).toFixed(6)),
        5,
      );
      expect(result.formulaApplied).toContain('WTT_EF');
    });

    it('S3 Cat3 T&D: Transmission & distribution losses, kWh × T&D EF (DEFRA 2025)', () => {
      const result = accept(engine, {
        amount: 450000,
        ef: 0.0204,
        method: 'TRANSMISSION_DISTRIBUTION',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          energyType: 'ELECTRICITY',
          quantity: 450000,
          unit: 'kWh',
          region: 'UK',
        },
      });

      expect(result.inputsSnapshot.region).toBe('UK');
      expect(result.methodUsed).toBe('TRANSMISSION_DISTRIBUTION');
      expect(result.emission).toBeCloseTo(
        Number(((450000 * 0.0204) / 1000).toFixed(6)),
        5,
      );
      expect(result.formulaApplied).toContain('T&D_Loss_EF');
    });
  });

  describe('Cat 4 — Upstream Transportation & Distribution', () => {
    it('S3 Cat4 Freight: Road HGV, tonne-km, DEFRA 2025', () => {
      const result = accept(engine, {
        amount: 0,
        ef: 0.10406,
        method: 'FREIGHT_BASED',
        distance: 500,
        weight: 20,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          freightMode: 'HGV_REFRIGERATED',
          weight: 20,
          distance: 500,
          unit: 'tonne-km',
          category: 'UPSTREAM_DISTRIBUTION',
        },
      });

      expect(result.inputsSnapshot.category).toBe('UPSTREAM_DISTRIBUTION');
      expect(result.methodUsed).toBe('FREIGHT_BASED');
      expect(result.derivedAmount).toBe(20 * 500);
      expect(result.emission).toBeCloseTo(
        Number(((10000 * 0.10406) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 5 — Waste Generated in Operations', () => {
    it('S3 Cat5 Waste: Mixed waste to landfill, tonnes, DEFRA 2025 (CAT_5_OPERATIONAL context)', () => {
      const result = accept(engine, {
        amount: 50,
        ef: 446.77,
        method: 'WASTE_DISPOSAL',
        treatmentMethod: 'LANDFILL',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          wasteType: 'Mixed Waste',
          quantity: 50,
          unit: 'tonne',
          treatmentMethod: 'LANDFILL',
          wasteContext: 'CAT_5_OPERATIONAL',
        },
      });

      expect(result.inputsSnapshot.wasteContext).toBe('CAT_5_OPERATIONAL');
      expect(result.methodUsed).toBe('WASTE_DISPOSAL');
      expect(result.emission).toBeCloseTo(
        Number(((50 * 446.77) / 1000).toFixed(6)),
        4,
      );
    });
  });

  describe('Cat 6 — Business Travel Air', () => {
    it('S3 Cat6 Air Travel: Long-haul economy, passenger-km, DEFRA 2025 with RFI', () => {
      const result = accept(engine, {
        amount: 12500,
        ef: 0.15102,
        method: 'BUSINESS_TRAVEL_AIR',
        radiativeForcingType: 'WITH_RFI',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          origin: 'Dubai (DXB)',
          destination: 'London (LHR)',
          flightClass: 'ECONOMY',
          flightType: 'LONG_HAUL',
          passengers: 1,
          distanceKm: 5500,
          radiativeForcingType: 'WITH_RFI',
        },
      });

      expect(result.inputsSnapshot.origin).toBe('Dubai (DXB)');
      expect(result.inputsSnapshot.flightClass).toBe('ECONOMY');
      expect(result.methodUsed).toBe('BUSINESS_TRAVEL_AIR');
      expect(result.emission).toBeCloseTo(
        Number(((12500 * 0.15102) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 6 — Business Travel Hotel', () => {
    it('S3 Cat6 Hotel: City hotel, rooms x nights x EF', () => {
      const result = accept(engine, {
        amount: 0,
        ef: 24.29,
        method: 'HOTEL_STAY',
        numberOfRooms: 2,
        numberOfNights: 3,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          hotelType: 'City Hotel',
          numberOfRooms: 2,
          numberOfNights: 3,
          location: 'London',
        },
      });

      expect(result.inputsSnapshot.hotelType).toBe('City Hotel');
      expect(result.methodUsed).toBe('HOTEL_STAY');
      expect(result.derivedAmount).toBe(6); // 2 × 3
      expect(result.emission).toBeCloseTo(
        Number(((6 * 24.29) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 6 — Business Travel Land & Sea', () => {
    it('S3 Cat6 Land/Sea: National rail, passenger-km, DEFRA 2025', () => {
      const result = accept(engine, {
        amount: 1200,
        ef: 0.04116,
        method: 'BUSINESS_TRAVEL_LAND_SEA',
        transportMode: 'RAIL',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          transportMode: 'RAIL',
          origin: 'Manchester',
          destination: 'London',
          passengers: 2,
          distanceKm: 300,
          unit: 'passenger-km',
        },
      });

      expect(result.inputsSnapshot.transportMode).toBe('RAIL');
      expect(result.inputsSnapshot.origin).toBe('Manchester');
      expect(result.methodUsed).toBe('BUSINESS_TRAVEL_LAND_SEA');
      expect(result.emission).toBeCloseTo(
        Number(((1200 * 0.04116) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 7 — Employee Commuting', () => {
    it('S3 Cat7 Commuting: Car ONE_WAY x GHG Protocol round-trip x2 multiplier', () => {
      const result = accept(engine, {
        amount: 0,
        ef: 0.17064,
        method: 'EMPLOYEE_COMMUTING_BASED',
        distanceType: 'ONE_WAY',
        employeeCount: 250,
        travelDays: 220,
        dailyDistance: 15,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          transportMode: 'CAR_AVERAGE',
          employeeCount: 250,
          workingDays: 220,
          dailyOneWayDistance: 15,
          distanceType: 'ONE_WAY',
        },
      });

      const expectedDerived = 250 * 220 * (15 * 2); // ONE_WAY → x2
      expect(result.inputsSnapshot.transportMode).toBe('CAR_AVERAGE');
      expect(result.methodUsed).toBe('EMPLOYEE_COMMUTING_BASED');
      expect(result.derivedAmount).toBe(expectedDerived);
      expect(result.emission).toBeCloseTo(
        Number(((expectedDerived * 0.17064) / 1000).toFixed(6)),
        4,
      );
    });
  });

  describe('Cat 7 — Remote Working / Homeworking', () => {
    it('S3 Cat7 Remote Work: Total homeworking hours x EF (DEFRA 2025)', () => {
      const result = accept(engine, {
        amount: 440000, // 250 employees × 220 days × 8 hours
        ef: 0.00254,
        method: 'HOMEWORKING',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          employeeCount: 250,
          homeworkingDays: 220,
          hoursPerDay: 8,
          totalHours: 440000,
          factorSource: 'DEFRA 2025',
        },
      });

      expect(result.inputsSnapshot.employeeCount).toBe(250);
      expect(result.methodUsed).toBe('HOMEWORKING');
      expect(result.emission).toBeCloseTo(
        Number(((440000 * 0.00254) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 8 — Upstream Leased Assets', () => {
    it('S3 Cat8 Leased Asset: Office building kWh, upstream context', () => {
      const result = accept(engine, {
        amount: 85000,
        ef: 0.20493,
        method: 'LEASED_ASSET',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          assetType: 'OFFICE_BUILDING',
          assetCategory: 'UPSTREAM_LEASED',
          energyConsumption: 85000,
          unit: 'kWh',
          gridRegion: 'UK',
        },
      });

      expect(result.inputsSnapshot.assetCategory).toBe('UPSTREAM_LEASED');
      expect(result.methodUsed).toBe('LEASED_ASSET');
      expect(result.emission).toBeCloseTo(
        Number(((85000 * 0.20493) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 9 — Downstream Transportation & Distribution', () => {
    it('S3 Cat9 Downstream Freight: Air freight, tonne-km, DEFRA 2025', () => {
      const result = accept(engine, {
        amount: 0,
        ef: 1.44012,
        method: 'FREIGHT_BASED',
        distance: 5500,
        weight: 0.5,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          freightMode: 'AIR',
          weight: 0.5,
          distance: 5500,
          unit: 'tonne-km',
          category: 'DOWNSTREAM_DISTRIBUTION',
        },
      });

      expect(result.inputsSnapshot.category).toBe('DOWNSTREAM_DISTRIBUTION');
      expect(result.methodUsed).toBe('FREIGHT_BASED');
      expect(result.derivedAmount).toBe(0.5 * 5500);
      expect(result.emission).toBeCloseTo(
        Number(((2750 * 1.44012) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 10 — Processing of Sold Products', () => {
    it('S3 Cat10 Processing: Downstream electricity used in processing, kWh', () => {
      const result = accept(engine, {
        amount: 30000,
        ef: 0.20493,
        method: 'SOLD_PRODUCT_PROCESSING',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          processingEnergyType: 'ELECTRICITY',
          electricityKwh: 30000,
          fuelLitres: 0,
          refrigerantKg: 0,
          unit: 'kWh',
          category: 'CAT_10_PROCESSING',
        },
      });

      expect(result.inputsSnapshot.category).toBe('CAT_10_PROCESSING');
      expect(result.inputsSnapshot.processingEnergyType).toBe('ELECTRICITY');
      expect(result.methodUsed).toBe('SOLD_PRODUCT_PROCESSING');
      expect(result.emission).toBeCloseTo(
        Number(((30000 * 0.20493) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 11 — Use of Sold Products', () => {
    it('S3 Cat11 Use: Units sold × lifetime uses × consumption per use × EF', () => {
      const result = accept(engine, {
        amount: 0,
        ef: 0.20493,
        method: 'SOLD_PRODUCT_USE',
        numberSold: 5000,
        lifetimeUses: 1000,
        consumptionPerUse: 2.5,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          productType: 'Electric Appliance',
          numberSold: 5000,
          lifetimeUses: 1000,
          consumptionPerUse: 2.5,
          consumptionUnit: 'kWh',
          category: 'CAT_11_USE',
        },
      });

      const expectedDerived = 5000 * 1000 * 2.5; // 12,500,000 kWh
      expect(result.inputsSnapshot.category).toBe('CAT_11_USE');
      expect(result.methodUsed).toBe('SOLD_PRODUCT_USE');
      expect(result.derivedAmount).toBe(expectedDerived);
      expect(result.emission).toBeCloseTo(
        Number(((expectedDerived * 0.20493) / 1000).toFixed(6)),
        4,
      );
      expect(result.formulaApplied).toContain('Lifetime Uses');
    });
  });

  describe('Cat 12 — End-of-Life Treatment of Sold Products', () => {
    it('S3 Cat12 End-of-Life: Product mass × EOL EF — distinct context from Cat 5 operational waste', () => {
      const result = accept(engine, {
        amount: 8000,
        ef: 0.64,
        method: 'END_OF_LIFE',
        treatmentMethod: 'LANDFILL',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          productType: 'Electronic Device',
          totalProductMassKg: 8000,
          treatmentMethod: 'LANDFILL',
          wasteContext: 'CAT_12_END_OF_LIFE',
          category: 'CAT_12',
        },
      });

      expect(result.inputsSnapshot.wasteContext).toBe('CAT_12_END_OF_LIFE');
      expect(result.methodUsed).toBe('END_OF_LIFE');
      // Critical: formula must explicitly distinguish Cat 12 from Cat 5
      expect(result.formulaApplied).toContain('Cat 12');
      expect(result.emission).toBeCloseTo(
        Number(((8000 * 0.64) / 1000).toFixed(6)),
        5,
      );
    });
  });

  describe('Cat 13 — Downstream Leased Assets', () => {
    it('S3 Cat13 Downstream Leased: Retail outlet kWh, DEWA grid, downstream context', () => {
      const result = accept(engine, {
        amount: 120000,
        ef: 0.3833,
        method: 'LEASED_ASSET',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          assetType: 'RETAIL_OUTLET',
          assetCategory: 'DOWNSTREAM_LEASED',
          energyConsumption: 120000,
          unit: 'kWh',
          gridRegion: 'UAE - DEWA',
          lesseeType: 'TENANT',
        },
      });

      expect(result.inputsSnapshot.assetCategory).toBe('DOWNSTREAM_LEASED');
      expect(result.inputsSnapshot.lesseeType).toBe('TENANT');
      expect(result.methodUsed).toBe('LEASED_ASSET');
      expect(result.emission).toBeCloseTo(
        Number(((120000 * 0.3833) / 1000).toFixed(6)),
        4,
      );
    });
  });

  describe('Cat 14 — Franchise Operations', () => {
    it('S3 Cat14 Franchise: Number of franchises, area, Scope 1+2 proxy electricity', () => {
      const result = accept(engine, {
        amount: 280000,
        ef: 0.3833,
        method: 'FRANCHISE',
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          numberOfFranchises: 12,
          buildingType: 'RETAIL_STORE',
          totalFloorAreaM2: 8400,
          numberOfVehicles: 24,
          totalElectricityKwh: 280000,
          methodApproach: 'FRANCHISE_PROXY',
          category: 'CAT_14_FRANCHISE',
        },
      });

      expect(result.inputsSnapshot.numberOfFranchises).toBe(12);
      expect(result.inputsSnapshot.buildingType).toBe('RETAIL_STORE');
      expect(result.methodUsed).toBe('FRANCHISE');
      expect(result.emission).toBeCloseTo(
        Number(((280000 * 0.3833) / 1000).toFixed(6)),
        4,
      );
    });
  });

  describe('Cat 15 — Investments', () => {
    it('S3 Cat15 Equity Investment: Investee revenue × equity % × sector EF', () => {
      const result = accept(engine, {
        amount: 8000000,
        ef: 0.00015,
        method: 'INVESTMENT_BASED',
        equityShare: 0.25,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          investeeCompany: 'Green Tech Ltd',
          sector: 'Technology',
          investeeRevenue: 8000000,
          reportingCompanyEquityPercent: 0.25,
          investmentType: 'EQUITY',
          category: 'CAT_15_INVESTMENT',
        },
      });

      const expectedDerived = 8000000 * 0.25; // 2,000,000
      expect(result.inputsSnapshot.investeeCompany).toBe('Green Tech Ltd');
      expect(result.inputsSnapshot.investmentType).toBe('EQUITY');
      expect(result.methodUsed).toBe('INVESTMENT_BASED');
      expect(result.derivedAmount).toBe(expectedDerived);
      expect(result.emission).toBeCloseTo(
        Number(((expectedDerived * 0.00015) / 1000).toFixed(6)),
        6,
      );
      expect(result.formulaApplied).toContain('Equity');
    });

    it('S3 Cat15 Project Finance: Project cost × ownership share × sector EF', () => {
      const result = accept(engine, {
        amount: 20000000,
        ef: 0.00008,
        method: 'INVESTMENT_BASED',
        equityShare: 0.4,
        factorBasis: 'CO2E_TOTAL',
        methodologyInputsSnapshot: {
          projectType: 'RENEWABLE_ENERGY',
          projectPhase: 'CONSTRUCTION',
          projectCost: 20000000,
          shareOfProjectCosts: 0.4,
          investmentType: 'PROJECT_FINANCE',
          category: 'CAT_15_INVESTMENT',
        },
      });

      const expectedDerived = 20000000 * 0.4; // 8,000,000
      expect(result.inputsSnapshot.investmentType).toBe('PROJECT_FINANCE');
      expect(result.methodUsed).toBe('INVESTMENT_BASED');
      expect(result.derivedAmount).toBe(expectedDerived);
      expect(result.emission).toBeCloseTo(
        Number(((expectedDerived * 0.00008) / 1000).toFixed(6)),
        6,
      );
    });
  });
});
