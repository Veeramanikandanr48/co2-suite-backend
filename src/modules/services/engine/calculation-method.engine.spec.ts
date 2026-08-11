import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CalculationMethodEngine } from './calculation-method.engine';

describe('CalculationMethodEngine (Complete Regression Test Suite)', () => {
  let engine: CalculationMethodEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculationMethodEngine],
    }).compile();

    engine = module.get<CalculationMethodEngine>(CalculationMethodEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('Regression Test 1: CO2E_TOTAL -> does NOT apply GWP metadata or infer fake gas percentages', () => {
    const res = engine.calculateEmission({
      amount: 1000,
      ef: 2.68,
      factorBasis: 'CO2E_TOTAL',
      efType: 'CO2E',
      method: 'FUEL_BASED',
    });
    expect(res.methodUsed).toBe('FUEL_BASED');
    expect(res.emission).toBe(2.68); // (1000 * 2.68) / 1000
    expect(res.derivedAmount).toBe(1000);
    expect(res.gasBreakdown.factorBasis).toBe('CO2E_TOTAL');
    expect(res.gasBreakdown.factorRepresentation).toBe('TOTAL');
    expect(res.gasBreakdown.efType).toBe('CO2E');
    expect(res.gasBreakdown.gasBreakdownAvailable).toBe(false);
    expect(res.gasBreakdown.gwpSource).toBeNull();
    expect(res.gasBreakdown.gwpVersion).toBeNull();
    expect(res.gasBreakdown.gwpValuesSnapshot).toBeNull();
    expect(res.gasBreakdown.CO2).toBeUndefined();
  });

  it('Regression Test 2: CO2E_COMPONENT -> does NOT re-apply GWP multipliers (DEFRA pre-converted kg CO2e species)', () => {
    const res = engine.calculateEmission({
      amount: 10000, // 10,000 kWh electricity
      ef: 0.177,     // Published Total EF = 0.177 kg CO2e / kWh
      factorBasis: 'CO2E_COMPONENT',
      efCO2: 0.17489, // 0.17489 kg CO2e / kWh
      efCH4: 0.0009,  // 0.0009 kg CO2e / kWh (already converted by DEFRA 2025!)
      efN2O: 0.00122, // 0.00122 kg CO2e / kWh (already converted by DEFRA 2025!)
      gwpSource: 'DEFRA 2025',
      method: 'LOCATION_BASED',
    });
    expect(res.gasBreakdown.factorBasis).toBe('CO2E_COMPONENT');
    expect(res.gasBreakdown.factorRepresentation).toBe('GAS_COMPONENTS');
    expect(res.gasBreakdown.gasBreakdownAvailable).toBe(true);
    expect(res.gasBreakdown.ch4Origin).toBeNull(); // No origin GWP selection needed for pre-converted factors
    expect(res.gasBreakdown.gwpValuesSnapshot).toBeNull(); // No GWP multipliers re-applied!
    expect(res.gasBreakdown.CO2).toBe(1.7489);  // (10000 * 0.17489) / 1000 = 1.7489 tCO2e
    expect(res.gasBreakdown.CH4).toBe(0.009);    // (10000 * 0.0009) / 1000 = 0.009 tCO2e
    expect(res.gasBreakdown.N2O).toBe(0.0122);   // (10000 * 0.00122) / 1000 = 0.0122 tCO2e
  });

  it('Regression Test 3: GAS_MASS -> DOES apply explicit GWP multipliers (29.8 for Fossil CH4, 273 for N2O)', () => {
    const res = engine.calculateEmission({
      amount: 1000, // 1,000 litres fuel
      ef: 2.68,
      factorBasis: 'GAS_MASS',
      efType: 'GAS_SPECIFIC',
      ch4Origin: 'FOSSIL',
      efCO2: 2.65, // 2.65 kg CO2 / L
      efCH4: 0.0005, // 0.0005 kg CH4 / L
      efN2O: 0.0001, // 0.0001 kg N2O / L
      gwpSource: 'IPCC AR6',
      gwpVersion: 'AR6',
      gwpHorizon: '100Y',
      method: 'FUEL_BASED',
    });
    expect(res.gasBreakdown.factorBasis).toBe('GAS_MASS');
    expect(res.gasBreakdown.factorRepresentation).toBe('RAW_GAS');
    expect(res.gasBreakdown.efType).toBe('GAS_SPECIFIC');
    expect(res.gasBreakdown.gasBreakdownAvailable).toBe(true);
    expect(res.gasBreakdown.ch4Origin).toBe('FOSSIL');
    expect(res.gasBreakdown.gwpValuesSnapshot?.CH4).toBe(29.8); // AR6 Fossil CH4 GWP
    expect(res.gasBreakdown.gwpValuesSnapshot?.N2O).toBe(273);  // AR6 N2O GWP
    expect(res.gasBreakdown.CO2).toBe(2.65); // (1000 * 2.65 * 1) / 1000
    expect(res.gasBreakdown.CH4).toBeCloseTo(0.0149, 4); // (1000 * 0.0005 * 29.8) / 1000 = 0.0149 tCO2e
    expect(res.gasBreakdown.N2O).toBeCloseTo(0.0273, 4); // (1000 * 0.0001 * 273) / 1000 = 0.0273 tCO2e
  });

  it('Regression Test 4: GAS_MASS + CH4 -> missing ch4Origin throws 400 BadRequestException', () => {
    expect(() =>
      engine.calculateEmission({
        amount: 1000,
        ef: 2.68,
        factorBasis: 'GAS_MASS',
        efType: 'GAS_SPECIFIC',
        efCH4: 0.0005,
        method: 'FUEL_BASED',
      }),
    ).toThrow(BadRequestException);
  });

  it('Regression Test 5: CO2E_COMPONENT + CH4 -> missing ch4Origin is VALID (no exception thrown)', () => {
    const res = engine.calculateEmission({
      amount: 1000,
      ef: 0.177,
      factorBasis: 'CO2E_COMPONENT',
      efCH4: 0.0009, // Pre-converted kg CO2e / kWh
      method: 'LOCATION_BASED',
    });
    expect(res.gasBreakdown.factorBasis).toBe('CO2E_COMPONENT');
    expect(res.gasBreakdown.CH4).toBe(0.0009); // (1000 * 0.0009) / 1000 = 0.0009 tCO2e
  });

  it('Regression Test 6: Component EF Rounding Arithmetic -> 0.17489 + 0.0009 + 0.00122 = 0.17701 kg CO2e / kWh = 1.7701 tCO2e', () => {
    const res = engine.calculateEmission({
      amount: 10000, // 10,000 kWh
      ef: 0.177,     // Published total EF (rounded)
      factorBasis: 'CO2E_COMPONENT',
      efCO2: 0.17489,
      efCH4: 0.0009,
      efN2O: 0.00122,
      method: 'LOCATION_BASED',
    });
    expect(res.exactEF).toBe(0.17701); // Stored exact factor precision
    expect(res.calculationEngineVersion).toBe('1.0.0'); // Algorithm version snapshot
    expect(res.emission).toBe(1.7701); // 1.7489 + 0.0090 + 0.0122 = 1.7701 tCO2e
  });

  it('GAS_MASS Basis: should calculate raw gas species using Non-Fossil CH4 GWP (27.0 in AR6 per August 2024 standard) when ch4Origin = NON_FOSSIL', () => {
    const res = engine.calculateEmission({
      amount: 1000,
      ef: 2.68,
      factorBasis: 'GAS_MASS',
      efType: 'GAS_SPECIFIC',
      ch4Origin: 'NON_FOSSIL',
      efCO2: 2.65,
      efCH4: 0.0005,
      efN2O: 0.0001,
      gwpSource: 'IPCC AR6',
      gwpVersion: 'AR6',
      gwpHorizon: '100Y',
      method: 'FUEL_BASED',
    });
    expect(res.gasBreakdown.ch4Origin).toBe('NON_FOSSIL');
    expect(res.gasBreakdown.gwpValuesSnapshot?.CH4).toBe(27.0); // AR6 Non-Fossil CH4 GWP (27.0)
    expect(res.gasBreakdown.CH4).toBeCloseTo(0.0135, 4); // (1000 * 0.0005 * 27.0) / 1000 = 0.0135 tCO2e
  });

  it('Validation Safeguard: should throw BadRequestException if distanceType is missing in EMPLOYEE_COMMUTING_BASED', () => {
    expect(() =>
      engine.calculateEmission({
        amount: 0,
        employeeCount: 100,
        travelDays: 220,
        dailyDistance: 20,
        ef: 0.12,
        method: 'EMPLOYEE_COMMUTING_BASED',
      }),
    ).toThrow(BadRequestException);
  });

  it('Scope 3 Category 6: should calculate HOTEL_STAY emissions correctly (numberOfRooms x numberOfNights x EF)', () => {
    const res = engine.calculateEmission({
      amount: 0,
      numberOfRooms: 2,
      numberOfNights: 5,
      ef: 15.5, // 15.5 kg CO2e / room-night
      method: 'HOTEL_STAY',
    });
    expect(res.methodUsed).toBe('HOTEL_STAY');
    expect(res.derivedAmount).toBe(10); // 2 rooms * 5 nights = 10 room-nights
    expect(res.emission).toBe(0.155); // (10 * 15.5) / 1000 = 0.155 tCO2e
    expect(res.inputsSnapshot.numberOfRooms).toBe(2);
    expect(res.inputsSnapshot.numberOfNights).toBe(5);
  });

  it('Scope 3 Category 5: should calculate WASTEWATER_TREATMENT emissions correctly (volume x EF)', () => {
    const res = engine.calculateEmission({
      amount: 500, // 500 m³ wastewater
      ef: 0.72,    // 0.72 kg CO2e / m³
      method: 'WASTEWATER_TREATMENT',
      treatmentMethod: 'ANAEROBIC_DIGESTION',
    });
    expect(res.methodUsed).toBe('WASTEWATER_TREATMENT');
    expect(res.derivedAmount).toBe(500);
    expect(res.emission).toBe(0.36); // (500 * 0.72) / 1000 = 0.36 tCO2e
    expect(res.inputsSnapshot.treatmentMethod).toBe('ANAEROBIC_DIGESTION');
  });

  it('should calculate Scope 3 Category 7 ONE_WAY commuting distance using x2 multiplier for daily round trip', () => {
    const res = engine.calculateEmission({
      amount: 0,
      employeeCount: 100,
      travelDays: 220,
      dailyDistance: 20,
      distanceType: 'ONE_WAY',
      ef: 0.12, // 0.12 kg CO2e / p-km
      method: 'EMPLOYEE_COMMUTING_BASED',
    });
    expect(res.methodUsed).toBe('EMPLOYEE_COMMUTING_BASED');
    expect(res.derivedAmount).toBe(880000); // 100 * 220 * (20 * 2) = 880,000 p-km
    expect(res.emission).toBe(105.6); // (880,000 * 0.12) / 1000 = 105.6 tCO2e
    expect(res.inputsSnapshot.distanceType).toBe('ONE_WAY');
    expect(res.inputsSnapshot.derivedPassengerKm).toBe(880000);
  });

  it('should calculate Scope 3 Category 7 ROUND_TRIP commuting distance without extra x2 multiplier', () => {
    const res = engine.calculateEmission({
      amount: 0,
      employeeCount: 100,
      travelDays: 220,
      dailyDistance: 20,
      distanceType: 'ROUND_TRIP',
      ef: 0.12,
      method: 'EMPLOYEE_COMMUTING_BASED',
    });
    expect(res.derivedAmount).toBe(440000); // 100 * 220 * 20 = 440,000 p-km
    expect(res.emission).toBe(52.8); // (440,000 * 0.12) / 1000 = 52.8 tCO2e
  });

  it('should calculate Scope 1 / Scope 3 DISTANCE_BASED freight/travel emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 100, // 100 km
      weight: 2,   // 2 tonnes cargo
      ef: 0.15,    // 0.15 kg CO2e / t-km
      method: 'DISTANCE_BASED',
      radiativeForcingType: 'WITH_RF',
    });
    expect(res.methodUsed).toBe('DISTANCE_BASED');
    expect(res.derivedAmount).toBe(200); // 100 km * 2 tonnes = 200 t-km
    expect(res.emission).toBe(0.03); // (200 * 0.15) / 1000
    expect(res.inputsSnapshot.radiativeForcingType).toBe('WITH_RF');
  });

  it('should calculate Scope 3 SPEND_BASED EEIO emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 5000, // 5,000 USD
      ef: 0.45,     // 0.45 kg CO2e / USD
      method: 'SPEND_BASED',
    });
    expect(res.methodUsed).toBe('SPEND_BASED');
    expect(res.emission).toBe(2.25); // (5000 * 0.45) / 1000
    expect(res.inputsSnapshot.spendAmount).toBe(5000);
  });

  it('should calculate Scope 2 LOCATION_BASED grid emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 10000, // 10,000 kWh
      ef: 0.42,      // Grid Location EF: 0.42 kg CO2e / kWh
      method: 'LOCATION_BASED',
    });
    expect(res.methodUsed).toBe('LOCATION_BASED');
    expect(res.emission).toBe(4.2); // (10000 * 0.42) / 1000
  });

  it('should calculate Scope 2 MARKET_BASED supplier contract emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 10000, // 10,000 kWh
      ef: 0.10,      // Supplier Market EF: 0.10 kg CO2e / kWh
      method: 'MARKET_BASED',
    });
    expect(res.methodUsed).toBe('MARKET_BASED');
    expect(res.emission).toBe(1.0); // (10000 * 0.10) / 1000
  });

  it('should calculate MASS_BASED waste/material emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 500, // 500 kg
      ef: 0.85,    // 0.85 kg CO2e / kg
      method: 'MASS_BASED',
      treatmentMethod: 'INCINERATION',
    });
    expect(res.methodUsed).toBe('MASS_BASED');
    expect(res.emission).toBe(0.425); // (500 * 0.85) / 1000
    expect(res.inputsSnapshot.treatmentMethod).toBe('INCINERATION');
  });

  // ─── New Priority 1–3 Strategy Tests ────────────────────────────────────────

  it('BUSINESS_TRAVEL_LAND_SEA: should calculate Cat 6 land/sea passenger-km correctly', () => {
    const res = engine.calculateEmission({
      amount: 800, // 800 p-km by rail
      ef: 0.04116, // DEFRA 2025 national rail kg CO2e / p-km
      method: 'BUSINESS_TRAVEL_LAND_SEA',
      transportMode: 'RAIL',
    });
    expect(res.methodUsed).toBe('BUSINESS_TRAVEL_LAND_SEA');
    expect(res.emission).toBe(Number(((800 * 0.04116) / 1000).toFixed(6)));
    expect(res.inputsSnapshot.transportMode).toBe('RAIL');
    expect(res.formulaApplied).toContain('Land_Sea_Travel_EF');
  });

  it('PROCESS_EMISSION_BASED: should calculate S1 process emissions correctly (e.g. cement kiln CO2)', () => {
    const res = engine.calculateEmission({
      amount: 2000, // 2000 kg process output
      ef: 0.52,     // 0.52 kg CO2 / kg product
      method: 'PROCESS_EMISSION_BASED',
    });
    expect(res.methodUsed).toBe('PROCESS_EMISSION_BASED');
    expect(res.emission).toBe(Number(((2000 * 0.52) / 1000).toFixed(6)));
    expect(res.formulaApplied).toContain('Process_EF');
  });

  it('PURCHASED_STEAM: should calculate S2 purchased steam correctly', () => {
    const res = engine.calculateEmission({
      amount: 50,   // 50 GJ steam
      ef: 66.28,    // kg CO2e / GJ
      method: 'PURCHASED_STEAM',
    });
    expect(res.methodUsed).toBe('PURCHASED_STEAM');
    expect(res.emission).toBe(Number(((50 * 66.28) / 1000).toFixed(6)));
    expect(res.formulaApplied).toContain('Steam_EF');
  });

  it('PURCHASED_HEATING: should calculate S2 purchased district heating correctly', () => {
    const res = engine.calculateEmission({
      amount: 30,   // 30 GJ
      ef: 55.0,
      method: 'PURCHASED_HEATING',
    });
    expect(res.methodUsed).toBe('PURCHASED_HEATING');
    expect(res.emission).toBe(Number(((30 * 55.0) / 1000).toFixed(6)));
    expect(res.formulaApplied).toContain('Heat_EF');
  });

  it('PURCHASED_COOLING: should calculate S2 purchased cooling correctly', () => {
    const res = engine.calculateEmission({
      amount: 20,   // 20 MWh
      ef: 0.233,
      method: 'PURCHASED_COOLING',
    });
    expect(res.methodUsed).toBe('PURCHASED_COOLING');
    expect(res.emission).toBe(Number(((20 * 0.233) / 1000).toFixed(6)));
    expect(res.formulaApplied).toContain('Cool_EF');
  });

  it('WTT_BASED: should calculate Cat 3 well-to-tank upstream fuel emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 1000, // 1000 kWh electricity
      ef: 0.01832,  // DEFRA 2025 WTT electricity kWh
      method: 'WTT_BASED',
    });
    expect(res.methodUsed).toBe('WTT_BASED');
    expect(res.emission).toBe(Number(((1000 * 0.01832) / 1000).toFixed(6)));
    expect(res.formulaApplied).toContain('WTT_EF');
  });

  it('TRANSMISSION_DISTRIBUTION: should calculate Cat 3 T&D loss emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 10000, // 10,000 kWh
      ef: 0.02040,   // DEFRA 2025 T&D loss factor
      method: 'TRANSMISSION_DISTRIBUTION',
    });
    expect(res.methodUsed).toBe('TRANSMISSION_DISTRIBUTION');
    expect(res.emission).toBe(Number(((10000 * 0.02040) / 1000).toFixed(6)));
    expect(res.formulaApplied).toContain('T&D_Loss_EF');
  });

  it('SOLD_PRODUCT_PROCESSING: should calculate Cat 10 downstream processing emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 500, // 500 kWh energy used in processing
      ef: 0.233,
      method: 'SOLD_PRODUCT_PROCESSING',
    });
    expect(res.methodUsed).toBe('SOLD_PRODUCT_PROCESSING');
    expect(res.emission).toBe(Number(((500 * 0.233) / 1000).toFixed(6)));
    expect(res.formulaApplied).toContain('Processing_EF');
  });

  it('SOLD_PRODUCT_USE: should calculate Cat 11 lifetime product use emissions correctly', () => {
    // 1000 units × 200 uses × 0.5 kWh/use × 0.233 kg CO2e/kWh
    const res = engine.calculateEmission({
      amount: 0, // overridden by numberSold × lifetimeUses × consumptionPerUse
      ef: 0.233,
      method: 'SOLD_PRODUCT_USE',
      numberSold: 1000,
      lifetimeUses: 200,
      consumptionPerUse: 0.5,
    });
    const expectedDerived = 1000 * 200 * 0.5; // 100,000 kWh
    expect(res.methodUsed).toBe('SOLD_PRODUCT_USE');
    expect(res.derivedAmount).toBe(expectedDerived);
    expect(res.emission).toBe(Number(((expectedDerived * 0.233) / 1000).toFixed(6)));
    expect(res.inputsSnapshot.numberSold).toBe(1000);
    expect(res.inputsSnapshot.lifetimeUses).toBe(200);
    expect(res.inputsSnapshot.consumptionPerUse).toBe(0.5);
    expect(res.formulaApplied).toContain('Lifetime Uses');
  });

  it('END_OF_LIFE: should calculate Cat 12 end-of-life product disposal (distinct from Cat 5)', () => {
    const res = engine.calculateEmission({
      amount: 3000, // 3000 kg sold product mass
      ef: 0.64,     // landfill EF
      method: 'END_OF_LIFE',
      treatmentMethod: 'LANDFILL',
    });
    expect(res.methodUsed).toBe('END_OF_LIFE');
    expect(res.emission).toBe(Number(((3000 * 0.64) / 1000).toFixed(6)));
    expect(res.inputsSnapshot.treatmentMethod).toBe('LANDFILL');
    // Formula must distinguish Cat 12 from Cat 5
    expect(res.formulaApplied).toContain('Cat 12');
  });

  it('FRANCHISE: should calculate Cat 14 franchise proxy emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 50000, // 50,000 kWh total franchisee electricity
      ef: 0.3833,    // DEWA grid factor
      method: 'FRANCHISE',
    });
    expect(res.methodUsed).toBe('FRANCHISE');
    expect(res.emission).toBe(Number(((50000 * 0.3833) / 1000).toFixed(6)));
    expect(res.formulaApplied).toContain('Franchise_EF');
  });

  it('INVESTMENT_BASED: should calculate Cat 15 equity investment attribution correctly', () => {
    // Investee revenue = 5,000,000; equity share = 30%; sector EF = 0.0002 tCO2e per £ revenue
    const res = engine.calculateEmission({
      amount: 5000000,
      ef: 0.0002,
      method: 'INVESTMENT_BASED',
      equityShare: 0.30,
    });
    const expectedDerived = 5000000 * 0.30; // 1,500,000
    expect(res.methodUsed).toBe('INVESTMENT_BASED');
    expect(res.derivedAmount).toBe(expectedDerived);
    expect(res.emission).toBe(Number(((expectedDerived * 0.0002) / 1000).toFixed(6)));
    expect(res.inputsSnapshot.equityShare).toBe(0.30);
    expect(res.formulaApplied).toContain('Equity');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  //  SCOPE 1 ENHANCED CAPABILITIES (FUGITIVE 4-MODE & BIOGENIC SEPARATION)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Scope 1 — Fugitive Emissions 4-Mode Router', () => {
    it('Mode 1: DIRECT_RELEASE -> mass * GWP / 1000', () => {
      const res = engine.calculateEmission({
        amount: 25,
        ef: 2088, // R410A GWP
        method: 'REFRIGERANT_BASED',
        emissionMode: 'DIRECT_RELEASE',
      });
      expect(res.derivedAmount).toBe(25);
      expect(res.emission).toBeCloseTo((25 * 2088) / 1000, 5);
      expect(res.inputsSnapshot.emissionMode).toBe('DIRECT_RELEASE');
      expect(res.formulaApplied).toContain('Direct Refrigerant Released');
    });

    it('Mode 2: RECHARGE_TOPUP -> rechargeAmount * GWP / 1000', () => {
      const res = engine.calculateEmission({
        amount: 0,
        rechargedAmount: 15.5,
        ef: 1430, // R134a GWP
        method: 'REFRIGERANT_BASED',
        emissionMode: 'RECHARGE_TOPUP',
      });
      expect(res.derivedAmount).toBe(15.5);
      expect(res.emission).toBeCloseTo((15.5 * 1430) / 1000, 5);
      expect(res.inputsSnapshot.rechargedAmount).toBe(15.5);
      expect(res.inputsSnapshot.emissionMode).toBe('RECHARGE_TOPUP');
      expect(res.formulaApplied).toContain('Refrigerant Top-up / Recharge');
    });

    it('Mode 3: INVENTORY_DIFFERENCE -> (start + purchased - recovered - end) * GWP / 1000', () => {
      const res = engine.calculateEmission({
        amount: 0,
        inventoryStart: 100,
        purchasedRefrigerant: 50,
        recoveredRefrigerant: 10,
        inventoryEnd: 110,
        ef: 675, // R32 GWP
        method: 'REFRIGERANT_BASED',
        emissionMode: 'INVENTORY_DIFFERENCE',
      });
      // 100 + 50 - 10 - 110 = 30 kg leaked
      expect(res.derivedAmount).toBe(30);
      expect(res.emission).toBeCloseTo((30 * 675) / 1000, 5);
      expect(res.inputsSnapshot.emissionMode).toBe('INVENTORY_DIFFERENCE');
      expect(res.formulaApplied).toContain('Start [100 kg] + Purchased [50 kg]');
    });

    it('Mode 3 Safeguard: INVENTORY_DIFFERENCE with negative loss throws 400 BadRequestException', () => {
      // 100 + 20 - 10 - 150 = -40 kg (negative emission impossible)
      expect(() =>
        engine.calculateEmission({
          amount: 0,
          inventoryStart: 100,
          purchasedRefrigerant: 20,
          recoveredRefrigerant: 10,
          inventoryEnd: 150,
          ef: 675,
          method: 'REFRIGERANT_BASED',
          emissionMode: 'INVENTORY_DIFFERENCE',
        }),
      ).toThrow(BadRequestException);
    });

    it('Mode 4: ESTIMATED_LEAKAGE -> capacity * leakageRate * GWP / 1000 (auto-normalizes integer 8 to 0.08)', () => {
      const res = engine.calculateEmission({
        amount: 0,
        equipmentCapacity: 500,
        leakageRatePercent: 8, // User entered 8 for 8%
        ef: 3922, // R404A GWP
        method: 'REFRIGERANT_BASED',
        emissionMode: 'ESTIMATED_LEAKAGE',
      });
      // 500 * 0.08 = 40 kg leaked
      expect(res.derivedAmount).toBe(40);
      expect(res.emission).toBeCloseTo((40 * 3922) / 1000, 5);
      expect(res.inputsSnapshot.equipmentCapacity).toBe(500);
      expect(res.inputsSnapshot.leakageRatePercent).toBe(0.08);
      expect(res.inputsSnapshot.emissionMode).toBe('ESTIMATED_LEAKAGE');
      expect(res.formulaApplied).toContain('Equipment Capacity [500 kg] × Leakage Rate [8.00%]');
    });

    it('Mode 4 Safeguard: ESTIMATED_LEAKAGE with invalid rate (>100% or <=0%) throws 400', () => {
      expect(() =>
        engine.calculateEmission({
          amount: 0,
          equipmentCapacity: 500,
          leakageRatePercent: 150, // 150% is invalid
          ef: 3922,
          method: 'REFRIGERANT_BASED',
          emissionMode: 'ESTIMATED_LEAKAGE',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('Scope 1 — Biogenic Carbon Memo Separation', () => {
    it('should separate CO2 as biogenic memo while preserving CH4 and N2O in reportable Scope 1 (CO2E_COMPONENT)', () => {
      const res = engine.calculateEmission({
        amount: 10000, // 10,000 litres biodiesel
        ef: 0.05,
        factorBasis: 'CO2E_COMPONENT',
        efCO2: 2.50,   // 2.50 kg CO2e / L (Biogenic CO2 portion)
        efCH4: 0.015,  // 0.015 kg CO2e / L (combustion CH4)
        efN2O: 0.025,  // 0.025 kg CO2e / L (combustion N2O)
        isBiogenic: true,
        method: 'FUEL_BASED',
      });

      // Biogenic CO2 memo = (10,000 * 2.50) / 1000 = 25.0 tCO2
      // Reportable Scope 1 gross = (10,000 * 0.04) / 1000 = 0.4 tCO2e (CH4 + N2O only)
      expect(res.biogenicEmission).toBe(25.0);
      expect(res.fossilEmission).toBe(0.4);
      expect(res.emission).toBe(0.4); // Primary reportable Scope 1 excludes biogenic CO2 per GHG Protocol!
      expect(res.inputsSnapshot.isBiogenic).toBe(true);
    });

    it('should isolate 100% of emission into biogenic memo when isBiogenic is true on CO2E_TOTAL', () => {
      const res = engine.calculateEmission({
        amount: 5000, // 5,000 kg wood pellets
        ef: 0.015,
        factorBasis: 'CO2E_TOTAL',
        isBiogenic: true,
        method: 'FUEL_BASED',
      });

      expect(res.biogenicEmission).toBe(0.075);
      expect(res.fossilEmission).toBe(0);
      expect(res.emission).toBe(0); // Scope 1 reportable is 0; 0.075 is recorded as biogenic memo
      expect(res.inputsSnapshot.isBiogenic).toBe(true);
    });
  });
});
