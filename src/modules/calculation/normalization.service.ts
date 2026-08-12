import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitConversion } from 'src/entities/unit-conversion.entity';

export interface NormalizationResult {
  normalizedAmount: number;
  normalizedUnit: string;
  conversionUsed: string | null;
  trace: string;
}

@Injectable()
export class UnitNormalizationService {
  private cache: Map<string, number> | null = null;

  constructor(
    @InjectRepository(UnitConversion)
    private readonly conversionRepo: Repository<UnitConversion>,
  ) {}

  /**
   * Loads the conversion registry from DB. Conversions are explicit and sourced
   * (doc 22 §9.1 — no silent assumptions). Cache is invalidated on service
   * restart; conversions are versioned via BaseColumns timestamps.
   */
  private async getConversionMap(): Promise<Map<string, number>> {
    if (this.cache) return this.cache;
    const rows = await this.conversionRepo.find({ where: { isActive: true } });
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = `${row.fromUnit.toLowerCase()}:${row.toUnit.toLowerCase()}`;
      map.set(key, row.conversionFactor);
    }
    this.cache = map;
    return map;
  }

  async invalidateCache(): Promise<void> {
    this.cache = null;
  }

  /**
   * Normalizes an amount expressed in `fromUnit` into the factor's `unitBasis`.
   * - identical units => pass-through (conversionUsed null)
   * - direct registered conversion => applied
   * - otherwise throws with the documented reason (caller records FALLBACK audit event)
   */
  async normalize(
    amount: number,
    fromUnit: string | null | undefined,
    targetUnit: string,
  ): Promise<NormalizationResult> {
    const from = (fromUnit || '').trim().toLowerCase();
    const target = (targetUnit || '').trim().toLowerCase();

    const value = Number(amount) || 0;
    if (!target) {
      return {
        normalizedAmount: value,
        normalizedUnit: fromUnit || '',
        conversionUsed: null,
        trace: 'No target unit declared; amount passed through unchanged',
      };
    }
    if (!from || from === target) {
      return {
        normalizedAmount: value,
        normalizedUnit: fromUnit || targetUnit,
        conversionUsed: null,
        trace: `Amount already expressed in factor unit (${targetUnit})`,
      };
    }

    const map = await this.getConversionMap();
    const direct = map.get(`${from}:${target}`);
    if (direct !== undefined) {
      const normalized = value * direct;
      return {
        normalizedAmount: normalized,
        normalizedUnit: targetUnit,
        conversionUsed: `${fromUnit} → ${targetUnit} (×${direct})`,
        trace: `Conversion applied: ${value} ${fromUnit} × ${direct} = ${normalized} ${targetUnit}`,
      };
    }

    const inverse = map.get(`${target}:${from}`);
    if (inverse !== undefined && inverse !== 0) {
      const normalized = value / inverse;
      return {
        normalizedAmount: normalized,
        normalizedUnit: targetUnit,
        conversionUsed: `${fromUnit} → ${targetUnit} (÷${inverse})`,
        trace: `Inverse conversion applied: ${value} ${fromUnit} / ${inverse} = ${normalized} ${targetUnit}`,
      };
    }

    throw new UnsupportedConversionError(
      fromUnit || '',
      targetUnit,
      `Activity unit "${fromUnit}" is not registered as compatible with factor unit "${targetUnit}". Register a unit conversion in Master Data or select a compatible factor.`,
    );
  }
}

export class UnsupportedConversionError extends Error {
  constructor(
    public readonly fromUnit: string,
    public readonly toUnit: string,
    message: string,
  ) {
    super(message);
    this.name = 'UnsupportedConversionError';
  }
}
