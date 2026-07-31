import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MasterApprovalStatus, MasterRoles } from 'src/entities/master.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(MasterRoles)
    private readonly masterRolesRepository: Repository<MasterRoles>,
    @InjectRepository(MasterApprovalStatus)
    private readonly masterApprovalStatusRepository: Repository<MasterApprovalStatus>,
  ) {}

  async getMasterRoles() {
    return await this.masterRolesRepository
      .createQueryBuilder('role')
      .select([
        'role.id',
        'role.roleName',
        'role.roleShortName',
        'role.isActive',
        'role.createdAt',
      ])
      .where('role.isActive = :isActive', { isActive: true })
      .orderBy('role.id', 'ASC')
      .getMany();
  }

  async getMasterApprovalStatuses() {
    return await this.masterApprovalStatusRepository
      .createQueryBuilder('status')
      .select([
        'status.id',
        'status.name',
        'status.isActive',
        'status.createdAt',
      ])
      .where('status.isActive = :isActive', { isActive: true })
      .orderBy('status.id', 'ASC')
      .getMany();
  }
}
