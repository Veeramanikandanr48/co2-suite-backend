import { Injectable, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as CryptoJS from 'crypto-js';
import { JwtService } from '@nestjs/jwt';
import { UserDetails, UserAuthenticationDetails, UserEmailVerification } from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { MasterRoles } from 'src/entities/master.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { EmailService } from 'src/utility/email/email.service';
import { MultiFactorAuthenticationService } from 'src/utility/multi-factor-authentication/multi-factor-authentication.service';
import { EmailTemplate } from 'src/enums/base.enum';
import {
  CreateUserManagementDto,
  ResetUserPasswordDto,
  UpdateUserManagementDto,
  UserQueryDto,
} from './dto/user-management.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserDetails)
    private readonly userRepo: Repository<UserDetails>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    @InjectRepository(UserAuthenticationDetails)
    private readonly userAuthRepo: Repository<UserAuthenticationDetails>,

    @InjectRepository(UserEmailVerification)
    private readonly emailVerifyRepo: Repository<UserEmailVerification>,

    @InjectRepository(MasterRoles)
    private readonly rolesRepo: Repository<MasterRoles>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,

    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly mfaService: MultiFactorAuthenticationService,
  ) {}

  async findAll(query: UserQueryDto): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.userRepo.createQueryBuilder('u');

    if (query.status === 'active') {
      qb.andWhere('u.isActive = :active', { active: true });
    } else if (query.status === 'inactive') {
      qb.andWhere('u.isActive = :active', { active: false });
    }

    if (query.search && query.search.trim() !== '') {
      const search = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(u.userName) LIKE :search OR LOWER(u.email) LIKE :search)',
        { search },
      );
    }

    qb.orderBy('u.id', 'DESC');
    qb.skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    const userIds = users.map((u) => u.id);
    let userRolesMap: Map<number, any[]> = new Map();

    if (userIds.length > 0) {
      const userRoles = await this.userRoleRepo.find({
        where: userIds.map((id) => ({ userId: id, isActive: true })),
        relations: { role: true },
      });

      userRoles.forEach((ur) => {
        if (!userRolesMap.has(ur.userId)) {
          userRolesMap.set(ur.userId, []);
        }
        if (ur.role) {
          userRolesMap.get(ur.userId)!.push({
            roleId: ur.role.id,
            roleKey: ur.role.roleKey,
            roleName: ur.role.roleName,
            isPrimary: ur.isPrimary,
          });
        }
      });
    }

    const items = users.map((u) => {
      const roles = userRolesMap.get(u.id) || [];
      const primaryRole = roles.find((r) => r.isPrimary) || roles[0] || null;
      return {
        userId: u.id,
        userName: u.userName,
        emailId: u.email,
        isActive: u.isActive,
        isVerified: u.isVerified,
        isTwoFactorAuthenticationEnabled: u.isTwoFactorAuthenticationEnabled ?? false,
        createdOn: u.createdOn,
        roles,
        primaryRole,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const userRoles = await this.userRoleRepo.find({
      where: { userId: id, isActive: true },
      relations: { role: true },
    });

    const roles = userRoles
      .filter((ur) => ur.role)
      .map((ur) => ({
        roleId: ur.role.id,
        roleKey: ur.role.roleKey,
        roleName: ur.role.roleName,
        isPrimary: ur.isPrimary,
      }));

    const primaryRole = roles.find((r) => r.isPrimary) || roles[0] || null;

    return {
      userId: user.id,
      userName: user.userName,
      emailId: user.email,
      isActive: user.isActive,
      isVerified: user.isVerified,
      isTwoFactorAuthenticationEnabled: user.isTwoFactorAuthenticationEnabled ?? false,
      createdOn: user.createdOn,
      updatedOn: user.updatedOn,
      roles,
      primaryRole,
    };
  }

  async create(dto: CreateUserManagementDto, changedBy: number): Promise<any> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`Email '${dto.email}' is already registered`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = this.userRepo.create({
      userName: dto.userName,
      email: dto.email,
      password: hashedPassword,
      isActive: dto.isActive ?? true,
      isVerified: dto.isVerified ?? false,
      isTwoFactorAuthenticationEnabled: dto.isTwoFactorAuthenticationEnabled ?? false,
    });

    const savedUser = await this.userRepo.save(newUser);

    // Collect all role IDs to assign (primary + additional)
    const assignedRoleIds = new Set<number>();

    let primaryRoleId = dto.roleId;
    if (!primaryRoleId) {
      const defaultRole = await this.rolesRepo.findOne({ where: { roleKey: 'MEMBER', isActive: true } });
      primaryRoleId = defaultRole ? defaultRole.id : undefined;
      if (!primaryRoleId) {
        const firstRole = await this.rolesRepo.findOne({ where: { isActive: true } });
        if (firstRole) primaryRoleId = firstRole.id;
      }
    }

    if (primaryRoleId) {
      assignedRoleIds.add(primaryRoleId);
    }

    if (dto.additionalRoleIds && Array.isArray(dto.additionalRoleIds)) {
      dto.additionalRoleIds.forEach((rId) => assignedRoleIds.add(rId));
    }

    // Save user roles
    for (const rId of Array.from(assignedRoleIds)) {
      await this.userRoleRepo.save({
        userId: savedUser.id,
        roleId: rId,
        isPrimary: rId === primaryRoleId,
        isActive: true,
      });
    }

    // Generate Verification Token and Save
    const verificationToken = this.jwtService.sign(
      { id: savedUser.id, email: savedUser.email },
      { expiresIn: '24h' },
    );

    await this.emailVerifyRepo.save({
      email: savedUser.email,
      otp: verificationToken,
      otpDate: new Date(),
    });

    // Send Welcome / Verification Email
    if (dto.sendWelcomeEmail || !dto.isVerified) {
      try {
        const routePrefix = process.env.VERIFY_EMAIL_ROUTE || 'http://localhost:3000/verify-email?token=';
        const verifyUrl = `${routePrefix}${verificationToken}`;

        await this.emailService.sendEmail({
          name: savedUser.userName,
          email: savedUser.email,
          subject: 'Verify Your Email - CO2 Suite',
          template: EmailTemplate.VERIFY_EMAIL,
          context: {
            url: verifyUrl,
            token: verificationToken,
          },
        });
        this.logger.log(`Onboarding verification email dispatched to ${savedUser.email}`);
      } catch (emailErr: any) {
        this.logger.error(`Verification email dispatch failed for ${savedUser.email}: ${emailErr.message}`);
      }
    }

    // Generate 2FA Secret if requested
    if (dto.isTwoFactorAuthenticationEnabled) {
      try {
        const mfaData = await this.mfaService.generateQRcode(savedUser.email);
        const backupCode = await this.mfaService.generateBackupCode(8);
        await this.mfaService.saveMfaRecord(
          { id: savedUser.id, secret: mfaData.secretKey, code: backupCode },
          { info: (msg) => this.logger.log(msg), error: (msg, ...args) => this.logger.error(msg, args) },
        );
      } catch (mfaErr: any) {
        this.logger.error(`2FA setup failed for ${savedUser.email}: ${mfaErr.message}`);
      }
    }

    await this.writeAudit('user', savedUser.id, 'onboarded_user', null, savedUser, changedBy);
    return this.findOne(savedUser.id);
  }

  async update(id: number, dto: UpdateUserManagementDto, changedBy: number): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const before = { ...user };

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email '${dto.email}' is already in use by another user`);
      }
      user.email = dto.email;
    }

    if (dto.userName !== undefined) user.userName = dto.userName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.isVerified !== undefined) user.isVerified = dto.isVerified;
    if (dto.isTwoFactorAuthenticationEnabled !== undefined) {
      user.isTwoFactorAuthenticationEnabled = dto.isTwoFactorAuthenticationEnabled;
      if (dto.isTwoFactorAuthenticationEnabled && !user.twoFactorAuthenticationSecret) {
        try {
          const mfaData = await this.mfaService.generateQRcode(user.email);
          const backupCode = await this.mfaService.generateBackupCode(8);
          await this.mfaService.saveMfaRecord(
            { id, secret: mfaData.secretKey, code: backupCode },
            { info: (msg) => this.logger.log(msg), error: (msg, ...args) => this.logger.error(msg, args) },
          );
        } catch (err: any) {
          this.logger.error(`Error enabling 2FA for user #${id}: ${err.message}`);
        }
      }
    }

    await this.userRepo.save(user);

    if (dto.roleIds !== undefined && Array.isArray(dto.roleIds)) {
      await this.userRoleRepo.update({ userId: id, isActive: true }, { isActive: false });

      for (let i = 0; i < dto.roleIds.length; i++) {
        const rId = dto.roleIds[i];
        await this.userRoleRepo.save({
          userId: id,
          roleId: rId,
          isPrimary: i === 0,
          isActive: true,
        });
      }
    }

    await this.writeAudit('user', id, 'updated', before, user, changedBy);
    return this.findOne(id);
  }

  async get2FADetails(id: number): Promise<{ qrcode: string; secretKey: string; isTwoFactorAuthenticationEnabled: boolean }> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const encryptionKey = process.env.CRYPTO_SECRET_KEY || 'default-secret-key';
    let secret = '';
    if (user.twoFactorAuthenticationSecret) {
      try {
        secret = CryptoJS.AES.decrypt(user.twoFactorAuthenticationSecret, encryptionKey).toString(CryptoJS.enc.Utf8);
      } catch (_err) {
        secret = '';
      }
    }

    const mfaData = await this.mfaService.generateQRcode(user.email, secret || undefined);

    if (!user.twoFactorAuthenticationSecret && mfaData.secretKey) {
      const encryptedSecret = CryptoJS.AES.encrypt(mfaData.secretKey, encryptionKey).toString();
      user.twoFactorAuthenticationSecret = encryptedSecret;
      await this.userRepo.save(user);
    }

    return {
      qrcode: mfaData.qrcode,
      secretKey: mfaData.secretKey,
      isTwoFactorAuthenticationEnabled: !!user.isTwoFactorAuthenticationEnabled,
    };
  }

  async verifyMy2FA(userId: number, code: string, secretKey?: string): Promise<{ isTwoFactorAuthenticationEnabled: boolean }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    const encryptionKey = process.env.CRYPTO_SECRET_KEY || 'default-secret-key';
    let secretToUse = secretKey;
    if (!secretToUse && user.twoFactorAuthenticationSecret) {
      try {
        secretToUse = CryptoJS.AES.decrypt(user.twoFactorAuthenticationSecret, encryptionKey).toString(CryptoJS.enc.Utf8);
      } catch (_err) {
        secretToUse = '';
      }
    }

    if (!secretToUse) {
      throw new BadRequestException('No 2FA secret found. Please generate a QR code first.');
    }

    const isValid = await this.mfaService.verifyTOTP(secretToUse, code);
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA verification code. Please check your authenticator app and try again.');
    }

    const encryptedSecret = CryptoJS.AES.encrypt(secretToUse, encryptionKey).toString();
    user.twoFactorAuthenticationSecret = encryptedSecret;
    user.isTwoFactorAuthenticationEnabled = true;
    await this.userRepo.save(user);

    return { isTwoFactorAuthenticationEnabled: true };
  }

  async disableMy2FA(userId: number): Promise<{ isTwoFactorAuthenticationEnabled: boolean }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    user.isTwoFactorAuthenticationEnabled = false;
    await this.userRepo.save(user);
    return { isTwoFactorAuthenticationEnabled: false };
  }

  async toggleMy2FA(userId: number): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    if (user.isTwoFactorAuthenticationEnabled) {
      return this.disableMy2FA(userId);
    }
    return { isTwoFactorAuthenticationEnabled: false, message: 'Verification required to enable 2FA' };
  }

  async disableUser2FAByAdmin(targetUserId: number, adminUserId: number, adminTotpCode: string): Promise<any> {
    const adminUser = await this.userRepo.findOne({ where: { id: adminUserId } });
    if (!adminUser) throw new NotFoundException(`Admin user #${adminUserId} not found`);

    const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException(`User #${targetUserId} not found`);

    if (!targetUser.isTwoFactorAuthenticationEnabled) {
      throw new BadRequestException(`2FA is already disabled for ${targetUser.email}`);
    }

    if (adminUser.isTwoFactorAuthenticationEnabled) {
      if (!adminTotpCode || adminTotpCode.trim().length !== 6) {
        throw new BadRequestException('Super Admin 6-digit TOTP verification code is required');
      }

      const encryptionKey = process.env.CRYPTO_SECRET_KEY || 'default-secret-key';
      let adminSecret = '';
      if (adminUser.twoFactorAuthenticationSecret) {
        try {
          adminSecret = CryptoJS.AES.decrypt(adminUser.twoFactorAuthenticationSecret, encryptionKey).toString(CryptoJS.enc.Utf8);
        } catch (_err) {
          adminSecret = '';
        }
      }

      if (!adminSecret) {
        throw new BadRequestException('Super Admin 2FA secret is invalid or missing');
      }

      const isValid = await this.mfaService.verifyTOTP(adminSecret, adminTotpCode.trim());
      if (!isValid) {
        throw new BadRequestException('Invalid Super Admin 2FA verification code. Verification failed.');
      }
    }

    const before = { ...targetUser };
    targetUser.isTwoFactorAuthenticationEnabled = false;
    await this.userRepo.save(targetUser);

    await this.writeAudit('user', targetUserId, '2fa_disabled_by_admin', before, targetUser, adminUserId);

    return {
      message: `2FA disabled for user ${targetUser.email} successfully`,
      isTwoFactorAuthenticationEnabled: false,
    };
  }

  async remove(id: number, changedBy: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    await this.userRepo.update(id, { isActive: false });
    await this.userRoleRepo.update({ userId: id }, { isActive: false });
    await this.writeAudit('user', id, 'deleted', user, null, changedBy);
  }

  async toggleStatus(id: number, changedBy: number): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const newStatus = !user.isActive;
    await this.userRepo.update(id, { isActive: newStatus });
    await this.writeAudit('user', id, 'toggle_status', { isActive: user.isActive }, { isActive: newStatus }, changedBy);

    return this.findOne(id);
  }

  async resetPassword(id: number, dto: ResetUserPasswordDto, changedBy: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.update(id, { password: hashedPassword });
    await this.writeAudit('user', id, 'admin_reset_password', null, { resetBy: changedBy }, changedBy);
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
