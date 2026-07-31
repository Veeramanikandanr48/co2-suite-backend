import { ActivityResultDto, InputEfDto } from 'src/dto/calculation-result.dto';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { FormulaEngine } from './formula-engine';

export class ResultBuilder {
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

    return {
      based_option: basedOption,
      input_ef,
      comment: entry.comment || '',
      PK: pk,
      facility_name: entry.facility || 'Manchester Facility',
      facility_uuid: `4e1559a1-4bf2-4f41-abf6-eddc8b089ecd`,
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
