import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from 'src/entities/role-permission.entity';
import { Permission } from 'src/entities/permission.entity';
import { UserSession } from 'src/entities/user-session.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { MasterModule } from 'src/entities/master.entity';
import { IUserPermissions } from 'src/utility/base-interface.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,

    @InjectRepository(UserSession)
    private readonly userSessionRepo: Repository<UserSession>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  /**
   * Fetches all active permissions for a role, joining master_modules to
   * resolve moduleId → moduleKey for building the CASL subject string.
   *
   * Subject format: '<moduleKey>:<resource>' (e.g. 'users:profile')
   * This is the single source of truth consumed by CaslAbilityFactory.
   */
  async getAllUserPermission(roleId: number): Promise<IUserPermissions[]> {
    const rows = await this.rolePermissionRepo
      .createQueryBuilder('rp')
      .innerJoin(Permission, 'p', 'p.id = rp.permissionId AND p.isActive = true')
      .innerJoin(MasterModule, 'mm', 'mm.id = p.moduleId AND mm.isActive = true')
      .select([
        'p.action    AS action',
        'p.resource  AS resource',
        'mm.moduleKey AS moduleKey',
        'p.scope     AS scope',
      ])
      .where('rp.roleId = :roleId AND rp.isActive = true', { roleId })
      .getRawMany<{ action: string; resource: string; moduleKey: string; scope: string }>();

    return rows.map((row) => ({
      action: row.action as IUserPermissions['action'],
      // CASL subject = 'moduleKey:resource' enables per-module checks
      subject: `${row.moduleKey}:${row.resource}`,
      ...(row.scope === 'own' && { conditions: { scope: 'own' } }),
    }));
  }

  /**
   * Returns all active roles for a user, ordered so isPrimary is first.
   * Used during login to build the JWT roleIds/currentRoleId/roleKey fields.
   */
  async getUserRoles(
    userId: number,
  ): Promise<Array<{ roleId: number; roleKey: string; roleName: string; isPrimary: boolean }>> {
    return this.userRoleRepo
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'r')
      .select([
        'ur.roleId    AS "roleId"',
        'r.roleKey    AS "roleKey"',
        'r.roleName   AS "roleName"',
        'ur.isPrimary AS "isPrimary"',
      ])
      .where('ur.userId = :userId AND ur.isActive = true', { userId })
      .orderBy('ur.isPrimary', 'DESC')
      .getRawMany();
  }

  // ─── Refresh Token / Session ────────────────────────────────────────────────

  async saveSession(
    userId: number,
    refreshToken: string,
    expiresAt: Date,
    createdByIp?: string,
    userAgent?: string,
    deviceName?: string,
  ): Promise<UserSession> {
    const session = this.userSessionRepo.create({
      userId,
      refreshToken,
      expiresAt,
      createdByIp,
      lastUsedIp: createdByIp,
      userAgent,
      deviceName: deviceName ?? this.parseDeviceName(userAgent),
      lastUsedAt: new Date(),
      isRevoked: false,
    });
    return this.userSessionRepo.save(session);
  }

  async findValidSession(refreshToken: string): Promise<UserSession | null> {
    return this.userSessionRepo.findOne({
      where: { refreshToken, isRevoked: false },
    });
  }

  async touchSession(id: number, lastUsedIp?: string): Promise<void> {
    await this.userSessionRepo.update(id, {
      lastUsedAt: new Date(),
      ...(lastUsedIp ? { lastUsedIp } : {}),
    });
  }

  async revokeSession(
    refreshToken: string,
    reason: 'logout' | 'rotation' | 'admin' | 'expired' = 'logout',
  ): Promise<void> {
    await this.userSessionRepo.update(
      { refreshToken },
      { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    );
  }

  async revokeSessionById(
    id: number,
    reason: 'logout' | 'rotation' | 'admin' | 'expired' = 'admin',
  ): Promise<void> {
    await this.userSessionRepo.update(
      { id },
      { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
    );
  }

  async revokeAllUserSessions(userId: number): Promise<void> {
    await this.userSessionRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout' },
    );
  }

  async getUserSessions(userId: number): Promise<UserSession[]> {
    return this.userSessionRepo.find({
      where: { userId, isRevoked: false },
      order: { lastUsedAt: 'DESC' },
    });
  }

  /** Minimal device label derived from user agent string. */
  private parseDeviceName(userAgent?: string): string {
    if (!userAgent) return 'Unknown Device';
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    if (/windows/i.test(userAgent)) return 'Windows PC';
    if (/macintosh|mac os/i.test(userAgent)) return 'Mac';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Browser';
  }
}
