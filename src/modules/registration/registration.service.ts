import { Injectable } from '@nestjs/common';
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

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(UserDetails)
    private readonly userRepository: Repository<UserDetails>,

    @InjectRepository(UserEmailVerification)
    private readonly userEmailVerificationEepository: Repository<UserEmailVerification>,

    @InjectRepository(UserAuthenticationDetails)
    private readonly userAuthRepo: Repository<UserAuthenticationDetails>,
  ) {}

  async registerUser(user: Partial<UserDetails>) {
    return await this.userRepository.save(user);
  }

  async getUserByEmail(email: string): Promise<UserDetails | null> {
    return await this.userRepository.findOne({ where: { email: email } });
  }

  async findAllUsers(): Promise<UserDetails[]> {
    return await this.userRepository.find({
      where: { isActive: true },
      select: { id: true, userName: true, email: true, createdOn: true },
    });
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
        'user.id, user.email, user.password, user.userName, user.isVerified, user.isActive, user.isTwoFactorAuthenticationEnabled, user.profileImageKey',
      )
      .addSelect(
        'auth.isBlocked, auth.blockedTime, auth.attemptedCount, auth.id as uAuthId, auth.updatedOn',
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

  async getGoogleAuthCredentials(
    oauth2Client: OAuth2Client,
    code: string,
    logger: { info: (msg: string) => void },
  ) {
    logger.info('Method Start: getGoogleAuthCredentials');
    const { tokens } = await oauth2Client.getToken(code);
    logger.info(`Obtained access token`);

    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);
    logger.info(`Obtained token info`);

    oauth2Client.setCredentials(tokens);
    logger.info(`Set credentials to oauth2Client`);
    const oauth2 = google.oauth2({
      auth: oauth2Client as any,
      version: 'v2',
    });

    // Fetch user profile details
    const userDetails = await oauth2.userinfo.get();
    logger.info(`Obtained user details`);
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
        'user.id, user.email, user.password, user.userName, user.isVerified, user.isActive',
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
    createdOn: Date;
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
      .select('user.email, user.otp, user.createdOn, ud.userName, user.otpDate')
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
        'userAuth.userId, userAuth.id, userAuth.isBlocked, userAuth.blockedTime, userAuth.attemptedCount, userAuth.masterLoginTypeId, userAuth.updatedOn',
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
