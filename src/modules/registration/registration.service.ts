import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  UserAuthenticationDetails,
  UserDetails,
  UserEmailVerification,
} from 'src/entities/user.entity';
import { Repository, UpdateResult } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { LoginMasterType } from 'src/enums/registration.enum';
import {
  ICreateUser,
  ILoginInfo,
  IUserAuthData,
  IUserEmailVerificaiton,
} from 'src/interfaces/registration.interface';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/utility/email/email.service';
import { MultiFactorAuthenticationService } from 'src/utility/multi-factor-authentication/multi-factor-authentication.service';
import { ConfigService } from '@nestjs/config';
import { UtilService } from 'src/utility/util/util.service';
import { addHours, isAfter } from 'date-fns';
import { CreateUserDto } from 'src/dto/user.dto';
import { EmailTemplate } from 'src/enums/base.enum';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(UserDetails)
    private readonly userRepository: Repository<UserDetails>,

    @InjectRepository(UserEmailVerification)
    private readonly userEmailVerificationEepository: Repository<UserEmailVerification>,

    @InjectRepository(UserAuthenticationDetails)
    private readonly userAuthRepo: Repository<UserAuthenticationDetails>,

    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly mfa: MultiFactorAuthenticationService,
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
  ) {}

  async registerUser(dto: CreateUserDto) {
    const isEmailExist = await this.checkEmailVerifiedExist(dto.emailId);
    if (isEmailExist) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = {
      userName: dto.userName,
      email: dto.emailId,
      password: hashedPassword,
      roleId: dto.roleId || 3,
      organizationId: dto.organizationId || 1,
      firstName: dto.firstName || dto.userName,
      lastName: dto.lastName || undefined,
    };
    const savedUser = await this.saveUser(newUser);
    const token = this.jwtService.sign(
      {
        id: savedUser.id,
        email: savedUser.email,
      },
      { expiresIn: '1h' },
    );

    try {
      this.emailService.sendEmail({
        name: savedUser.userName,
        email: savedUser.email,
        subject: 'Verify Your Email',
        template: EmailTemplate.VERIFY_EMAIL,
        context: {
          url: `${process.env.VERIFY_EMAIL_ROUTE}${token}`,
          token: token,
        },
      });
    } catch {
      // Continue with the registration process even if email fails
    }

    return {
      message:
        'User registered successfully. Please check your email for verification.',
      user: {
        id: savedUser.id,
        userName: savedUser.userName,
        email: savedUser.email,
      },
    };
  }

  async loginUser(emailId: string, password: string) {
    const loginData = await this.login(emailId, LoginMasterType.LOGIN);

    if (!loginData) {
      throw new BadRequestException('Email not found');
    }

    if (
      loginData.updatedAt &&
      isAfter(new Date(), addHours(new Date(loginData.updatedAt), 24))
    ) {
      loginData.attemptedCount = 0;
      loginData.isBlocked = false;
      loginData.blockedTime = null;
    }

    if (!(await bcrypt.compare(password, loginData.password))) {
      loginData.attemptedCount += 1;
      if (loginData.attemptedCount >= 3) {
        loginData.isBlocked = true;
        loginData.blockedTime = addHours(new Date(), 1);
      }
      throw new BadRequestException('Email or password is invalid');
    } else {
      loginData.attemptedCount = 0;
    }

    if (!loginData.isVerified || !loginData.isActive || loginData.isBlocked) {
      if (
        loginData.isBlocked &&
        isAfter(new Date(), new Date(loginData.blockedTime))
      ) {
        loginData.isBlocked = false;
        loginData.blockedTime = null;
        loginData.attemptedCount = 0;
      } else {
        let errorMessage = '';
        if (!loginData.isVerified || !loginData.isActive) {
          errorMessage = 'Email does not exist';
        } else if (loginData.isBlocked) {
          errorMessage = 'Account is blocked. Please try again later.';
        }
        throw new BadRequestException(errorMessage);
      }
    }

    const userAuthPayload = {
      attemptedCount: loginData?.attemptedCount ?? 0,
      userId: loginData.id,
      isBlocked: loginData?.isBlocked ?? false,
      blockedTime: loginData?.blockedTime,
      masterLoginTypeId: LoginMasterType.LOGIN,
    };

    await this.updateUserAuth(
      userAuthPayload.userId,
      userAuthPayload.attemptedCount,
      userAuthPayload.isBlocked,
      userAuthPayload.blockedTime,
    );

    const payload = {
      email: loginData.email,
      id: loginData.id,
      userName: loginData.userName,
      roleId: loginData.roleId || 3,
      organizationId: loginData.organizationId || null,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '5h' });

    return {
      isTwoFactorAuthenticationEnabled:
        loginData.isTwoFactorAuthenticationEnabled,
      token: accessToken,
      user: {
        id: loginData.id,
        userName: loginData.userName,
        email: loginData.email,
        roleId: loginData.roleId || 3,
        organizationId: loginData.organizationId || null,
        firstName: loginData.firstName || loginData.userName || '',
        lastName: loginData.lastName || null,
        userId: String(loginData.id),
        idpId: 'local',
        profilePath: loginData.profileImageKey || null,
      },
    };
  }

  async googleLogin(accessToken: string) {
    const oauth2Client = this.utilService.getOAuth2Client();
    const { userProfile, tokenInfo } = await this.getGoogleAuthCredentials(
      oauth2Client,
      accessToken,
    );

    const loginData = await this.ssoLogin(tokenInfo.sub, userProfile.email);
    let userDetails;

    if (!loginData) {
      const newUser: ICreateUser = {
        userName: userProfile.name,
        email: userProfile.email,
        googleSubId: tokenInfo.sub,
        isVerified: true,
      };

      userDetails = await this.saveUser(newUser);
    }

    const userAuthPayload = {
      attemptedCount: 0,
      userId: !loginData ? userDetails.id : loginData.id,
      isBlocked: false,
      blockedTime: null,
      masterLoginTypeId: LoginMasterType.LOGIN,
    };

    await this.saveUserAuth(userAuthPayload);

    const roleId = !loginData ? userDetails.roleId || 3 : loginData.roleId || 3;
    const organizationId = !loginData
      ? userDetails.organizationId || null
      : loginData.organizationId || null;

    const payload = {
      email: !loginData ? userDetails.email : loginData.email,
      id: !loginData ? userDetails.id : loginData.id,
      userName: !loginData ? userDetails.userName : loginData.userName,
      roleId,
      organizationId,
    };

    const accessTokenSigned = this.jwtService.sign(payload);

    return {
      email: !loginData ? userDetails.email : loginData.email,
      userName: !loginData ? userDetails.userName : loginData.userName,
      id: !loginData ? userDetails.id : loginData.id,
      roleId,
      organizationId,
      token: accessTokenSigned,
      profileImageUrl: !loginData
        ? userDetails.profileImageKey || null
        : loginData.profileImageKey || null,
    };
  }

  async generateQRCode(userId: number) {
    const userDetails = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.userName', 'user.isActive'])
      .where('user.id = :userId', { userId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();
    if (!userDetails) {
      throw new BadRequestException('User not found');
    }
    return this.mfa.generateQRcode(userDetails.email.toString());
  }

  private getMfaLogger() {
    return this.utilService.createLogger(RegistrationService.name);
  }

  async verifyMfaCode(userId: number, data: { secret: string; code: string }) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.userName', 'user.isActive'])
      .where('user.id = :userId', { userId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isValid = await this.mfa.verifyTOTP(data.secret, data.code);
    const payload = {
      id: userId,
      secret: data.secret,
      code: data.code,
    };
    await this.mfa.saveMfaRecord(payload, this.getMfaLogger());

    const responseData = await this.generateUserResponseData(userId, isValid);

    return responseData;
  }

  async validateMfaCode(userId: number, data: { code: string }) {
    const secret = await this.mfa.getOtpSecretById(userId);
    const isValid = await this.mfa.verifyTOTP(secret?.data, data.code);

    if (!isValid) {
      throw new BadRequestException('Invalid code');
    }

    return this.generateUserResponseData(userId, isValid);
  }

  async resetMfaCode(
    userId: number,
    data: { newSecret: string; newCode: string },
  ) {
    const isNewCodeValid = this.mfa.verifyTOTP(data.newSecret, data.newCode);
    if (!isNewCodeValid) {
      throw new BadRequestException('Invalid new MFA code');
    }

    const payload = {
      id: userId,
      secret: data.newSecret,
      code: data.newCode,
    };
    await this.mfa.saveMfaRecord(payload, this.getMfaLogger());
    return { message: 'MFA reset successfully' };
  }

  async verifyEmailToken(token: string) {
    const payload = await this.jwtService.verifyAsync(token);
    const user = await this.checkEmailExist(payload.email);
    if (!user) {
      throw new BadRequestException('Email not found');
    }
    await this.updateIsVerified(payload.id);
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(emailId: string) {
    let authenticationDetails: IUserAuthData;
    const userData = await this.checkEmailExist(emailId);

    if (!userData) {
      throw new BadRequestException('Email not found');
    }

    let authDetails = await this.checkForgotAuthenticationExist(
      userData.id,
      LoginMasterType.FORGOT_PASSWORD,
    );

    if (!authDetails) {
      authenticationDetails = {
        attemptedCount: 0,
        isBlocked: false,
        blockedTime: null,
        userId: userData.id,
        masterLoginTypeId: LoginMasterType.FORGOT_PASSWORD,
      };
      authDetails = await this.saveUserAuth(authenticationDetails);
    }

    if (
      authDetails.updatedAt &&
      isAfter(new Date(), addHours(new Date(authDetails.updatedAt), 24))
    ) {
      authDetails.attemptedCount = 0;
      authDetails.isBlocked = false;
      authDetails.blockedTime = null;
    }

    authenticationDetails = {
      attemptedCount: authDetails.attemptedCount ?? 0,
      isBlocked: authDetails.isBlocked ?? false,
      blockedTime: authDetails.blockedTime,
      userId: userData.id,
      masterLoginTypeId: LoginMasterType.FORGOT_PASSWORD,
    };

    if (authenticationDetails.isBlocked) {
      if (isAfter(new Date(), new Date(authenticationDetails.blockedTime))) {
        authenticationDetails.isBlocked = false;
        authenticationDetails.blockedTime = null;
        authenticationDetails.attemptedCount = 0;
      } else {
        throw new BadRequestException(
          'Account is blocked. Please try again later.',
        );
      }
    }

    authenticationDetails.attemptedCount += 1;
    if (authenticationDetails.attemptedCount >= 3) {
      authenticationDetails.isBlocked = true;
      authenticationDetails.blockedTime = addHours(new Date(), 1);
    }

    await this.updateUserAuth(
      authenticationDetails.userId,
      authenticationDetails.attemptedCount,
      authenticationDetails.isBlocked,
      authenticationDetails.blockedTime,
    );

    const token = this.jwtService.sign(
      {
        id: userData.id,
        email: userData.email,
      },
      { expiresIn: '1h' },
    );

    this.emailService.sendEmail({
      name: userData.userName,
      email: userData.email,
      subject: 'Reset Your Password',
      template: EmailTemplate.FORGOT_PASSWORD,
      context: {
        url: `${process.env.RESET_PASSWORD_ROUTE}${token}`,
        token: token,
      },
    });

    return { message: 'Password reset email sent successfully' };
  }

  async resetPassword(token: string, password: string) {
    const payload = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
    const user = await this.checkEmailExist(payload.email);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.updateUserPassword(user.id, hashedPassword);

    return { message: 'Password reset successful' };
  }

  private async generateUserResponseData(userId: number, isValid: boolean) {
    const userDetails = await this.getUserDetailsId(userId.toString());

    const payload = {
      email: userDetails.email,
      id: userDetails.id,
      userName: userDetails.userName,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      id: userId,
      email: userDetails.email,
      userName: userDetails.userName,
      token: accessToken,
      isValid: isValid,
      profileImageUrl: userDetails.profileImageKey || null,
    };
  }

  async getUserByEmail(email: string): Promise<UserDetails | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.userName',
        'user.firstName',
        'user.lastName',
        'user.roleId',
        'user.organizationId',
        'user.isActive',
      ])
      .where('user.email = :email', { email })
      .getOne();
  }

  async updateUser(id: number, user: Partial<UserDetails>) {
    return await this.userRepository.update(id, user);
  }

  async login(
    email: string,
    loginTypeId: LoginMasterType,
  ): Promise<ILoginInfo> {
    return this.userRepository
      .createQueryBuilder('user')
      .select(
        'user.id, user.email, user.password, user.userName, user.roleId, user.organizationId, user.firstName, user.lastName, user.isVerified, user.isActive, user.isTwoFactorAuthenticationEnabled, user.profileImageKey',
      )
      .addSelect(
        'auth.isBlocked, auth.blockedTime, auth.attemptedCount, auth.id as uAuthId, auth.updatedAt',
      )
      .leftJoin(
        UserAuthenticationDetails,
        'auth',
        'auth.userId = user.id and auth.masterLoginTypeId = :loginTypeId',
      )
      .where(
        'user.email = :email and user.isActive = true and user.googleSubId is null',
      )
      .setParameters({ email, loginTypeId })
      .orderBy('user.id', 'DESC')
      .getRawOne();
  }

  async getGoogleAuthCredentials(oauth2Client: OAuth2Client, code: string) {
    const { tokens } = await oauth2Client.getToken(code);

    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({
      auth: oauth2Client as unknown as Parameters<
        typeof google.oauth2
      >[0]['auth'],
      version: 'v2',
    });

    const userDetails = await oauth2.userinfo.get();
    return { tokens, userProfile: userDetails.data, tokenInfo };
  }

  async saveUserAuth(userAuthData: IUserAuthData) {
    return this.userAuthRepo.save(userAuthData);
  }

  async updateUserAuth(
    userId: number,
    attemptedCount: number,
    isBlocked: boolean,
    blockedTime: Date | null,
  ): Promise<UpdateResult> {
    return await this.userAuthRepo.update(
      { userId },
      { attemptedCount, isBlocked, blockedTime },
    );
  }

  async checkEmailVerifiedExist(
    email: string,
  ): Promise<{ id: number; email: string; userName: string }> {
    return this.userRepository
      .createQueryBuilder('user')
      .select('user.id, user.email, user.userName')
      .where(
        'user.email = :email and user.isActive = true and user.isVerified',
        { email },
      )
      .getRawOne();
  }

  async ssoLogin(googleSubId: string, emailId: string): Promise<ILoginInfo> {
    return this.userRepository
      .createQueryBuilder('user')
      .select(
        'user.id, user.email, user.password, user.userName, user.roleId, user.organizationId, user.isVerified, user.isActive',
      )
      .addSelect('auth.isBlocked, auth.blockedTime, auth.attemptedCount')
      .leftJoin(UserAuthenticationDetails, 'auth', 'auth.userId = user.id')
      .where(
        'user.googleSubId = :googleSubId and user.email = :emailId and user.isActive = true',
        { googleSubId, emailId },
      )
      .getRawOne();
  }

  async saveUser(userData: ICreateUser) {
    return this.userRepository.save(userData);
  }

  async getUserDetailsId(id: string): Promise<{
    id: number;
    email: string;
    userName: string;
    profileImageKey: string;
  }> {
    return this.userRepository
      .createQueryBuilder('user')
      .select('user.id, user.email, user.userName, user.profileImageKey')
      .where('user.id = :id and user.isActive = true', { id })
      .getRawOne();
  }

  async saveUserEmailVerification(userData: IUserEmailVerificaiton) {
    return this.userEmailVerificationEepository.save(userData);
  }

  async getOtp(
    email: string,
    id: number,
  ): Promise<{
    email: string;
    otp: string;
    createdAt: Date;
    userName: string;
    otpDate: Date;
  }> {
    return this.userEmailVerificationEepository
      .createQueryBuilder('user')
      .innerJoin(
        UserDetails,
        'ud',
        'ud.id = user.createdBy and ud.isActive = true',
      )
      .select('user.email, user.otp, user.createdAt, ud.userName, user.otpDate')
      .where(
        'user.email = :email and user.isActive = true and user.createdBy = :id',
        { email, id },
      )
      .orderBy('user.id', 'DESC')
      .getRawOne();
  }

  async checkEmailExist(
    email: string,
  ): Promise<{ id: number; email: string; userName: string }> {
    return this.userRepository
      .createQueryBuilder('user')
      .select('user.id, user.email, user.userName')
      .where('user.email = :email and user.isActive = true', { email })
      .getRawOne();
  }

  async updateIsVerified(id: number) {
    await this.userRepository.update({ id }, { isVerified: true });
  }

  async checkForgotAuthenticationExist(
    id: number,
    loginTypeId: number,
  ): Promise<IUserAuthData> {
    return this.userAuthRepo
      .createQueryBuilder('userAuth')
      .select(
        'userAuth.userId, userAuth.id, userAuth.isBlocked, userAuth.blockedTime, userAuth.attemptedCount, userAuth.masterLoginTypeId, userAuth.updatedAt',
      )
      .where(
        'userAuth.userId = :id and userAuth.masterLoginTypeId = :loginTypeId',
        { id, loginTypeId },
      )
      .getRawOne();
  }

  async updateUserPassword(id: number, password: string) {
    await this.userRepository.update({ id }, { password });
  }
}
