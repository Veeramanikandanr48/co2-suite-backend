import { Injectable, Optional } from '@nestjs/common';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import {
  ActivityResultDto,
  RichFactorSignatureDto,
} from 'src/dto/calculation-result.dto';
import { ResultBuilder } from './result-builder';
import { SignatureBuilder } from './signature-builder';
import { EmissionFactorService } from '../../master/emission-factor.service';
import { ResolveEmissionFactorQueryDto } from 'src/dto/emission-factor.dto';

@Injectable()
export class CalculationEngine {
  constructor(
    @Optional()
    private readonly emissionFactorService?: EmissionFactorService,
  ) {}

  /**
   * Process inventory entries and build structured activity calculation results.
   */
  processResults(
    entries: InventoryEntry[],
    scopeId: string,
    activityCode: string,
    orgId: number,
    basedOption: 'activity' | 'spend' = 'activity',
  ): ActivityResultDto[] {
    return entries.map((entry) =>
      ResultBuilder.buildActivityResult(
        entry,
        scopeId,
        activityCode,
        orgId,
        basedOption,
      ),
    );
  }

  /**
   * Asynchronously process a single entry with optional query-driven EF and formula resolution.
   */
  async processEntry(
    entry: InventoryEntry,
    scopeId: string,
    activityCode: string,
    orgId: number,
    basedOption: 'activity' | 'spend' = 'activity',
    query?: ResolveEmissionFactorQueryDto,
  ): Promise<ActivityResultDto> {
    let resolvedEf: number | undefined;

    if (query && this.emissionFactorService) {
      try {
        const factorRecord = await this.emissionFactorService.resolveEmissionFactor(query);
        resolvedEf = factorRecord.factor;
      } catch {
        // Fall back to entry's stored EF if query resolution fails
      }
    }

    const effectiveEntry = resolvedEf !== undefined ? { ...entry, ef: resolvedEf } : entry;

    return ResultBuilder.buildActivityResult(
      effectiveEntry as InventoryEntry,
      scopeId,
      activityCode,
      orgId,
      basedOption,
    );
  }

  /**
   * Build metadata-driven factor signature rule for frontend forms.
   */
  getFactorSignature(
    scopeId: string,
    activityCode: string,
    basedOption: string = 'activity',
  ): RichFactorSignatureDto {
    return SignatureBuilder.buildFactorSignature(
      scopeId,
      activityCode,
      basedOption,
    );
  }
}
