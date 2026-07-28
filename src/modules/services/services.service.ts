import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { AssignServicesDto, CreateScopeItemDto, CreateServiceDto } from 'src/dto/service.dto';
import { CreateEmissionFactorDto, CreateInventoryEntryDto } from 'src/dto/inventory.dto';
import {
  SEED_SERVICES,
  SEED_SCOPE_ITEMS,
  SEED_EMISSION_FACTORS,
  SEED_INVENTORY_ENTRIES,
} from 'src/seeds/initial-data.seed';

@Injectable()
export class ServicesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(OrganizationService)
    private readonly orgServiceRepo: Repository<OrganizationService>,
    @InjectRepository(ServiceScopeItem)
    private readonly scopeItemRepo: Repository<ServiceScopeItem>,
    @InjectRepository(EmissionFactor)
    private readonly efRepo: Repository<EmissionFactor>,
    @InjectRepository(InventoryEntry)
    private readonly inventoryRepo: Repository<InventoryEntry>,
  ) {}

  /**
   * Seeds initial DB tables from separate seed file on application startup if empty.
   */
  async onApplicationBootstrap(): Promise<void> {
    const serviceCount = await this.serviceRepo.count();
    if (serviceCount === 0) {
      await this.serviceRepo.save(this.serviceRepo.create(SEED_SERVICES as Partial<Service>[]));
    }

    const scopeCount = await this.scopeItemRepo.count();
    if (scopeCount === 0) {
      await this.scopeItemRepo.save(this.scopeItemRepo.create(SEED_SCOPE_ITEMS as Partial<ServiceScopeItem>[]));
    }

    const efCount = await this.efRepo.count();
    if (efCount === 0) {
      await this.efRepo.save(this.efRepo.create(SEED_EMISSION_FACTORS as Partial<EmissionFactor>[]));
    }

    const invCount = await this.inventoryRepo.count();
    if (invCount === 0) {
      await this.inventoryRepo.save(this.inventoryRepo.create(SEED_INVENTORY_ENTRIES as Partial<InventoryEntry>[]));
    }
  }

  // --- SERVICE METHODS ---

  async createService(dto: CreateServiceDto): Promise<Service> {
    const codeUpper = dto.code.trim().toUpperCase();
    const existing = await this.serviceRepo.findOne({ where: { code: codeUpper } });
    if (existing) {
      throw new ConflictException(`Service with code "${codeUpper}" already exists`);
    }

    const entity = this.serviceRepo.create({
      ...dto,
      code: codeUpper,
      isActive: true,
    });
    return this.serviceRepo.save(entity);
  }

  async getAllServices(): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async getOrgServices(orgId: number): Promise<OrganizationService[]> {
    return this.orgServiceRepo.find({
      where: { organizationId: orgId, isActive: true },
      relations: { service: true },
      order: { id: 'ASC' },
    });
  }

  async assignServices(
    orgId: number,
    dto: AssignServicesDto,
    subscribedBy: number,
  ): Promise<OrganizationService[]> {
    const results: OrganizationService[] = [];

    for (const serviceId of dto.serviceIds) {
      const service = await this.serviceRepo.findOne({ where: { id: serviceId, isActive: true } });
      if (!service) {
        throw new BadRequestException(`Service with ID ${serviceId} not found`);
      }

      const existing = await this.orgServiceRepo.findOne({
        where: { organizationId: orgId, serviceId },
      });

      if (existing) {
        if (existing.isActive) {
          throw new ConflictException(`Service "${service.name}" is already assigned to this organization`);
        }
        existing.isActive = true;
        existing.subscribedBy = subscribedBy;
        results.push(await this.orgServiceRepo.save(existing));
      } else {
        const entity = this.orgServiceRepo.create({
          organizationId: orgId,
          serviceId,
          subscribedBy,
          isActive: true,
        });
        results.push(await this.orgServiceRepo.save(entity));
      }
    }

    return results;
  }

  async removeOrgService(orgId: number, serviceId: number): Promise<{ message: string }> {
    const existing = await this.orgServiceRepo.findOne({
      where: { organizationId: orgId, serviceId, isActive: true },
    });
    if (!existing) {
      throw new BadRequestException('This service subscription does not exist');
    }
    existing.isActive = false;
    await this.orgServiceRepo.save(existing);
    return { message: 'Service removed from organization successfully' };
  }

  // --- SERVICE SCOPE ITEMS METHODS ---

  async createScopeItem(dto: CreateScopeItemDto): Promise<ServiceScopeItem> {
    const serviceCode = dto.serviceCode.trim().toUpperCase();
    const itemCode = dto.code.trim().toUpperCase();

    const existing = await this.scopeItemRepo.findOne({
      where: { serviceCode, code: itemCode, isActive: true },
    });

    if (existing) {
      throw new ConflictException(`Scope item with code "${itemCode}" already exists for service "${serviceCode}"`);
    }

    const entity = this.scopeItemRepo.create({
      ...dto,
      serviceCode,
      code: itemCode,
      scopeCode: dto.scopeCode.trim().toUpperCase(),
      sortOrder: dto.sortOrder ?? 0,
      isActive: true,
    });
    return this.scopeItemRepo.save(entity);
  }

  async getServiceScopes(serviceCode?: string): Promise<ServiceScopeItem[]> {
    const codeUpper = serviceCode ? serviceCode.trim().toUpperCase() : undefined;
    const where: any = { isActive: true };
    if (codeUpper) {
      where.serviceCode = codeUpper;
    }

    return this.scopeItemRepo.find({
      where,
      order: { scopeCode: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async deleteScopeItem(id: number): Promise<{ message: string }> {
    const existing = await this.scopeItemRepo.findOne({ where: { id, isActive: true } });
    if (!existing) {
      throw new BadRequestException(`Service scope item with ID ${id} not found`);
    }
    existing.isActive = false;
    await this.scopeItemRepo.save(existing);
    return { message: 'Service scope item deleted successfully' };
  }

  // --- EMISSION FACTORS METHODS ---

  async getEmissionFactors(category?: string): Promise<EmissionFactor[]> {
    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    return this.efRepo.find({
      where,
      order: { category: 'ASC', source: 'ASC', fuelOrGasType: 'ASC' },
    });
  }

  async createEmissionFactor(dto: CreateEmissionFactorDto): Promise<EmissionFactor> {
    const entity = this.efRepo.create({
      ...dto,
      isActive: true,
    });
    return this.efRepo.save(entity);
  }

  // --- INVENTORY ENTRIES METHODS ---

  async getInventoryEntries(orgId: number, category?: string): Promise<InventoryEntry[]> {
    const where: any = { organizationId: orgId };
    if (category) {
      where.category = category;
    }
    return this.inventoryRepo.find({
      where,
      order: { id: 'DESC' },
    });
  }

  async createInventoryEntry(
    orgId: number,
    userId: number,
    dto: CreateInventoryEntryDto,
  ): Promise<InventoryEntry> {
    let efVal = dto.ef;
    if (efVal === undefined || efVal === null) {
      const efRecord = await this.efRepo.findOne({
        where: { category: dto.category, fuelOrGasType: dto.name, isActive: true },
      });
      efVal = efRecord?.factor ?? 0;
    }

    const amountVal = Number(dto.amount) || 0;
    const unitLower = (dto.unit || '').toLowerCase();

    let calculatedEmission = 0;
    if (unitLower === 'tonne' || unitLower === 'ton') {
      // If EF is in kg/tonne (e.g. > 1.0), divide by 1000 to convert to metric tonnes CO2-e
      if (efVal > 1.0) {
        calculatedEmission = Number(((amountVal * efVal) / 1000).toFixed(3));
      } else {
        // If EF is already in t CO2-e / tonne (e.g. <= 1.0)
        calculatedEmission = Number((amountVal * efVal).toFixed(3));
      }
    } else {
      // Standard kg, kWh, L, sm3, km, ton.km: (amount * factor) / 1000
      calculatedEmission = Number(((amountVal * efVal) / 1000).toFixed(3));
    }

    const entity = this.inventoryRepo.create({
      ...dto,
      organizationId: orgId,
      createdBy: userId,
      ef: efVal,
      emission: calculatedEmission,
      status: dto.status || 'completed',
    });

    return this.inventoryRepo.save(entity);
  }

  async deleteInventoryEntry(orgId: number, id: number): Promise<{ message: string }> {
    const existing = await this.inventoryRepo.findOne({ where: { id, organizationId: orgId } });
    if (!existing) {
      throw new BadRequestException(`Inventory entry with ID ${id} not found`);
    }
    await this.inventoryRepo.remove(existing);
    return { message: 'Inventory entry deleted successfully' };
  }
}
