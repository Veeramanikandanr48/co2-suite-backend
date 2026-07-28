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
    return await this.masterRolesRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async getMasterApprovalStatuses() {
    return await this.masterApprovalStatusRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }
}
