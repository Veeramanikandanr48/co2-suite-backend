import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UnitNormalizationService } from './unit-normalization.service';

describe('UnitNormalizationService', () => {
  let service: UnitNormalizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitNormalizationService],
    }).compile();

    service = module.get<UnitNormalizationService>(UnitNormalizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Volume Conversions ───────────────────────────────────────────────────
  it('should normalize 1000 US Gallons to 3785.411784 Litres', () => {
    const res = service.normalizeUnit(1000, 'us_gallon', 'l');
    expect(res.unitCategory).toBe('VOLUME');
    expect(res.normalizedAmount).toBeCloseTo(3785.411784, 3);
    expect(res.normalizedUnit).toBe('l');
  });

  it('should normalize 1 m3 to 1000 Litres', () => {
    const res = service.normalizeUnit(1, 'm3', 'l');
    expect(res.normalizedAmount).toBe(1000);
    expect(res.normalizedUnit).toBe('l');
  });

  // ─── Mass Conversions ─────────────────────────────────────────────────────
  it('should normalize 2204.62 Lbs to 1000 kg', () => {
    const res = service.normalizeUnit(2204.62, 'lbs', 'kg');
    expect(res.unitCategory).toBe('MASS');
    expect(res.normalizedAmount).toBeCloseTo(1000.0, 1);
    expect(res.normalizedUnit).toBe('kg');
  });

  // ─── Energy Conversions ───────────────────────────────────────────────────
  it('should normalize 1 MWh to 1000 kWh', () => {
    const res = service.normalizeUnit(1, 'mwh', 'kwh');
    expect(res.unitCategory).toBe('ENERGY');
    expect(res.normalizedAmount).toBe(1000);
    expect(res.normalizedUnit).toBe('kwh');
  });

  it('should normalize 1 GJ to 277.78 kWh', () => {
    const res = service.normalizeUnit(1, 'gj', 'kwh');
    expect(res.normalizedAmount).toBeCloseTo(277.777778, 2);
  });

  // ─── Distance Conversions ─────────────────────────────────────────────────
  it('should normalize 100 Miles to 160.9344 km', () => {
    const res = service.normalizeUnit(100, 'miles', 'km');
    expect(res.unitCategory).toBe('DISTANCE');
    expect(res.normalizedAmount).toBe(160.9344);
  });

  // ─── Cross-Category Incompatibility Protection ──────────────────────────────
  it('should throw BadRequestException when attempting incompatible cross-category conversion (Volume to Energy)', () => {
    expect(() => service.normalizeUnit(100, 'litre', 'kwh')).toThrow(
      BadRequestException,
    );
  });
});
