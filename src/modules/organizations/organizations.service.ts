import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import {
  UserAuthenticationDetails,
  UserDetails,
} from 'src/entities/user.entity';
import {
  CreateOrganizationDto,
  AddOrganizationMemberDto,
  UpdateOrganizationDto,
  UpdateOrganizationMemberDto,
} from 'src/dto/organization.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { ICommonSortFieldObject } from 'src/utility/base-interface.interface';
import { UtilService } from 'src/utility/util/util.service';
import * as bcrypt from 'bcryptjs';
import { MasterRole } from 'src/enums/casl.enum';
import { LoginMasterType } from 'src/enums/registration.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(UserDetails)
    private readonly userRepo: Repository<UserDetails>,
    private readonly utilService: UtilService,
  ) {}

  private assertSuperAdmin(user: IDecodeUserDetails): void {
    if (user?.roleId !== MasterRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can perform this action');
    }
  }

  private assertCanManageOrg(user: IDecodeUserDetails, orgId: number): void {
    const isSuperAdmin = user?.roleId === MasterRole.SUPER_ADMIN;
    const isOrgAdmin =
      user?.roleId === MasterRole.ADMIN &&
      Number(user?.organizationId) === Number(orgId);
    if (!isSuperAdmin && !isOrgAdmin) {
      throw new ForbiddenException('Access denied to this organization');
    }
  }

  private resolveOrgScope(user: IDecodeUserDetails): number | undefined {
    if (user?.roleId === MasterRole.SUPER_ADMIN) {
      return undefined;
    }
    return user?.organizationId ? Number(user?.organizationId) : undefined;
  }

  async onboardOrganization(dto: CreateOrganizationDto, user: IDecodeUserDetails) {
    this.assertSuperAdmin(user);
    const superAdminId = user.id;

    // 1. Check if organization code or name already exists
    const existingOrg = await this.organizationRepo
      .createQueryBuilder('org')
      .select(['org.id', 'org.code', 'org.name'])
      .where('org.code = :code OR org.name = :name', {
        code: dto.code,
        name: dto.name,
      })
      .getOne();
    if (existingOrg) {
      throw new ConflictException('Organization name or code already exists');
    }

    // 2. Check if admin email or username already exists
    const existingUser = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.userName'])
      .where('user.email = :adminEmail OR user.userName = :adminUserName', {
        adminEmail: dto.adminEmail,
        adminUserName: dto.adminUserName,
      })
      .getOne();
    if (existingUser) {
      throw new ConflictException('Admin email or username already registered');
    }

    // 3. Execute atomic transaction to create Organization + Admin user
    const queryRunner = await this.utilService.connectQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Create Organization record
      const orgEntity = queryRunner.manager.create(Organization, {
        name: dto.name,
        code: dto.code,
        contactEmail: dto.contactEmail,
        emailDomain: dto.emailDomain || null,
        createdBy: superAdminId,
        isActive: true,
      });
      const savedOrg = await queryRunner.manager.save(Organization, orgEntity);

      // Create Admin user (roleId: 2 = Admin)
      const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
      const adminEntity = queryRunner.manager.create(UserDetails, {
        userName: dto.adminUserName,
        email: dto.adminEmail,
        password: hashedPassword,
        roleId: MasterRole.ADMIN, // roleId 2
        organizationId: savedOrg.id,
        firstName: dto.adminFirstName || dto.adminUserName,
        lastName: dto.adminLastName || null,
        isActive: true,
        isVerified: true,
        createdBy: superAdminId,
      });
      const savedAdmin = await queryRunner.manager.save(
        UserDetails,
        adminEntity,
      );

      // Create Auth Details for Admin user
      const authDetails = queryRunner.manager.create(
        UserAuthenticationDetails,
        {
          userId: savedAdmin.id,
          attemptedCount: 0,
          isBlocked: false,
          masterLoginTypeId: LoginMasterType.LOGIN,
          createdBy: superAdminId,
        },
      );
      await queryRunner.manager.save(UserAuthenticationDetails, authDetails);

      await queryRunner.commitTransaction();

      return {
        organization: {
          id: savedOrg.id,
          name: savedOrg.name,
          code: savedOrg.code,
          contactEmail: savedOrg.contactEmail,
        },
        adminUser: {
          id: savedAdmin.id,
          userName: savedAdmin.userName,
          email: savedAdmin.email,
          roleId: savedAdmin.roleId,
          organizationId: savedAdmin.organizationId,
        },
      };
    } catch {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        'Organization onboarding failed. Please try again later.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getAllOrganizations(user: IDecodeUserDetails) {
    const orgId = this.resolveOrgScope(user);
    const query = this.organizationRepo
      .createQueryBuilder('org')
      .select([
        'org.id',
        'org.name',
        'org.code',
        'org.contactEmail',
        'org.emailDomain',
        'org.phone',
        'org.website',
        'org.address',
        'org.city',
        'org.state',
        'org.country',
        'org.postalCode',
        'org.taxId',
        'org.industry',
        'org.timezone',
        'org.isActive',
        'org.createdAt',
        'org.updatedAt',
      ])
      .where('org.isActive = :isActive', { isActive: true });

    if (orgId) {
      query.andWhere('org.id = :orgId', { orgId });
    }

    return query.orderBy('org.id', 'ASC').getMany();
  }

  async getOrganizationById(id: number, user: IDecodeUserDetails) {
    this.assertCanManageOrg(user, id);
    return this.organizationRepo
      .createQueryBuilder('org')
      .select([
        'org.id',
        'org.name',
        'org.code',
        'org.contactEmail',
        'org.emailDomain',
        'org.phone',
        'org.website',
        'org.address',
        'org.city',
        'org.state',
        'org.country',
        'org.postalCode',
        'org.taxId',
        'org.industry',
        'org.timezone',
        'org.isActive',
        'org.createdAt',
        'org.updatedAt',
      ])
      .where('org.id = :id', { id })
      .andWhere('org.isActive = :isActive', { isActive: true })
      .getOne();
  }

  async updateOrganization(
    id: number,
    data: UpdateOrganizationDto,
    user: IDecodeUserDetails,
  ) {
    this.assertCanManageOrg(user, id);
    const org = await this.getOrganizationById(id, user);
    if (!org) {
      throw new BadRequestException('Organization not found');
    }
    await this.organizationRepo.update(id, data);
    return this.getOrganizationById(id, user);
  }

  async deactivateOrganization(id: number, user: IDecodeUserDetails) {
    this.assertSuperAdmin(user);
    const org = await this.getOrganizationById(id, user);
    if (!org) {
      throw new BadRequestException('Organization not found');
    }
    await this.organizationRepo.update(id, { isActive: false });
    return { message: 'Organization deactivated successfully', id };
  }

  async getOrganizationFilterList(
    payload: CommonListPayloadDto,
    user: IDecodeUserDetails,
  ) {
    const orgId = this.resolveOrgScope(user);
    const tableName = 'org';
    const tableSortCheck = [
      'id',
      'name',
      'code',
      'contactEmail',
      'isActive',
      'createdAt',
    ];
    const sortFieldObject: ICommonSortFieldObject = {
      id: 'org.id',
      name: 'org.name',
      code: 'org.code',
      contactEmail: 'org.contactEmail',
      isActive: 'org.isActive',
      createdAt: 'org.createdAt',
    };

    const processedPayload = await this.utilService.processListPayload(
      payload || {},
      tableName,
      tableSortCheck,
      sortFieldObject,
      10,
      'id',
    );

    const { offSet, limit, sortField, sortOrder } = processedPayload;
    const { searchInput = '' } = payload || {};

    const query = this.organizationRepo
      .createQueryBuilder(tableName)
      .select([
        'org.id',
        'org.name',
        'org.code',
        'org.contactEmail',
        'org.emailDomain',
        'org.phone',
        'org.website',
        'org.address',
        'org.city',
        'org.state',
        'org.country',
        'org.postalCode',
        'org.taxId',
        'org.industry',
        'org.timezone',
        'org.isActive',
        'org.createdAt',
        'org.updatedAt',
      ]);

    if (orgId) {
      query.andWhere('org.id = :orgId', { orgId });
    }

    if (searchInput && searchInput.trim()) {
      const term = `%${searchInput.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(org.name) LIKE :term OR LOWER(org.code) LIKE :term OR LOWER(org.contactEmail) LIKE :term)',
        { term },
      );
    }

    const orderDirection = sortOrder === -1 ? 'DESC' : 'ASC';
    query.orderBy(sortField, orderDirection);
    query.skip(offSet).take(limit);

    const [listData, dataCount] = await query.getManyAndCount();

    return {
      listData,
      dataCount,
    };
  }

  async getOrganizationUsersFilterList(
    orgId: number,
    payload: CommonListPayloadDto,
    user: IDecodeUserDetails,
  ) {
    this.assertCanManageOrg(user, orgId);
    const tableName = 'user';
    const tableSortCheck = [
      'id',
      'firstName',
      'lastName',
      'email',
      'userName',
      'roleId',
      'isActive',
      'createdAt',
    ];
    const sortFieldObject: ICommonSortFieldObject = {
      id: 'user.id',
      firstName: 'user.firstName',
      lastName: 'user.lastName',
      email: 'user.email',
      userName: 'user.userName',
      roleId: 'user.roleId',
      isActive: 'user.isActive',
      createdAt: 'user.createdAt',
    };

    const processedPayload = await this.utilService.processListPayload(
      payload || {},
      tableName,
      tableSortCheck,
      sortFieldObject,
      10,
      'id',
    );

    const { offSet, limit, sortField, sortOrder } = processedPayload;
    const { searchInput = '' } = payload || {};

    const query = this.userRepo
      .createQueryBuilder(tableName)
      .select([
        'user.id',
        'user.organizationId',
        'user.firstName',
        'user.lastName',
        'user.userName',
        'user.email',
        'user.roleId',
        'user.isVerified',
        'user.profileImageKey',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.organizationId = :orgId', { orgId });

    if (searchInput && searchInput.trim()) {
      const term = `%${searchInput.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(user.firstName) LIKE :term OR LOWER(user.lastName) LIKE :term OR LOWER(user.email) LIKE :term OR LOWER(user.userName) LIKE :term)',
        { term },
      );
    }

    const orderDirection = sortOrder === -1 ? 'DESC' : 'ASC';
    query.orderBy(sortField, orderDirection);
    query.skip(offSet).take(limit);

    const [listData, dataCount] = await query.getManyAndCount();

    return {
      listData,
      dataCount,
    };
  }

  async addMemberToOrganization(
    orgId: number,
    dto: AddOrganizationMemberDto,
    user: IDecodeUserDetails,
  ) {
    this.assertCanManageOrg(user, orgId);
    const creatorId = user.id;
    const org = await this.getOrganizationById(orgId, user);
    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    const existingUser = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.userName'])
      .where('user.email = :email OR user.userName = :userName', {
        email: dto.email,
        userName: dto.userName,
      })
      .getOne();
    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userEntity = this.userRepo.create({
      userName: dto.userName,
      email: dto.email,
      password: hashedPassword,
      roleId: dto.roleId || MasterRole.USER,
      organizationId: orgId,
      firstName: dto.firstName,
      lastName: dto.lastName || null,
      isActive: true,
      isVerified: true,
      createdBy: creatorId,
    });
    const savedUser = await this.userRepo.save(userEntity);

    return {
      id: savedUser.id,
      userName: savedUser.userName,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      roleId: savedUser.roleId,
      organizationId: savedUser.organizationId,
    };
  }

  async updateOrganizationMember(
    orgId: number,
    userId: number,
    dto: UpdateOrganizationMemberDto,
    user: IDecodeUserDetails,
  ) {
    this.assertCanManageOrg(user, orgId);
    const userRecord = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.organizationId',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.userName',
        'user.roleId',
        'user.isActive',
      ])
      .where('user.id = :userId', { userId })
      .andWhere('user.organizationId = :orgId', { orgId })
      .getOne();
    if (!userRecord) {
      throw new BadRequestException(
        `User with ID ${userId} not found in this organization`,
      );
    }

    if (dto.firstName) userRecord.firstName = dto.firstName;
    if (dto.lastName) userRecord.lastName = dto.lastName;
    if (dto.email) userRecord.email = dto.email;
    if (dto.roleId) userRecord.roleId = dto.roleId;

    await this.userRepo.save(userRecord);
    return userRecord;
  }
}
