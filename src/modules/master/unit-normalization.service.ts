import { BadRequestException, Injectable } from '@nestjs/common';

export type PhysicalUnitCategory =
  'VOLUME' | 'MASS' | 'ENERGY' | 'DISTANCE' | 'FREIGHT' | 'UNKNOWN';

export interface UnitNormalizationResult {
  originalAmount: number;
  originalUnit: string;
  normalizedAmount: number;
  normalizedUnit: string;
  conversionFactor: number;
  unitCategory: PhysicalUnitCategory;
  isCompatible: boolean;
}

@Injectable()
export class UnitNormalizationService {
  /**
   * Deterministic conversion factors relative to category base unit:
   * VOLUME base: 'l' (litre)
   * MASS base: 'kg' (kilogram)
   * ENERGY base: 'kwh' (kilowatt-hour)
   * DISTANCE base: 'km' (kilometre)
   * FREIGHT base: 't-km' (tonne-kilometre)
   */
  private readonly unitMap: Record<
    string,
    {
      category: PhysicalUnitCategory;
      baseFactor: number;
      canonicalSymbol: string;
    }
  > = {
    // ── Volume ──
    l: { category: 'VOLUME', baseFactor: 1.0, canonicalSymbol: 'l' },
    litre: { category: 'VOLUME', baseFactor: 1.0, canonicalSymbol: 'l' },
    litres: { category: 'VOLUME', baseFactor: 1.0, canonicalSymbol: 'l' },
    liter: { category: 'VOLUME', baseFactor: 1.0, canonicalSymbol: 'l' },
    liters: { category: 'VOLUME', baseFactor: 1.0, canonicalSymbol: 'l' },
    us_gallon: {
      category: 'VOLUME',
      baseFactor: 3.785411784,
      canonicalSymbol: 'l',
    },
    gallon_us: {
      category: 'VOLUME',
      baseFactor: 3.785411784,
      canonicalSymbol: 'l',
    },
    gallon: {
      category: 'VOLUME',
      baseFactor: 3.785411784,
      canonicalSymbol: 'l',
    },
    gallons: {
      category: 'VOLUME',
      baseFactor: 3.785411784,
      canonicalSymbol: 'l',
    },
    uk_gallon: {
      category: 'VOLUME',
      baseFactor: 4.54609,
      canonicalSymbol: 'l',
    },
    gallon_uk: {
      category: 'VOLUME',
      baseFactor: 4.54609,
      canonicalSymbol: 'l',
    },
    m3: { category: 'VOLUME', baseFactor: 1000.0, canonicalSymbol: 'l' },
    cubic_metre: {
      category: 'VOLUME',
      baseFactor: 1000.0,
      canonicalSymbol: 'l',
    },
    cubic_meter: {
      category: 'VOLUME',
      baseFactor: 1000.0,
      canonicalSymbol: 'l',
    },
    sm3: { category: 'VOLUME', baseFactor: 1000.0, canonicalSymbol: 'l' },
    ml: { category: 'VOLUME', baseFactor: 0.001, canonicalSymbol: 'l' },

    // ── Mass ──
    kg: { category: 'MASS', baseFactor: 1.0, canonicalSymbol: 'kg' },
    kilogram: { category: 'MASS', baseFactor: 1.0, canonicalSymbol: 'kg' },
    kilograms: { category: 'MASS', baseFactor: 1.0, canonicalSymbol: 'kg' },
    g: { category: 'MASS', baseFactor: 0.001, canonicalSymbol: 'kg' },
    gram: { category: 'MASS', baseFactor: 0.001, canonicalSymbol: 'kg' },
    grams: { category: 'MASS', baseFactor: 0.001, canonicalSymbol: 'kg' },
    tonne: { category: 'MASS', baseFactor: 1000.0, canonicalSymbol: 'kg' },
    tonnes: { category: 'MASS', baseFactor: 1000.0, canonicalSymbol: 'kg' },
    t: { category: 'MASS', baseFactor: 1000.0, canonicalSymbol: 'kg' },
    metric_tonne: {
      category: 'MASS',
      baseFactor: 1000.0,
      canonicalSymbol: 'kg',
    },
    lb: { category: 'MASS', baseFactor: 0.45359237, canonicalSymbol: 'kg' },
    lbs: { category: 'MASS', baseFactor: 0.45359237, canonicalSymbol: 'kg' },
    pound: { category: 'MASS', baseFactor: 0.45359237, canonicalSymbol: 'kg' },
    pounds: { category: 'MASS', baseFactor: 0.45359237, canonicalSymbol: 'kg' },
    ton: { category: 'MASS', baseFactor: 907.18474, canonicalSymbol: 'kg' },
    short_ton: {
      category: 'MASS',
      baseFactor: 907.18474,
      canonicalSymbol: 'kg',
    },

    // ── Energy ──
    kwh: { category: 'ENERGY', baseFactor: 1.0, canonicalSymbol: 'kWh' },
    kilowatt_hour: {
      category: 'ENERGY',
      baseFactor: 1.0,
      canonicalSymbol: 'kWh',
    },
    mwh: { category: 'ENERGY', baseFactor: 1000.0, canonicalSymbol: 'kWh' },
    megawatt_hour: {
      category: 'ENERGY',
      baseFactor: 1000.0,
      canonicalSymbol: 'kWh',
    },
    gwh: { category: 'ENERGY', baseFactor: 1000000.0, canonicalSymbol: 'kWh' },
    gj: { category: 'ENERGY', baseFactor: 277.777778, canonicalSymbol: 'kWh' },
    gigajoule: {
      category: 'ENERGY',
      baseFactor: 277.777778,
      canonicalSymbol: 'kWh',
    },
    mj: { category: 'ENERGY', baseFactor: 0.277778, canonicalSymbol: 'kWh' },
    megajoule: {
      category: 'ENERGY',
      baseFactor: 0.277778,
      canonicalSymbol: 'kWh',
    },
    therm: { category: 'ENERGY', baseFactor: 29.3071, canonicalSymbol: 'kWh' },
    therms: { category: 'ENERGY', baseFactor: 29.3071, canonicalSymbol: 'kWh' },

    // ── Distance ──
    km: { category: 'DISTANCE', baseFactor: 1.0, canonicalSymbol: 'km' },
    kilometer: { category: 'DISTANCE', baseFactor: 1.0, canonicalSymbol: 'km' },
    kilometre: { category: 'DISTANCE', baseFactor: 1.0, canonicalSymbol: 'km' },
    mile: { category: 'DISTANCE', baseFactor: 1.609344, canonicalSymbol: 'km' },
    miles: {
      category: 'DISTANCE',
      baseFactor: 1.609344,
      canonicalSymbol: 'km',
    },
    m: { category: 'DISTANCE', baseFactor: 0.001, canonicalSymbol: 'km' },
    meter: { category: 'DISTANCE', baseFactor: 0.001, canonicalSymbol: 'km' },

    // ── Freight ──
    't-km': { category: 'FREIGHT', baseFactor: 1.0, canonicalSymbol: 't-km' },
    'tonne-km': {
      category: 'FREIGHT',
      baseFactor: 1.0,
      canonicalSymbol: 't-km',
    },
    'ton-miles': {
      category: 'FREIGHT',
      baseFactor: 1.459972,
      canonicalSymbol: 't-km',
    },
    'ton-mile': {
      category: 'FREIGHT',
      baseFactor: 1.459972,
      canonicalSymbol: 't-km',
    },
  };

