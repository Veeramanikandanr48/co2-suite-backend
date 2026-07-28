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
import { AssignServicesDto } from 'src/dto/service.dto';

const MASTER_SERVICES: Omit<Service, 'id' | 'createdOn' | 'updatedOn' | 'organization' | 'service'>[] = [
  {
    code: 'CARBON',
    name: 'CageSuite Carbon',
    description: 'Corporate Carbon Management and Reporting Module',
    category: 'Carbon',
    tags: ['Carbon'],
    demoUrl: '#',
    isActive: true,
  },
  {
    code: 'CBAM',
    name: 'CageSuite CBAM',
    description: 'EU Carbon Border Adjustment Mechanism Module',
    category: 'CBAM',
    tags: ['CBAM'],
    demoUrl: '#',
    isActive: true,
  },
  {
    code: 'PEF_TEXTILES',
    name: 'CageSuite PEF',
    description: 'EU Product Environmental Footprint Module for Textiles & Apparels',
    category: 'PEF',
    tags: ['PEF', 'Textiles & Apparels'],
    demoUrl: '#',
    isActive: true,
  },
  {
    code: 'LCA_PLASTICS',
    name: 'CageSuite LCA',
    description: 'Product Life Cycle Assessment for Plastic Manufacturing',
    category: 'LCA',
    tags: ['LCA', 'Plastics'],
    demoUrl: '#',
    isActive: true,
  },
  {
    code: 'LCA_METALS',
    name: 'CageSuite LCA',
    description: 'Product Life Cycle Assessment for Metal Manufacturing',
    category: 'LCA',
    tags: ['LCA', 'Metals'],
    demoUrl: '#',
    isActive: true,
  },
  {
    code: 'ESG',
    name: 'CageSuite ESG',
    description: 'Corporate Sustainability Management and Reporting Module',
    category: 'ESG',
    tags: ['ESG'],
    demoUrl: '#',
    isActive: true,
  },
  {
    code: 'EPD_CABLES',
    name: 'CageSuite EPD',
    description: 'Environmental Product Declarations Module for Cable Industry',
    category: 'EPD',
    tags: ['EPD', 'Cables'],
    demoUrl: '#',
    isActive: true,
  },
];

@Injectable()
export class ServicesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(OrganizationService)
    private readonly orgServiceRepo: Repository<OrganizationService>,
  ) {}

  /**
   * Seeds master services on first startup if not already present.
   */
  async onApplicationBootstrap(): Promise<void> {
    const count = await this.serviceRepo.count();
    if (count > 0) return;

    const entities = this.serviceRepo.create(MASTER_SERVICES as Partial<Service>[]);
    await this.serviceRepo.save(entities);
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
        // Re-activate a previously removed subscription
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
}
