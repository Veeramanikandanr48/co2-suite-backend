import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GwpSet } from 'src/entities/gwp-set.entity';
import { GwpValue } from 'src/entities/gwp-value.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { UnitConversion } from 'src/entities/unit-conversion.entity';
import {
  CreateEmissionFactorDto,
  CreateGwpSetDto,
  CreateUnitConversionDto,
} from 'src/dto/ghg.dto';
import { MethodologyStatus } from 'src/enums/ghg.enum';

@Injectable()
export class MethodologyService {
  constructor(
    @InjectRepository(GwpSet)
    private readonly gwpSetRepo: Repository<GwpSet>,
    @InjectRepository(GwpValue)
    private readonly gwpValueRepo: Repository<GwpValue>,
    @InjectRepository(EmissionFactor)
    private readonly emissionFactorRepo: Repository<EmissionFactor>,
    @InjectRepository(UnitConversion)
    private readonly unitConversionRepo: Repository<UnitConversion>,
  ) {}

  // ─── GWP SETS ──────────────────────────────────────────────────────────────

  async getGwpSets(): Promise<GwpSet[]> {
    return this.gwpSetRepo.find({
      where: { isActive: true },
      relations: { values: true },
      order: { id: 'ASC' },
    });
  }

  async getCurrentGwpSet(): Promise<GwpSet | null> {
    return this.gwpSetRepo.findOne({
      where: { isActive: true, isCurrent: true },
      relations: { values: true },
    });
  }

  /**
   * Gases as a map keyed by gasCode(+methaneOrigin) for calculation use.
   */
  async resolveGwpValues(gwpSetId?: number | null): Promise<{
    gwpSetId: number;
    assessment: string;
    values: Map<string, number>;
  }> {
    let set = gwpSetId
      ? await this.gwpSetRepo.findOne({
          where: { id: gwpSetId, isActive: true },
          relations: { values: true },
        })
      : null;
    if (!set) {
      set = await this.getCurrentGwpSet();
    }
    if (!set) {
      throw new BadRequestException(
        'No GWP set configured. Create a current GWP set in Master Data first.',
      );
    }

    const values = new Map<string, number>();
    for (const v of set.values ?? []) {
      const key = v.methaneOrigin
        ? `${v.gasCode}:${v.methaneOrigin}`
        : v.gasCode;
      values.set(key, v.value);
    }
    return { gwpSetId: set.id, assessment: set.assessment, values };
  }

