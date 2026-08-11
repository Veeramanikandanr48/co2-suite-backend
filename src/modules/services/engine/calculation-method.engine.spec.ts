import { Test, TestingModule } from '@nestjs/testing';
import { CalculationMethodEngine } from './calculation-method.engine';

describe('CalculationMethodEngine', () => {
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

  it('should calculate Scope 1 / General FUEL_BASED emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 1000,
      ef: 2.68,
      method: 'FUEL_BASED',
    });
    expect(res.methodUsed).toBe('FUEL_BASED');
    expect(res.emission).toBe(2.68); // (1000 * 2.68) / 1000
  });

  it('should calculate Scope 1 / Scope 3 DISTANCE_BASED freight/travel emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 100, // 100 km
      weight: 2,   // 2 tonnes cargo
      ef: 0.15,    // 0.15 kg CO2e / t-km
      method: 'DISTANCE_BASED',
    });
    expect(res.methodUsed).toBe('DISTANCE_BASED');
    expect(res.emission).toBe(0.03); // (100 * 2 * 0.15) / 1000
  });

  it('should calculate Scope 3 SPEND_BASED EEIO emissions correctly', () => {
    const res = engine.calculateEmission({
      amount: 5000, // 5,000 USD
      ef: 0.45,     // 0.45 kg CO2e / USD
      method: 'SPEND_BASED',
    });
    expect(res.methodUsed).toBe('SPEND_BASED');
    expect(res.emission).toBe(2.25); // (5000 * 0.45) / 1000
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
    });
    expect(res.methodUsed).toBe('MASS_BASED');
    expect(res.emission).toBe(0.425); // (500 * 0.85) / 1000
  });
});