  private cleanUnitKey(unit: string): string {
    return (unit || '')
      .toLowerCase()
      .trim()
      .replace(/[\s\-_]+/g, '_');
  }

  /**
   * Normalizes an activity amount from a raw input unit to a target physical unit
   * or standard category base unit.
   */
  normalizeUnit(
    amount: number,
    fromUnit: string,
    targetUnit?: string,
  ): UnitNormalizationResult {
    const rawAmount = Number(amount) || 0;
    const cleanFrom = this.cleanUnitKey(fromUnit);
    const fromInfo = this.unitMap[cleanFrom];

    if (!fromInfo) {
      // Unknown physical unit category (e.g. USD, EUR or custom)
      return {
        originalAmount: rawAmount,
        originalUnit: fromUnit,
        normalizedAmount: rawAmount,
        normalizedUnit: targetUnit || fromUnit,
        conversionFactor: 1.0,
        unitCategory: 'UNKNOWN',
        isCompatible: true,
      };
    }

    if (!targetUnit || !targetUnit.trim()) {
      // Convert to standard category base unit
      const normalizedAmount = Number(
        (rawAmount * fromInfo.baseFactor).toFixed(6),
      );
      return {
        originalAmount: rawAmount,
        originalUnit: fromUnit,
        normalizedAmount,
        normalizedUnit: fromInfo.canonicalSymbol,
        conversionFactor: fromInfo.baseFactor,
        unitCategory: fromInfo.category,
        isCompatible: true,
      };
    }

    const cleanTarget = this.cleanUnitKey(targetUnit);
    const targetInfo = this.unitMap[cleanTarget];

    if (!targetInfo) {
      // Target unit is not registered in physical conversion map
      return {
        originalAmount: rawAmount,
        originalUnit: fromUnit,
        normalizedAmount: rawAmount,
        normalizedUnit: targetUnit,
        conversionFactor: 1.0,
        unitCategory: fromInfo.category,
        isCompatible: true,
      };
    }

    // Verify physical category compatibility
    if (fromInfo.category !== targetInfo.category) {
      throw new BadRequestException(
        `Incompatible physical unit conversion: Cannot convert ${fromUnit} (${fromInfo.category}) to ${targetUnit} (${targetInfo.category}). Cross-category conversion requires fuel-specific calorific/density mapping.`,
      );
    }

    // Convert from -> base -> target
    const conversionFactor = fromInfo.baseFactor / targetInfo.baseFactor;
    const normalizedAmount = Number((rawAmount * conversionFactor).toFixed(6));

    return {
      originalAmount: rawAmount,
      originalUnit: fromUnit,
      normalizedAmount,
      normalizedUnit: targetUnit,
      conversionFactor,
      unitCategory: fromInfo.category,
      isCompatible: true,
    };
  }
}
