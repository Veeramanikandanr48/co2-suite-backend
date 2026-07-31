import { Injectable } from '@nestjs/common';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import {
  ActivityResultDto,
  RichFactorSignatureDto,
} from 'src/dto/calculation-result.dto';
import { ResultBuilder } from './result-builder';
import { SignatureBuilder } from './signature-builder';

@Injectable()
export class CalculationEngine {
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
