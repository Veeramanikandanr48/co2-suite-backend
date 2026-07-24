import { MasterRoles } from 'src/entities/master.entity';
import { Permission } from 'src/entities/permission.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { UserDetails, UserAuthenticationDetails } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { SidebarItem } from 'src/entities/sidebar-item.entity';
import { MasterModule } from 'src/entities/master-module.entity';
import { MasterFeature } from 'src/entities/master-feature.entity';
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
  const featureRepo  = dataSource.getRepository(MasterFeature);
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

  // ── 2. Seed master_modules & master_features ──────────────────────────────────
  const modulesData = [
    { moduleKey: 'carbon', name: 'Corporate Carbon Management', category: 'Corporate', icon: 'Layers' },
    { moduleKey: 'cbam', name: 'EU Carbon Border Adjustment Mechanism', category: 'Global', icon: 'Globe' },
    { moduleKey: 'esg', name: 'Corporate Sustainability (ESG)', category: 'Corporate', icon: 'Leaf' },
    { moduleKey: 'pcf', name: 'Product Carbon Footprint (PCF)', category: 'Product', icon: 'FileText' },
    { moduleKey: 'lca_plastics', name: 'LCA - Plastics Manufacturing', category: 'Industry', icon: 'Factory' },
    { moduleKey: 'lca_metals', name: 'LCA - Metals & Smelting', category: 'Industry', icon: 'Zap' },
    { moduleKey: 'epd_cables', name: 'Environmental Product Declarations (EPD)', category: 'Industry', icon: 'ShieldCheck' },
    { moduleKey: 'users', name: 'User Management', category: 'System', icon: 'Users' },
    { moduleKey: 'roles', name: 'Roles & Access', category: 'System', icon: 'ShieldCheck' },
    { moduleKey: 'settings', name: 'System Settings', category: 'System', icon: 'Settings' },
  ];

  const savedModules: Record<string, MasterModule> = {};
  for (const mData of modulesData) {
    let mod = await modulesRepo.findOne({ where: { moduleKey: mData.moduleKey } });
    if (!mod) {
      mod = await modulesRepo.save(modulesRepo.create({ ...mData, isEnabled: true }));
    }
    savedModules[mData.moduleKey] = mod;

    const featKey = `${mData.moduleKey}:dashboard`;
    const existingFeat = await featureRepo.findOne({ where: { featureKey: featKey } });
    if (!existingFeat) {
      await featureRepo.save(
        featureRepo.create({
          moduleId: mod.id,
          featureKey: featKey,
          name: `${mData.name} Dashboard`,
          route: `/${mData.moduleKey}`,
          icon: mData.icon,
          sortOrder: 1,
        }),
      );
    }
  }

  // ── 3. Seed permissions ──────────────────────────────────────────────────────
  const permissionsData = [
    // Users
    { permissionKey: 'users:profile:read:any', name: 'Read any user profile', moduleKey: 'users' },
    { permissionKey: 'users:profile:write:any', name: 'Create/update user profiles', moduleKey: 'users' },
    { permissionKey: 'users:profile:delete:any', name: 'Delete user profiles', moduleKey: 'users' },
    // Roles
    { permissionKey: 'roles:roles:read:any', name: 'Read any role', moduleKey: 'roles' },
    { permissionKey: 'roles:roles:write:any', name: 'Create/update roles', moduleKey: 'roles' },
    { permissionKey: 'roles:roles:delete:any', name: 'Delete roles', moduleKey: 'roles' },
    // Permissions
    { permissionKey: 'permissions:permissions:read:any', name: 'Read permissions', moduleKey: 'permissions' },
    { permissionKey: 'permissions:permissions:write:any', name: 'Modify permissions', moduleKey: 'permissions' },
    // Dashboard & System
    { permissionKey: 'dashboard:dashboard:read:any', name: 'View analytics dashboard', moduleKey: 'dashboard' },
    { permissionKey: 'settings:settings:read:any', name: 'Read system settings', moduleKey: 'settings' },
    { permissionKey: 'settings:settings:write:any', name: 'Modify system settings', moduleKey: 'settings' },
    { permissionKey: 'notifications:notification:read:own', name: 'Read own notifications', moduleKey: 'notifications' },
  ];

  const savedPermissions: Record<string, Permission> = {};
  for (const permData of permissionsData) {
    let existing = await permRepo.findOne({ where: { permissionKey: permData.permissionKey } });
    if (!existing) {
      const parts = permData.permissionKey.split(':');
      const modKey = parts[0];
      const resource = parts[1] || 'default';
      const action = parts[2] || 'read';
      const scope = parts[3] || 'any';
      const mod = savedModules[modKey];

      existing = await permRepo.save(
        permRepo.create({
          permissionKey: permData.permissionKey,
          resource,
          action,
          scope,
          description: permData.name,
          moduleId: mod ? mod.id : undefined,
        }),
      );
    }
    savedPermissions[permData.permissionKey] = existing;
  }

  // ── 4. Assign permissions to master_roles ──────────────────────────────────
  const superAdminRole = savedRoles['SUPER_ADMIN'];
  const adminRole      = savedRoles['ADMIN'];

  const allPerms = Object.values(savedPermissions);

  for (const perm of allPerms) {
    const existingSA = await rolePermRepo.findOne({
      where: { roleId: superAdminRole.id, permissionId: perm.id },
    });
    if (!existingSA) {
      await rolePermRepo.save(rolePermRepo.create({ roleId: superAdminRole.id, permissionId: perm.id }));
    }

    const existingAdmin = await rolePermRepo.findOne({
      where: { roleId: adminRole.id, permissionId: perm.id },
    });
    if (!existingAdmin) {
      await rolePermRepo.save(rolePermRepo.create({ roleId: adminRole.id, permissionId: perm.id }));
    }
  }

  // ── 5. Seed initial Super Admin User ───────────────────────────────────────
  const userDetailsRepo = dataSource.getRepository(UserDetails);
  const userAuthRepo    = dataSource.getRepository(UserAuthenticationDetails);
  const userRoleRepo    = dataSource.getRepository(UserRole);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cage.com';
  const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@123';

  let superAdminUser = await userDetailsRepo.findOne({ where: { email: adminEmail } });

  if (!superAdminUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPass, salt);

    superAdminUser = await userDetailsRepo.save(
      userDetailsRepo.create({
        email: adminEmail,
        userName: 'Super Admin',
        password: passwordHash,
        isActive: true,
        isVerified: true,
      }),
    );

    await userRoleRepo.save(
      userRoleRepo.create({
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      }),
    );

    console.log(`✅ Super Admin created: ${adminEmail}`);
  }

  // ── 6. Seed Enterprise Sidebar Navigation Items ─────────────────────────────
  const sidebarRepo = dataSource.getRepository(SidebarItem);
  await sidebarRepo.query('TRUNCATE TABLE "sidebar_items" CASCADE');

  // Core Header
  const headerCore = await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'header_core',
      title: 'CORE APPLICATIONS',
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
      parentId: headerCore.id,
      sortOrder: 1,
      permissionKey: 'dashboard:dashboard:read:any',
      activeMatch: '/dashboard*',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'ecosystem',
      title: 'Ecosystem',
      path: '/ecosystem',
      icon: 'LayoutGrid',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: headerCore.id,
      sortOrder: 2,
      permissionKey: 'dashboard:dashboard:read:any',
      activeMatch: '/ecosystem*',
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
      itemKey: 'organizations',
      title: 'Organizations',
      path: '/organizations',
      icon: 'Building2',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: headerAdmin.id,
      sortOrder: 10,
      permissionKey: 'users:profile:read:any',
      activeMatch: '/organizations/*',
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
      title: 'All Roles',
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
      itemKey: 'roles_create',
      title: 'Create Role',
      path: '/roles/create',
      icon: 'PlusCircle',
      itemType: SidebarItemTypeEnum.MENU,
      parentId: rolesGroup.id,
      sortOrder: 2,
      permissionKey: 'roles:roles:write:any',
      visibility: SidebarVisibilityEnum.VISIBLE,
    }),
  );

  // System Header
  const headerSystem = await sidebarRepo.save(
    sidebarRepo.create({
      itemKey: 'header_system',
      title: 'SYSTEM & LOGS',
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

  console.log('✅ RBAC, Super Admin, Enterprise Sidebar & Master Modules seed completed successfully');
}