  async upsertGwpSet(dto: CreateGwpSetDto, userId: number): Promise<GwpSet> {
    const { id, values, ...fields } = dto;

    let set: GwpSet;
    if (id) {
      const existing = await this.gwpSetRepo.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`GWP set with ID ${id} not found`);
      }
      Object.assign(existing, fields, { updatedBy: userId });
      set = await this.gwpSetRepo.save(existing);
    } else {
      set = await this.gwpSetRepo.save(
        this.gwpSetRepo.create({
          ...fields,
          isActive: true,
          createdBy: userId,
        }),
      );
    }

    if (Array.isArray(values)) {
      await this.gwpValueRepo.delete({ gwpSetId: set.id });
      if (values.length > 0) {
        await this.gwpValueRepo.save(
          values.map((v) =>
            this.gwpValueRepo.create({
              gwpSetId: set.id,
              gasCode: v.gasCode.toUpperCase(),
              gasName: v.gasName,
              chemicalFormula: v.chemicalFormula,
              value: v.value,
              methaneOrigin: v.methaneOrigin ?? null,
              createdBy: userId,
              isActive: true,
            }),
          ),
        );
      }
    }

    if (dto.isCurrent === true) {
      await this.gwpSetRepo.update(
        { isCurrent: true },
        { isCurrent: false, updatedBy: userId },
      );
      set.isCurrent = true;
      set = await this.gwpSetRepo.save(set);
    }
    return set;
  }

  async deleteGwpSet(id: number): Promise<void> {
    const set = await this.gwpSetRepo.findOne({ where: { id } });
    if (!set) throw new NotFoundException(`GWP set with ID ${id} not found`);
    set.isActive = false;
    await this.gwpSetRepo.save(set);
  }

  // ─── EMISSION FACTORS ──────────────────────────────────────────────────────

  private normalizeFactorDto(dto: CreateEmissionFactorDto) {
    return {
      fuelId: dto.fuelId ?? null,
      factorVersionId: dto.factorVersionId ?? null,
      unitBasisId: dto.unitBasisId ?? null,
      geography: (dto.geography || 'GLOBAL').toUpperCase(),
      reportingYear: dto.reportingYear ?? null,
      methodology: dto.methodology ? dto.methodology.trim() : null,
      methodologyStatus: dto.methodologyStatus ?? MethodologyStatus.CURRENT,
      factorValue: dto.factorValue,
      co2Value: dto.co2Value ?? null,
      ch4Value: dto.ch4Value ?? null,
      n2oValue: dto.n2oValue ?? null,
      hfcValue: dto.hfcValue ?? null,
      pfcValue: dto.pfcValue ?? null,
      sf6Value: dto.sf6Value ?? null,
      nf3Value: dto.nf3Value ?? null,
      biogenicCo2Value: dto.biogenicCo2Value ?? 0,
      isFossilMethane: dto.isFossilMethane ?? false,
      outputUnit: dto.outputUnit || 'kgCO2e',
      dataQuality: dto.dataQuality ?? null,
      sourceReference: dto.sourceReference ?? null,
      isDefaultFactor: dto.isDefaultFactor ?? false,
      description: dto.description ?? null,
    };
  }

  async getEmissionFactors(): Promise<EmissionFactor[]> {
    return this.emissionFactorRepo.find({
      where: { isActive: true },
      relations: { fuel: true, factorVersion: true, unitBasis: true },
      order: { id: 'ASC' },
    });
  }

  async upsertEmissionFactor(
    dto: CreateEmissionFactorDto,
    userId: number,
  ): Promise<EmissionFactor> {
    const data = this.normalizeFactorDto(dto);
    if (dto.id) {
      const existing = await this.emissionFactorRepo.findOne({
        where: { id: dto.id },
      });
      if (!existing) {
        throw new NotFoundException(
          `Emission factor with ID ${dto.id} not found`,
        );
      }
      Object.assign(existing, data, { updatedBy: userId });
      return this.emissionFactorRepo.save(existing);
    }
    return this.emissionFactorRepo.save(
      this.emissionFactorRepo.create({
        ...data,
        isActive: true,
        createdBy: userId,
      }),
    );
  }

  async deleteEmissionFactor(id: number): Promise<void> {
    const factor = await this.emissionFactorRepo.findOne({ where: { id } });
    if (!factor) {
      throw new NotFoundException(`Emission factor with ID ${id} not found`);
    }
    factor.isActive = false;
    await this.emissionFactorRepo.save(factor);
  }

  // ─── UNIT CONVERSIONS ──────────────────────────────────────────────────────

  async getUnitConversions(): Promise<UnitConversion[]> {
    return this.unitConversionRepo.find({
      where: { isActive: true },
      relations: { fromUnitRef: true, toUnitRef: true },
      order: { id: 'ASC' },
    });
  }

  async upsertUnitConversion(
    dto: CreateUnitConversionDto,
    userId: number,
  ): Promise<UnitConversion> {
    const { id, ...fields } = dto;
    if (id) {
      const existing = await this.unitConversionRepo.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Unit conversion with ID ${id} not found`);
      }
      Object.assign(existing, fields, { updatedBy: userId });
      return this.unitConversionRepo.save(existing);
    }
    return this.unitConversionRepo.save(
      this.unitConversionRepo.create({
        ...fields,
        isActive: true,
        createdBy: userId,
      }),
    );
  }

  async deleteUnitConversion(id: number): Promise<void> {
    const conversion = await this.unitConversionRepo.findOne({ where: { id } });
    if (!conversion) {
      throw new NotFoundException(`Unit conversion with ID ${id} not found`);
    }
    conversion.isActive = false;
    await this.unitConversionRepo.save(conversion);
  }
}
