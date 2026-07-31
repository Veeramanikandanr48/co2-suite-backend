import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from 'src/entities/facility.entity';
import { CreateFacilityDto, UpdateFacilityDto } from 'src/dto/facility.dto';
import { SEED_FACILITIES } from 'src/seeds/initial-data.seed';
import { MasterRole } from 'src/enums/casl.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@Injectable()
export class FacilitiesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.facilityRepo.count();
    if (count === 0) {
      await this.facilityRepo.save(
        this.facilityRepo.create(SEED_FACILITIES as Partial<Facility>[]),
      );
    }
  }

  private assertNotRegularUser(user: IDecodeUserDetails): void {
    if (user?.roleId === MasterRole.USER) {
      throw new ForbiddenException('Regular users cannot perform this action');
    }
  }

  private resolveTargetOrgId(
    user: IDecodeUserDetails,
    requestedOrgId?: number,
  ): number | undefined {
    if (user?.roleId === MasterRole.SUPER_ADMIN) {
      return requestedOrgId || user?.organizationId || 1;
    }
    return user?.organizationId || requestedOrgId || 1;
  }

  async createFacility(
    dto: CreateFacilityDto,
    user: IDecodeUserDetails,
  ): Promise<Facility> {
    this.assertNotRegularUser(user);
    const targetOrgId = this.resolveTargetOrgId(user, dto.organizationId);

    const entity = this.facilityRepo.create({
      ...dto,
      organizationId: targetOrgId,
      isActive: true,
      createdBy: user?.id,
    });
    return this.facilityRepo.save(entity);
  }

  async getAllFacilities(
    user: IDecodeUserDetails,
    orgId?: number,
  ): Promise<Facility[]> {
    const targetOrgId =
      user?.roleId === MasterRole.SUPER_ADMIN ? orgId : user?.organizationId;

    const query = this.facilityRepo
      .createQueryBuilder('facility')
      .select([
        'facility.id',
        'facility.organizationId',
        'facility.name',
        'facility.latitude',
        'facility.longitude',
        'facility.address',
        'facility.unLocode',
        'facility.postCode',
        'facility.countryCode',
        'facility.isActive',
        'facility.createdAt',
        'facility.updatedAt',
      ])
      .where('facility.isActive = :isActive', { isActive: true });

    if (targetOrgId) {
      query.andWhere('facility.organizationId = :orgId', {
        orgId: targetOrgId,
      });
    }

    return query.orderBy('facility.id', 'ASC').getMany();
  }

  async getFacilityById(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<Facility> {
    const targetOrgId =
      user?.roleId === MasterRole.SUPER_ADMIN
        ? undefined
        : user?.organizationId;
    const query = this.facilityRepo
      .createQueryBuilder('facility')
      .select([
        'facility.id',
        'facility.organizationId',
        'facility.name',
        'facility.latitude',
        'facility.longitude',
        'facility.address',
        'facility.unLocode',
        'facility.postCode',
        'facility.countryCode',
        'facility.isActive',
        'facility.createdAt',
        'facility.updatedAt',
      ])
      .where('facility.id = :id', { id })
      .andWhere('facility.isActive = :isActive', { isActive: true });

    if (targetOrgId) {
      query.andWhere('facility.organizationId = :orgId', { orgId: targetOrgId });
    }

    const facility = await query.getOne();
    if (!facility) {
      throw new BadRequestException('Facility not found');
    }
    return facility;
  }

  async updateFacility(
    id: number,
    dto: UpdateFacilityDto,
    user: IDecodeUserDetails,
  ): Promise<Facility> {
    this.assertNotRegularUser(user);
    const targetOrgId =
      user?.roleId === MasterRole.SUPER_ADMIN
        ? undefined
        : user?.organizationId;
    const facility = await this.getFacilityById(id, user);
    Object.assign(facility, dto, { updatedBy: user?.id });
    return this.facilityRepo.save(facility);
  }

  async deactivateFacility(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<{ message: string }> {
    this.assertNotRegularUser(user);
    const targetOrgId =
      user?.roleId === MasterRole.SUPER_ADMIN
        ? undefined
        : user?.organizationId;
    const facility = await this.getFacilityById(id, user);
    facility.isActive = false;
    await this.facilityRepo.save(facility);
    return { message: 'Facility deactivated successfully' };
  }
}
