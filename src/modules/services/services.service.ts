import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { AssignServicesDto, CreateScopeItemDto, CreateServiceDto } from 'src/dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(OrganizationService)
    private readonly orgServiceRepo: Repository<OrganizationService>,
    @InjectRepository(ServiceScopeItem)
    private readonly scopeItemRepo: Repository<ServiceScopeItem>,
  ) {}

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

  async getServiceScopes(serviceCode: string): Promise<ServiceScopeItem[]> {
    const codeUpper = (serviceCode || 'CARBON').toUpperCase();
    return this.scopeItemRepo.find({
      where: { serviceCode: codeUpper, isActive: true },
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
}
