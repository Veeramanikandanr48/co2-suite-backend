import { MasterRoles, MasterModule } from 'src/entities/master.entity';
import { Permission } from 'src/entities/permission.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { UserDetails, UserAuthenticationDetails } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

/**
 * RBAC & Initial User Seed Script
 * Run via: npx ts-node -r tsconfig-paths/register src/database/seeds/rbac.seed.ts
 * Or: npm run seed
 *
 * Idempotent — checks for existing records before inserting.
 * Safe to run multiple times without duplicating data.
 */
export async function seedRbac(dataSource: DataSource): Promise<void> {
  const rolesRepo    = dataSource.getRepository(MasterRoles);
  const modulesRepo  = dataSource.getRepository(MasterModule);
  const permRepo     = dataSource.getRepository(Permission);
  const rolePermRepo = dataSource.getRepository(RolePermission);

  // ── 1. Seed master_roles ────────────────────────────────────────────────────
  const roles = [
    { roleKey: 'SUPER_ADMIN', roleName: 'Super Admin', roleShortName: 'SA', description: 'Full system access' },
    { roleKey: 'ADMIN',       roleName: 'Admin',       roleShortName: 'AD', description: 'Administrative access' },
    { roleKey: 'MEMBER',      roleName: 'Member',      roleShortName: 'MB', description: 'Standard user access' },
    { roleKey: 'VIEWER',      roleName: 'Viewer',      roleShortName: 'VW', description: 'Read-only access' },
  ];

  const savedRoles: Record<string, MasterRoles> = {};
  for (const role of roles) {
    let existing = await rolesRepo.findOne({ where: { roleKey: role.roleKey } });
    if (!existing) {
      existing = await rolesRepo.save(rolesRepo.create({ ...role, isActive: true }));
    }
    savedRoles[role.roleKey] = existing;
  }

  // ── 2. Seed master_modules ──────────────────────────────────────────────────
  const modules = [
    { moduleKey: 'dashboard',    moduleName: 'Dashboard'    },
    { moduleKey: 'users',        moduleName: 'Users'        },
    { moduleKey: 'roles',        moduleName: 'Roles'        },
    { moduleKey: 'permissions',  moduleName: 'Permissions'  },
    { moduleKey: 'reports',      moduleName: 'Reports'      },
    { moduleKey: 'settings',     moduleName: 'Settings'     },
    { moduleKey: 'audit',        moduleName: 'Audit Logs'   },
    { moduleKey: 'notifications',moduleName: 'Notifications'},
    { moduleKey: 'documents',    moduleName: 'Documents'    },
  ];

  const savedModules: Record<string, MasterModule> = {};
  for (const mod of modules) {
    let existing = await modulesRepo.findOne({ where: { moduleKey: mod.moduleKey } });
    if (!existing) {
      existing = await modulesRepo.save(modulesRepo.create({ ...mod, isActive: true }));
    }
    savedModules[mod.moduleKey] = existing;
  }

  // ── 3. Seed permissions ─────────────────────────────────────────────────────
  const rawPermDefs = [
    // Dashboard
    { moduleKey: 'dashboard',    resource: 'dashboard',   action: 'read',     scope: 'any' },
    // Users
    { moduleKey: 'users',        resource: 'profile',     action: 'read',     scope: 'any' },
    { moduleKey: 'users',        resource: 'profile',     action: 'read',     scope: 'own' },
    { moduleKey: 'users',        resource: 'profile',     action: 'create',   scope: 'any' },
    { moduleKey: 'users',        resource: 'profile',     action: 'update',   scope: 'any' },
    { moduleKey: 'users',        resource: 'profile',     action: 'update',   scope: 'own' },
    { moduleKey: 'users',        resource: 'profile',     action: 'delete',   scope: 'any' },
    // Roles
    { moduleKey: 'roles',        resource: 'roles',       action: 'read',     scope: 'any' },
    { moduleKey: 'roles',        resource: 'roles',       action: 'create',   scope: 'any' },
    { moduleKey: 'roles',        resource: 'roles',       action: 'update',   scope: 'any' },
    { moduleKey: 'roles',        resource: 'roles',       action: 'delete',   scope: 'any' },
    // Permissions
    { moduleKey: 'permissions',  resource: 'permissions', action: 'read',     scope: 'any' },
    { moduleKey: 'permissions',  resource: 'permissions', action: 'create',   scope: 'any' },
    { moduleKey: 'permissions',  resource: 'permissions', action: 'update',   scope: 'any' },
    { moduleKey: 'permissions',  resource: 'permissions', action: 'delete',   scope: 'any' },
    // Reports
    { moduleKey: 'reports',      resource: 'report',      action: 'read',     scope: 'any' },
    { moduleKey: 'reports',      resource: 'report',      action: 'download', scope: 'any' },
    // Settings
    { moduleKey: 'settings',     resource: 'settings',    action: 'read',     scope: 'any' },
    { moduleKey: 'settings',     resource: 'settings',    action: 'update',   scope: 'any' },
    // Audit
    { moduleKey: 'audit',        resource: 'logs',        action: 'read',     scope: 'any' },
    // Notifications
    { moduleKey: 'notifications',resource: 'notification', action: 'read',    scope: 'own' },
  ];

  interface SavedPermEntry {
    id: number;
    moduleKey: string;
    resource: string;
    action: string;
    scope: string;
  }

  const savedPerms: SavedPermEntry[] = [];
  for (const def of rawPermDefs) {
    const mod = savedModules[def.moduleKey];
    if (!mod) continue;

    const permissionKey = `${def.moduleKey}:${def.resource}:${def.action}:${def.scope}`;
    let perm = await permRepo.findOne({
      where: { moduleId: mod.id, resource: def.resource, action: def.action, scope: def.scope },
    });
    if (!perm) {
      perm = await permRepo.save(
        permRepo.create({
          permissionKey,
          moduleId: mod.id,
          resource: def.resource,
          action: def.action,
          scope: def.scope,
          isActive: true,
        }),
      );
    }
    savedPerms.push({
      id: perm.id,
      moduleKey: def.moduleKey,
      resource: def.resource,
      action: def.action,
      scope: def.scope,
    });
  }

  // ── 4. Seed role_permissions ────────────────────────────────────────────────

  const getPermId = (moduleKey: string, resource: string, action: string, scope: string): number | undefined =>
    savedPerms.find(
      (p) => p.moduleKey === moduleKey && p.resource === resource && p.action === action && p.scope === scope,
    )?.id;

  const assign = async (roleKey: string, permIds: (number | undefined)[]) => {
    const role = savedRoles[roleKey];
    if (!role) return;
    for (const permId of permIds) {
      if (!permId) continue;
      const exists = await rolePermRepo.findOne({ where: { roleId: role.id, permissionId: permId } });
      if (!exists) {
        await rolePermRepo.save(rolePermRepo.create({ roleId: role.id, permissionId: permId, isActive: true }));
      }
    }
  };

  // SUPER_ADMIN — all permissions
  await assign('SUPER_ADMIN', savedPerms.map((p) => p.id));

  // ADMIN — operational permissions
  await assign('ADMIN', [
    getPermId('dashboard',    'dashboard',   'read',     'any'),
    getPermId('users',        'profile',     'read',     'any'),
    getPermId('users',        'profile',     'create',   'any'),
    getPermId('users',        'profile',     'update',   'any'),
    getPermId('roles',        'roles',       'read',     'any'),
    getPermId('permissions',  'permissions', 'read',     'any'),
    getPermId('reports',      'report',      'read',     'any'),
    getPermId('reports',      'report',      'download', 'any'),
    getPermId('settings',     'settings',    'read',     'any'),
    getPermId('notifications','notification','read',     'own'),
  ]);

  // MEMBER — own profile + dashboard + own notifications
  await assign('MEMBER', [
    getPermId('dashboard',    'dashboard',   'read',  'any'),
    getPermId('users',        'profile',     'read',  'own'),
    getPermId('users',        'profile',     'update','own'),
    getPermId('notifications','notification','read',  'own'),
  ]);

  // VIEWER — read-only dashboard + own profile read
  await assign('VIEWER', [
    getPermId('dashboard', 'dashboard', 'read', 'any'),
    getPermId('users',     'profile',  'read', 'own'),
  ]);

  // ── 5. Seed Super Admin User ────────────────────────────────────────────────
  const userRepo     = dataSource.getRepository(UserDetails);
  const userAuthRepo = dataSource.getRepository(UserAuthenticationDetails);
  const userRoleRepo = dataSource.getRepository(UserRole);

  const superAdminEmail = 'superadmin@co2suite.com';
  let superAdminUser = await userRepo.findOne({ where: { email: superAdminEmail } });

  if (!superAdminUser) {
    const hashedPassword = await bcrypt.hash('SuperAdmin@12345', 10);
    superAdminUser = await userRepo.save(
      userRepo.create({
        email: superAdminEmail,
        userName: 'superadmin',
        password: hashedPassword,
        isActive: true,
        isVerified: true,
        isTwoFactorAuthenticationEnabled: false,
      }),
    );
    console.log(`👤 Super Admin user created: ${superAdminEmail}`);
  } else {
    const hashedPassword = await bcrypt.hash('SuperAdmin@12345', 10);
    await userRepo.update(superAdminUser.id, {
      password: hashedPassword,
      isActive: true,
      isVerified: true,
    });
    console.log(`👤 Super Admin user updated: ${superAdminEmail}`);
  }

  // Ensure UserAuthenticationDetails record exists
  let superAdminAuth = await userAuthRepo.findOne({
    where: { userId: superAdminUser.id, masterLoginTypeId: 1 },
  });
  if (!superAdminAuth) {
    await userAuthRepo.save(
      userAuthRepo.create({
        userId: superAdminUser.id,
        masterLoginTypeId: 1,
        attemptedCount: 0,
        isBlocked: false,
      }),
    );
  } else if (superAdminAuth.isBlocked) {
    await userAuthRepo.update(superAdminAuth.id, {
      isBlocked: false,
      attemptedCount: 0,
      blockedTime: null,
    });
  }

  // Assign SUPER_ADMIN role if not already assigned
  const superAdminRole = savedRoles['SUPER_ADMIN'];
  if (superAdminRole) {
    let superAdminUserRole = await userRoleRepo.findOne({
      where: { userId: superAdminUser.id, roleId: superAdminRole.id },
    });
    if (!superAdminUserRole) {
      await userRoleRepo.save(
        userRoleRepo.create({
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
          isPrimary: true,
          isActive: true,
        }),
      );
    }
  }

  console.log('✅ RBAC & Super Admin seed completed successfully');
}
