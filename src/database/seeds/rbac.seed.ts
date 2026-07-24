import { MasterRoles, MasterModule } from 'src/entities/master.entity';
import { Permission } from 'src/entities/permission.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { UserDetails, UserAuthenticationDetails } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { SidebarItem } from 'src/entities/sidebar-item.entity';
import {
  SidebarBadgeTypeEnum,
  SidebarItemTypeEnum,
  SidebarVisibilityEnum,
} from 'src/enums/sidebar.enum';
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
  ];

  // Hard delete any legacy roles not in standard active list
  await rolesRepo.createQueryBuilder()
    .delete()
    .from(MasterRoles)
    .where('roleKey NOT IN (:...activeKeys)', { activeKeys: ['SUPER_ADMIN', 'ADMIN'] })
    .execute();

  const savedRoles: Record<string, MasterRoles> = {};
  for (const role of roles) {
    let existing = await rolesRepo.findOne({ where: { roleKey: role.roleKey } });
    if (!existing) {
      existing = await rolesRepo.save(rolesRepo.create({ ...role, isActive: true }));
    } else if (!existing.isActive) {
      await rolesRepo.update(existing.id, { isActive: true });
      existing.isActive = true;
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
    } else if (!existing.isActive) {
      await modulesRepo.update(existing.id, { isActive: true });
      existing.isActive = true;
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
    } else if (!perm.isActive) {
      await permRepo.update(perm.id, { isActive: true });
      perm.isActive = true;
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
      } else if (!exists.isActive) {
        await rolePermRepo.update(exists.id, { isActive: true });
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

  // ── 6. Seed Sidebar Menu Items ─────────────────────────────────────────────
  const sidebarRepo = dataSource.getRepository(SidebarItem);

  // Clear existing items for clean re-seeding of standard tree structure
  await sidebarRepo.createQueryBuilder().delete().from(SidebarItem).execute();

  // Main Header
  const headerMain = await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'header_main',
      title: 'MAIN',
      itemType: SidebarItemTypeEnum.HEADER,
      sortOrder: 1,
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'dashboard',
      title: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: headerMain.id,
      sortOrder: 2,
      permissionKey: 'dashboard:dashboard:read:any',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'ecosystem',
      title: 'Ecosystem',
      path: '/ecosystem',
      icon: 'Layers',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: headerMain.id,
      sortOrder: 3,
      badgeText: 'NEW',
      badgeType: SidebarBadgeTypeEnum.NEW,
      permissionKey: 'dashboard:dashboard:read:any',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  // Administration Header
  const headerAdmin = await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'header_admin',
      title: 'ADMINISTRATION',
      itemType: SidebarItemTypeEnum.HEADER,
      sortOrder: 10,
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'users',
      title: 'User Management',
      path: '/users',
      icon: 'Users',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: headerAdmin.id,
      sortOrder: 11,
      permissionKey: 'users:profile:read:any',
      activeMatch: '/users/*',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  const rolesGroup = await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'roles_group',
      title: 'Roles & Access',
      path: '/roles',
      icon: 'ShieldCheck',
      itemType: SidebarItemTypeEnum.GROUP,
      parentId: headerAdmin.id,
      sortOrder: 12,
      permissionKey: 'roles:roles:read:any',
      activeMatch: '/roles/*',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'roles_list',
      title: 'Roles List',
      path: '/roles',
      icon: 'ShieldCheck',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: rolesGroup.id,
      sortOrder: 1,
      permissionKey: 'roles:roles:read:any',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'permissions_list',
      title: 'Permissions List',
      path: '/permissions',
      icon: 'Lock',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: rolesGroup.id,
      sortOrder: 2,
      permissionKey: 'permissions:permissions:read:any',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  // Analytics & Reports Header
  const headerReports = await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'header_reports',
      title: 'ANALYTICS & REPORTS',
      itemType: SidebarItemTypeEnum.HEADER,
      sortOrder: 20,
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'reports',
      title: 'Reports',
      path: '/reports',
      icon: 'FileText',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: headerReports.id,
      sortOrder: 21,
      permissionKey: 'reports:report:read:any',
      badgeText: 'BETA',
      badgeType: SidebarBadgeTypeEnum.BETA,
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'audit',
      title: 'Audit Logs',
      path: '/audit-logs',
      icon: 'Activity',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: headerReports.id,
      sortOrder: 22,
      permissionKey: 'audit:logs:read:any',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  // System Header
  const headerSystem = await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'header_system',
      title: 'SYSTEM',
      itemType: SidebarItemTypeEnum.HEADER,
      sortOrder: 30,
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'notifications',
      title: 'Notifications',
      path: '/notifications',
      icon: 'Bell',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: headerSystem.id,
      sortOrder: 31,
      permissionKey: 'notifications:notification:read:own',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  const settingsGroup = await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'settings',
      title: 'Settings',
      path: '/settings',
      icon: 'Settings',
      itemType: SidebarItemTypeEnum.GROUP,
      parentId: headerSystem.id,
      sortOrder: 32,
      permissionKey: 'settings:settings:read:any',
      activeMatch: '/settings/*',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'settings_roles',
      title: 'Roles & Permissions',
      path: '/settings/roles',
      icon: 'ShieldCheck',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: settingsGroup.id,
      sortOrder: 1,
      permissionKey: 'roles:roles:read:any',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'settings_security',
      title: 'Security & 2FA',
      path: '/settings/security',
      icon: 'Lock',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: settingsGroup.id,
      sortOrder: 2,
      permissionKey: 'settings:settings:read:any',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  console.log('✅ RBAC, Super Admin & Enterprise Sidebar Items seed completed successfully');
}
