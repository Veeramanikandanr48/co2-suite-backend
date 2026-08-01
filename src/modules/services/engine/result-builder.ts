import { createHash } from 'crypto';
import { ActivityResultDto, InputEfDto } from 'src/dto/calculation-result.dto';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { FormulaEngine } from './formula-engine';

export class ResultBuilder {
  /**
   * Builds a deterministic UUID from the org and facility so results stay
   * stable per facility without relying on a hardcoded value.
   */
  private static resolveFacilityUuid(orgId: number, facility: string): string {
    const hash = createHash('sha256')
      .update(`${orgId}:${facility}`)
      .digest('hex')
      .slice(0, 32);
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(
      13,
      16,
    )}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  }

  /**
   * Constructs exact 1:1 CageSuite result payload object
   */
  static buildActivityResult(
    entry: InventoryEntry,
    scopeId: string,
    activityCode: string,
    orgId: number,
    basedOption: 'activity' | 'spend' = 'activity',
  ): ActivityResultDto {
    const amount = Number(entry.amount || 0);
    const unitEf = Number(entry.ef || 1.0);

    const calculated = FormulaEngine.execute(
      activityCode,
      {
        activityCode,
        amount,
        unitEf,
        unit: entry.unit,
      },
      basedOption,
    );

    const input_ef: InputEfDto = {
      SF6: '0.0',
      total: String(calculated.unitFactor.total),
      HFC: '0.0',
      CO2: String(calculated.unitFactor.CO2),
      N2O: String(calculated.unitFactor.N2O),
      NF3: '0.0',
      PFC: '0.0',
      CH4: String(calculated.unitFactor.CH4),
    };

    const pk = `COMPANY#${orgId}`;
    const sk = `RESULT#${scopeId}#${activityCode}#${entry.id}`;

    const facilityName = entry.facility || `Facility ${orgId}`;

    return {
      based_option: basedOption,
      input_ef,
      comment: entry.comment || '',
      PK: pk,
      facility_name: facilityName,
      facility_uuid: ResultBuilder.resolveFacilityUuid(orgId, facilityName),
      from_date: entry.dateFrom || new Date().toISOString(),
      source: entry.efSource || 'IPCC',
      to_date: entry.dateTo || new Date().toISOString(),
      input: entry.name
        ? entry.name.toLowerCase().replace(/\s+/g, '_')
        : 'activity_input',
      status: entry.status || 'Draft',
      SK: sk,
      unit: entry.unit || 'kg',
      name: entry.name,
      creation_date: entry.createdAt
        ? entry.createdAt.toISOString()
        : new Date().toISOString(),
      isDefault: true,
      activity: activityCode.toUpperCase(),
      emissions: calculated.emissions,
      version: 'AR6',
      amount: String(entry.amount),
      scope: String(scopeId),
    };
  }
}
