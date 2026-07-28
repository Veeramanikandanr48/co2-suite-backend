import { BadRequestException, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from 'src/entities/facility.entity';
import { CreateFacilityDto, UpdateFacilityDto } from 'src/dto/facility.dto';
import { SEED_FACILITIES } from 'src/seeds/initial-data.seed';

@Injectable()
export class FacilitiesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
  ) {}

  /**
   * Seed default facilities from standalone seed file if empty on app startup.
   */
  async onApplicationBootstrap(): Promise<void> {
    const count = await this.facilityRepo.count();
    if (count === 0) {
      await this.facilityRepo.save(
        this.facilityRepo.create(SEED_FACILITIES as Partial<Facility>[]),
      );
    }
  }

  async createFacility(dto: CreateFacilityDto): Promise<Facility> {
    const entity = this.facilityRepo.create({
      ...dto,
      isActive: true,
    });
    return this.facilityRepo.save(entity);
  }

  async getAllFacilities(orgId?: number): Promise<Facility[]> {
    const where: any = { isActive: true };
    if (orgId) {
      where.organizationId = orgId;
    }
    return this.facilityRepo.find({
      where,
      order: { id: 'ASC' },
    });
  }

  async getFacilityById(id: number): Promise<Facility> {
    const facility = await this.facilityRepo.findOne({ where: { id, isActive: true } });
    if (!facility) {
      throw new BadRequestException(`Facility with ID ${id} not found`);
    }
    return facility;
  }

  async updateFacility(id: number, dto: UpdateFacilityDto): Promise<Facility> {
    const facility = await this.getFacilityById(id);
    Object.assign(facility, dto);
    return this.facilityRepo.save(facility);
  }

  async deleteFacility(id: number): Promise<{ message: string }> {
    const facility = await this.getFacilityById(id);
    facility.isActive = false;
    await this.facilityRepo.save(facility);
    return { message: 'Facility deleted successfully' };
  }
}
