import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from 'src/entities/permission.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { MasterModule } from 'src/entities/master.entity';
import { PermissionCacheService } from 'src/casl-permission/permission-cache.service';
import { CaslAbilityFactory } from 'src/casl-permission/casl-ability-factory/casl-ability.factory';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import {
  AssignPermissionsDto,
  CheckPermissionDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rolePermRepo: Repository<RolePermission>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,

    @InjectRepository(MasterModule)
    private readonly moduleRepo: Repository<MasterModule>,

    private readonly permissionCache: PermissionCacheService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permRepo.find({
      where: { isActive: true },
      relations: { module: true },
    });
  }

  async findOne(id: number): Promise<Permission> {
    const perm = await this.permRepo.findOne({
      where: { id, isActive: true },
      relations: { module: true },
    });
    if (!perm) throw new NotFoundException(`Permission #${id} not found`);
    return perm;
  }

  async findByRole(roleId: number): Promise<Permission[]> {
    return this.permRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.module', 'mm')
      .innerJoin(RolePermission, 'rp', 'rp.permissionId = p.id AND rp.isActive = true')
      .where('rp.roleId = :roleId AND p.isActive = true', { roleId })
      .getMany();
  }

  async create(dto: CreatePermissionDto, changedBy: number): Promise<Permission> {
    const existing = await this.permRepo.findOne({
      where: {
        moduleId: dto.moduleId,
        resource: dto.resource,
        action: dto.action,
        scope: dto.scope ?? 'any',
      },
    });
    if (existing) {
      throw new ConflictException(
        `Permission for moduleId=${dto.moduleId} resource='${dto.resource}' action='${dto.action}' scope='${dto.scope}' already exists`,
      );
    }

    const moduleRecord = await this.moduleRepo.findOne({ where: { id: dto.moduleId } });
    if (!moduleRecord) {
      throw new NotFoundException(`Module #${dto.moduleId} not found`);
    }

    const scope = dto.scope ?? 'any';
    const permissionKey = `${moduleRecord.moduleKey}:${dto.resource}:${dto.action}:${scope}`;

    const perm = this.permRepo.create({
      ...dto,
      permissionKey,
      scope,
      isActive: true,
    });
    const saved = await this.permRepo.save(perm);
    await this.writeAudit('permission', saved.id, 'created', null, saved, changedBy);
    return saved;
  }

  async update(id: number, dto: UpdatePermissionDto, changedBy: number): Promise<Permission> {
    const perm = await this.findOne(id);
    const before = { ...perm };
    Object.assign(perm, dto);
    const saved = await this.permRepo.save(perm);
    await this.writeAudit('permission', id, 'updated', before, saved, changedBy);
    return saved;
  }

  async remove(id: number, changedBy: number): Promise<void> {
    const perm = await this.findOne(id);
    await this.permRepo.update(id, { isActive: false });
    await this.writeAudit('permission', id, 'deleted', perm, null, changedBy);
  }

  /**
   * Bulk-assigns permissions to a role (replaces existing).
   * Invalidates the cache so the next request picks up new permissions immediately.
   */
  async assignToRole(
    roleId: number,
    dto: AssignPermissionsDto,
    changedBy: number,
  ): Promise<void> {
    const existing = await this.rolePermRepo.find({ where: { roleId, isActive: true } });
    await this.rolePermRepo.update({ roleId, isActive: true }, { isActive: false });

    const newAssignments = dto.permissionIds.map((permissionId) =>
      this.rolePermRepo.create({ roleId, permissionId, isActive: true }),
    );
    const saved = await this.rolePermRepo.save(newAssignments);

    // Cache invalidation — critical after any permission change
    await this.permissionCache.invalidate(roleId);

    await this.writeAudit('role_permission', roleId, 'assigned', existing, saved, changedBy);
  }

  /**
   * Checks whether the calling user has a specific permission.
   * Used by POST /permissions/check for dynamic frontend gating
   * without re-fetching the full ability.
   */
  async check(user: IDecodeUserDetails, dto: CheckPermissionDto): Promise<boolean> {
    const ability = await this.caslAbilityFactory.createForUser(user);
    return ability.can(dto.action as never, dto.subject);
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
