import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization, OrganizationStatusEnum } from 'src/entities/organization.entity';
import { MasterModule } from 'src/entities/master-module.entity';
import { MasterFeature } from 'src/entities/master-feature.entity';
import { OrganizationSubscription, SubscriptionStatusEnum } from 'src/entities/organization-subscription.entity';
import { OrganizationFeatureSubscription, FeatureSubscriptionStatusEnum } from 'src/entities/organization-feature-subscription.entity';
import { UserDetails } from 'src/entities/user.entity';
import { MasterRoles } from 'src/entities/master.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { UserOrganization, UserOrganizationStatusEnum } from 'src/entities/user-organization.entity';
import { TenantProvisionService } from 'src/modules/tenant-provision/tenant-provision.service';
import { TenantQueryService } from 'src/modules/tenant/tenant-query.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationModulesDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(MasterModule)
    private readonly moduleRepo: Repository<MasterModule>,
    @InjectRepository(MasterFeature)
    private readonly featureRepo: Repository<MasterFeature>,
    @InjectRepository(OrganizationSubscription)
    private readonly subRepo: Repository<OrganizationSubscription>,
    @InjectRepository(OrganizationFeatureSubscription)
    private readonly featureSubRepo: Repository<OrganizationFeatureSubscription>,
    @InjectRepository(UserDetails)
    private readonly userRepo: Repository<UserDetails>,
    @InjectRepository(MasterRoles)
    private readonly roleRepo: Repository<MasterRoles>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(UserOrganization)
    private readonly userOrgRepo: Repository<UserOrganization>,
    private readonly tenantProvisionService: TenantProvisionService,
    private readonly tenantQueryService: TenantQueryService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Onboard Organization: Generate TEN000001 & t_000001, create subscriptions, user-org link, and run provision engine
   */
  async createOrganization(dto: CreateOrganizationDto) {
    const rawSlug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanSlug = rawSlug.replace(/_+/g, '_').replace(/^_+|_+$/g, '');

    const existingUser = await this.userRepo.findOne({ where: { email: dto.adminEmail } });
    if (existingUser) {
      throw new ConflictException(`User with email '${dto.adminEmail}' already exists`);
    }

    const adminRole = await this.roleRepo.findOne({ where: { roleKey: 'ADMIN' } });
    if (!adminRole) {
      throw new NotFoundException(`Role 'ADMIN' not found in system`);
    }

    // Generate immutable tenant code (TEN000001) and short schema name (t_000001)
    const { tenantCode, schemaName } = await this.tenantProvisionService.generateNextTenantCode();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Organization (Status: PENDING)
      const newOrg = queryRunner.manager.create(Organization, {
        name: dto.name,
        tenantCode,
        slug: cleanSlug,
        schemaName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        subscriptionPlan: dto.subscriptionPlan,
        status: OrganizationStatusEnum.PENDING,
      });
      const savedOrg = await queryRunner.manager.save(Organization, newOrg);

      // 2. Grant Subscriptions for selected Master Modules & Features
      const moduleKeys = dto.moduleKeys && dto.moduleKeys.length > 0 ? dto.moduleKeys : ['carbon'];
      const masterModules = await this.moduleRepo.find({ relations: { features: true } });
      const selectedModules = masterModules.filter((m) => moduleKeys.includes(m.moduleKey));

      for (const mod of selectedModules) {
        const sub = queryRunner.manager.create(OrganizationSubscription, {
          organizationId: savedOrg.id,
          moduleId: mod.id,
          status: SubscriptionStatusEnum.ACTIVE,
          licenseKey: `LIC-${tenantCode}-${mod.moduleKey.toUpperCase()}`,
          activatedBy: 'SUPER_ADMIN',
          activatedAt: new Date(),
        });
        await queryRunner.manager.save(OrganizationSubscription, sub);

        if (mod.features) {
          for (const feat of mod.features) {
            const featSub = queryRunner.manager.create(OrganizationFeatureSubscription, {
              organizationId: savedOrg.id,
              featureId: feat.id,
              status: FeatureSubscriptionStatusEnum.ACTIVE,
            });
            await queryRunner.manager.save(OrganizationFeatureSubscription, featSub);
          }
        }
      }

      // 3. Create Organization Admin User
      const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
      const newUser = queryRunner.manager.create(UserDetails, {
        userName: dto.adminName,
        email: dto.adminEmail,
        password: hashedPassword,
        organizationId: savedOrg.id,
        isActive: true,
        isVerified: true,
      });
      const savedUser = await queryRunner.manager.save(UserDetails, newUser);

      // 4. Assign ADMIN role
      const userRole = queryRunner.manager.create(UserRole, {
        userId: savedUser.id,
        roleId: adminRole.id,
      });
      await queryRunner.manager.save(UserRole, userRole);

      // 5. Create Multi-Tenant UserOrganization Mapping
      const userOrg = queryRunner.manager.create(UserOrganization, {
        userId: savedUser.id,
        organizationId: savedOrg.id,
        roleId: adminRole.id,
        status: UserOrganizationStatusEnum.ACTIVE,
        isPrimary: true,
      });
      await queryRunner.manager.save(UserOrganization, userOrg);

      await queryRunner.commitTransaction();

      // 6. Execute Tenant Provisioning Engine (Creates schema "t_000001", runs versioned SQL migrations, seeds defaults, updates status -> ACTIVE)
      await this.tenantProvisionService.provisionTenant(savedOrg.id);

      return {
        message: `Organization '${savedOrg.name}' onboarded successfully with tenant code '${tenantCode}' and schema '${schemaName}'`,
        data: {
          id: savedOrg.id,
          name: savedOrg.name,
          tenantCode: savedOrg.tenantCode,
          slug: savedOrg.slug,
          schemaName: savedOrg.schemaName,
          subscriptionPlan: savedOrg.subscriptionPlan,
          status: OrganizationStatusEnum.ACTIVE,
          grantedModules: selectedModules.map((m) => m.moduleKey),
          adminUser: {
            id: savedUser.id,
            email: savedUser.email,
            userName: savedUser.userName,
          },
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * List all onboarded organizations with tenant details, subscriptions, settings, and health status
   */
  async findAll() {
    const orgs = await this.orgRepo.find({
      relations: {
        subscriptions: { module: true },
        settings: true,
        health: true,
      },
      order: { createdAt: 'DESC' },
    });

    const result = [];
    for (const o of orgs) {
      let tenantUsers: any[] = [];
      if (o.schemaName) {
        try {
          const res = await this.tenantQueryService.findTenantUsers(o.schemaName, { limit: 100 });
          tenantUsers = res.items;
        } catch (_err) {
          tenantUsers = [];
        }
      }

      result.push({
        id: o.id,
        name: o.name,
        tenantCode: o.tenantCode,
        slug: o.slug,
        schemaName: o.schemaName,
        contactEmail: o.contactEmail,
        subscriptionPlan: o.subscriptionPlan,
        status: o.status,
        migrationVersion: o.migrationVersion,
        createdAt: o.createdAt,
        settings: o.settings,
        health: o.health,
        userCount: tenantUsers.length,
        users: tenantUsers.map((u) => ({
          userId: u.id,
          userName: u.userName,
          emailId: u.email,
          isActive: u.isActive,
          isVerified: u.isVerified,
          isTwoFactorAuthenticationEnabled: u.isTwoFactorAuthenticationEnabled ?? false,
          createdOn: u.createdOn,
        })),
        subscriptions: o.subscriptions
          ? o.subscriptions.map((s) => ({
              moduleKey: s.module?.moduleKey,
              name: s.module?.name,
              category: s.module?.category,
              status: s.status,
              licenseKey: s.licenseKey,
            }))
          : [],
      });
    }

    return {
      message: 'Organizations fetched successfully',
      data: result,
    };
  }

  /**
   * Fetch single organization details
   */
  async findOne(id: string) {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: {
        subscriptions: { module: true },
        settings: true,
        health: true,
        provisionLogs: true,
      },
    });
    if (!org) {
      throw new NotFoundException(`Organization '${id}' not found`);
    }

    let tenantUsers: any[] = [];
    if (org.schemaName) {
      try {
        const res = await this.tenantQueryService.findTenantUsers(org.schemaName, { limit: 100 });
        tenantUsers = res.items;
      } catch (_err) {
        tenantUsers = [];
      }
    }

    return {
      message: 'Organization details fetched successfully',
      data: {
        ...org,
        users: tenantUsers.map((u) => ({
          userId: u.id,
          userName: u.userName,
          emailId: u.email,
          isActive: u.isActive,
          isVerified: u.isVerified,
          isTwoFactorAuthenticationEnabled: u.isTwoFactorAuthenticationEnabled ?? false,
          createdOn: u.createdOn,
        })),
        userCount: tenantUsers.length,
      },
    };
  }

  /**
   * Update module & feature application access for an organization
   */
  async updateModules(id: string, dto: UpdateOrganizationModulesDto) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization '${id}' not found`);
    }

    await this.subRepo.delete({ organizationId: id });
    await this.featureSubRepo.delete({ organizationId: id });

    const masterModules = await this.moduleRepo.find({ relations: { features: true } });
    const selectedModules = masterModules.filter((m) => dto.moduleKeys.includes(m.moduleKey));

    for (const mod of selectedModules) {
      await this.subRepo.save(
        this.subRepo.create({
          organizationId: id,
          moduleId: mod.id,
          status: SubscriptionStatusEnum.ACTIVE,
          licenseKey: `LIC-${org.tenantCode}-${mod.moduleKey.toUpperCase()}`,
          activatedBy: 'SUPER_ADMIN',
          activatedAt: new Date(),
        }),
      );

      if (mod.features) {
        for (const feat of mod.features) {
          await this.featureSubRepo.save(
            this.featureSubRepo.create({
              organizationId: id,
              featureId: feat.id,
              status: FeatureSubscriptionStatusEnum.ACTIVE,
            }),
          );
        }
      }
    }

    return {
      message: `Module licensing & feature access for organization '${org.name}' updated successfully`,
      data: selectedModules.map((m) => m.moduleKey),
    };
  }

  /**
   * Update organization details and granted module subscriptions
   */
  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization '${id}' not found`);
    }

    if (dto.name) org.name = dto.name;
    if (dto.contactEmail) org.contactEmail = dto.contactEmail;
    if (dto.contactPhone) org.contactPhone = dto.contactPhone;
    if (dto.subscriptionPlan) org.subscriptionPlan = dto.subscriptionPlan;

    await this.orgRepo.save(org);

    if (dto.moduleKeys) {
      await this.updateModules(id, { moduleKeys: dto.moduleKeys });
    }

    return {
      message: `Organization '${org.name}' updated successfully`,
      data: org,
    };
  }

  /**
   * List available platform master modules & features
   */
  async getMasterModules() {
    const modules = await this.moduleRepo.find({
      relations: { features: true },
      order: { category: 'ASC', name: 'ASC' },
    });
    return {
      message: 'Master modules fetched successfully',
      data: modules,
    };
  }
}
