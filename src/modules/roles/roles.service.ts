import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterRoles } from 'src/entities/master.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(MasterRoles)
    private readonly rolesRepo: Repository<MasterRoles>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async findAll(): Promise<any[]> {
    const roles = await this.rolesRepo.find({ where: { isActive: true } });
    return roles.map((r) => ({ ...r, roleId: r.id }));
  }

  async findOne(id: number): Promise<any> {
    const role = await this.rolesRepo.findOne({ where: { id, isActive: true } });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return { ...role, roleId: role.id };
  }

  async create(dto: CreateRoleDto, changedBy: number): Promise<MasterRoles> {
    const existing = await this.rolesRepo.findOne({ where: { roleKey: dto.roleKey } });
    if (existing) throw new ConflictException(`Role key '${dto.roleKey}' already exists`);

    const role = this.rolesRepo.create({ ...dto, isActive: true });
    const saved = await this.rolesRepo.save(role);

    await this.writeAudit('role', saved.id, 'created', null, saved, changedBy);
    return saved;
  }

  async update(id: number, dto: UpdateRoleDto, changedBy: number): Promise<MasterRoles> {
    const role = await this.findOne(id);
    const before = { ...role };

    Object.assign(role, dto);
    const saved = await this.rolesRepo.save(role);

    await this.writeAudit('role', id, 'updated', before, saved, changedBy);
    return saved;
  }

  async remove(id: number, changedBy: number): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepo.update(id, { isActive: false });
    await this.writeAudit('role', id, 'deleted', role, null, changedBy);
  }

  async assignRole(dto: AssignRoleDto, changedBy: number): Promise<UserRole> {
    const existing = await this.userRoleRepo.findOne({
      where: { userId: dto.userId, roleId: dto.roleId, isActive: true },
    });
    if (existing) throw new ConflictException('User already has this role');

    if (dto.isPrimary) {
      // Remove isPrimary from other roles for this user
      await this.userRoleRepo.update({ userId: dto.userId }, { isPrimary: false });
    }

    const userRole = this.userRoleRepo.create({
      userId: dto.userId,
      roleId: dto.roleId,
      isPrimary: dto.isPrimary ?? false,
      isActive: true,
    });
    const saved = await this.userRoleRepo.save(userRole);

    await this.writeAudit('user_role', saved.id, 'assigned', null, saved, changedBy);
    return saved;
  }

  async removeRole(userId: number, roleId: number, changedBy: number): Promise<void> {
    const userRole = await this.userRoleRepo.findOne({
      where: { userId, roleId, isActive: true },
    });
    if (!userRole) throw new NotFoundException('User role assignment not found');

    await this.userRoleRepo.update(userRole.id, { isActive: false });
    await this.writeAudit('user_role', userRole.id, 'revoked', userRole, null, changedBy);
  }

  async getUserRoles(userId: number): Promise<UserRole[]> {
    return this.userRoleRepo.find({
      where: { userId, isActive: true },
      relations: { role: true },
    });
  }

  async getRoleUsers(roleId: number): Promise<any[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { roleId, isActive: true },
      relations: { user: true },
    });

    return userRoles.map((ur) => {
      const u = ur.user;
      return {
        userId: u?.id || ur.userId,
        emailId: u?.email || '',
        userName: u?.userName || '',
        userRoleId: ur.id,
        isPrimary: ur.isPrimary,
      };
    });
  }

  private async writeAudit(
    entityType: string,
    entityId: number,
    action: string,
    oldValue: unknown,
    newValue: unknown,
    changedBy: number,
  ): Promise<void> {
    await this.auditRepo.save({
      entityType,
      entityId,
      action,
      changedBy,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
    });
  }
}
