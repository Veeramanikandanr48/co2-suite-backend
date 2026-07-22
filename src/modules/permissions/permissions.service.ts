import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Permission } from 'src/entities/permission.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { MasterModule, MasterRoles } from 'src/entities/master.entity';
import { PermissionCacheService } from 'src/casl-permission/permission-cache.service';
import { CaslAbilityFactory } from 'src/casl-permission/casl-ability-factory/casl-ability.factory';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import {
  AssignPermissionsDto,
  CheckPermissionDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto/permission.dto';

export interface EffectivePermission {
  key: string;
  module: string;
  resource: string;
  action: string;
  scope: string;
}

export interface EffectivePermissionsResponse {
  role: { id: number; key: string; name: string };
  permissions: EffectivePermission[];
}

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

    @InjectRepository(MasterRoles)
    private readonly rolesRepo: Repository<MasterRoles>,

    private readonly permissionCache: PermissionCacheService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly dataSource: DataSource,
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
    await this.writeAudit('rbac.permission.created', saved.id, null, saved, changedBy);
    return saved;
  }

  async update(id: number, dto: UpdatePermissionDto, changedBy: number): Promise<Permission> {
    const perm = await this.findOne(id);
    const before = { ...perm };
    Object.assign(perm, dto);
    const saved = await this.permRepo.save(perm);
    await this.writeAudit('rbac.permission.updated', id, before, saved, changedBy);
    return saved;
  }

  async remove(id: number, changedBy: number): Promise<void> {
    const perm = await this.findOne(id);
    await this.permRepo.update(id, { isActive: false });
    await this.writeAudit('rbac.permission.revoked', id, perm, null, changedBy);
  }

  /**
   * Bulk-assigns permissions to a role inside a single transaction:
   *   1. Soft-delete existing role_permissions
   *   2. Insert new role_permissions
   *   3. Increment master_roles.permissionsVersion  ← cache-busting
   *   4. Invalidate the in-memory permission cache for this role
   *
   * All four steps succeed or all roll back — no partial state possible.
   */
  async assignToRole(
    roleId: number,
    dto: AssignPermissionsDto,
    changedBy: number,
  ): Promise<void> {
    const role = await this.rolesRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role #${roleId} not found`);

    const existingBefore = await this.rolePermRepo.find({ where: { roleId, isActive: true } });

    await this.dataSource.transaction(async (manager) => {
      // Step 1: Soft-delete existing assignments
      await manager.update(RolePermission, { roleId, isActive: true }, { isActive: false });

      // Step 2: Insert new assignments
      const newAssignments = dto.permissionIds.map((permissionId) =>
        manager.create(RolePermission, { roleId, permissionId, isActive: true }),
      );
      await manager.save(RolePermission, newAssignments);

      // Step 3: Atomically bump permissionsVersion
      await manager.increment(MasterRoles, { id: roleId }, 'permissionsVersion', 1);
    });

    // Step 4: Invalidate cache AFTER the transaction commits
    await this.permissionCache.invalidate(roleId);

    await this.writeAudit(
      'rbac.permission.assigned',
      roleId,
      existingBefore,
      dto.permissionIds,
      changedBy,
    );
  }

  /**
   * Returns the effective permissions for the calling user in a structured
   * format suitable for admin UIs and debugging tooling.
   *
   * Response includes the role metadata and a rich permission list
   * (key, module, resource, action, scope) instead of a flat string array.
   */
  async getEffectivePermissions(user: IDecodeUserDetails): Promise<EffectivePermissionsResponse> {
    const roleId = user.currentRoleId ?? user.roleIds?.[0];

    const role = await this.rolesRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException(`Role #${roleId} not found`);

    const rows = await this.permRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.module', 'mm')
      .innerJoin(RolePermission, 'rp', 'rp.permissionId = p.id AND rp.isActive = true')
      .where('rp.roleId = :roleId AND p.isActive = true', { roleId })
      .getMany();

    const permissions: EffectivePermission[] = rows.map((p) => ({
      key: p.permissionKey ?? `${p.module?.moduleKey ?? ''}:${p.resource}:${p.action}:${p.scope}`,
      module: p.module?.moduleKey ?? '',
      resource: p.resource,
      action: p.action,
      scope: p.scope,
    }));

    return {
      role: { id: role.id, key: role.roleKey, name: role.roleName },
      permissions,
    };
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
    action: string,
    entityId: number,
    oldValue: unknown,
    newValue: unknown,
    changedBy: number,
  ): Promise<void> {
    await this.auditRepo.save({
      entityType: 'permission',
      entityId,
      action,
      changedBy,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
    });
  }
}
