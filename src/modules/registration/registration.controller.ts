import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RegistrationService } from './registration.service';
import {
  CreateUserDto,
  ForgotPasswordDto,
  LoginDto,
  ResetMFADto,
  ResetPasswordDto,
  ValidateMFADto,
  VerifyMFADto,
} from 'src/dto/user.dto';
import { UtilService } from 'src/utility/util/util.service';
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginMasterType } from 'src/enums/registration.enum';
import {
  ICreateUser,
  ILoginInfo,
  IUserAuthData,
  IUserInfo,
} from 'src/interfaces/registration.interface';
import { addHours, addDays, isAfter } from 'date-fns';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from 'src/utility/email/email.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MultiFactorAuthenticationService } from 'src/utility/multi-factor-authentication/multi-factor-authentication.service';
import { UserId } from 'src/utility/decorators/userid.decorator';
import { EmailTemplate } from 'src/enums/base.enum';
import { AuthService } from 'src/auth/auth/auth.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import * as crypto from 'crypto';

import { SessionSigningKeyService } from 'src/utility/request-signature/session-signing-key.service';

@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly utilService: UtilService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly mfa: MultiFactorAuthenticationService,
    private readonly authService: AuthService,
    private readonly sessionKeyService: SessionSigningKeyService,
  ) {}

  @Post('register')
  async createUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: CreateUserDto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info(`Method start: Create User`);
    try {
      const isEmailExist =
        await this.registrationService.checkEmailVerifiedExist(data.emailId);
      if (isEmailExist) {
        logger.info('User already exists');
        return this.utilService.sendErrorResponse(res, 'Email already exists');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const newUser = {
        userName: data.userName,
        email: data.emailId,
        password: hashedPassword,
      };
      const savedUser = await this.registrationService.saveUser(newUser);
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
        logger.info(
          `Verification email sent successfully to: ${savedUser.email}`,
        );
      } catch (emailError) {
        logger.error(
          `Failed to send verification email: ${emailError.message}`,
          emailError,
        );
        // Continue with the registration process even if email fails
      }

      logger.info(
        `${RegistrationController.name} | createUser | User created successfully with ID: ${savedUser.id}`,
      );
      return this.utilService.sendSuccessResponse(
        res,
        'User registered successfully. Please check your email for verification.',
      );
    } catch (error) {
      logger.error(`Error in create user: ${error.message}`, error);
      return this.utilService.sendErrorResponse(
        res,
        'Error occurred during registration',
      );
    } finally {
      logger.info(`Method end: Create User`);
    }
  }

  @Post('login')
  async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: LoginDto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method start: login');
    try {
      const loginData = await this.registrationService.login(
        data.emailId,
        LoginMasterType.LOGIN,
      );

      if (!loginData) {
        logger.error(`Method end:: login`, 'Email Not Found');
        this.utilService.sendErrorResponse(res, 'Email Not Found');
        return;
      }
      if (
        loginData.updatedOn &&
        isAfter(new Date(), addHours(new Date(loginData.updatedOn), 24))
      ) {
        loginData.attemptedCount = 0;
        loginData.isBlocked = false;
        loginData.blockedTime = null;
      }
      if (!(await bcrypt.compare(data.password, loginData.password))) {
        loginData.attemptedCount += 1;
        if (loginData.attemptedCount >= 3) {
          loginData.isBlocked = true;
          //time will come form time configuration table
          loginData.blockedTime = addHours(new Date(), 1);
        }
        logger.error(`Method end:: login`, 'Invalid Password');
        this.utilService.sendErrorResponse(res, 'Email or Password is invalid');
        return;
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
          logger.error(`Method end:: login`, errorMessage);
          this.utilService.sendErrorResponse(res, errorMessage);
          return;
        }
      }
      const userAuthPayload = {
        attemptedCount: loginData?.attemptedCount ?? 0,
        userId: loginData.id,
        isBlocked: loginData?.isBlocked ?? false,
        blockedTime: loginData?.blockedTime,
        masterLoginTypeId: LoginMasterType.LOGIN,
      };

      await this.updateUserAuth(userAuthPayload, loginData.id);

      // Fetch user roles from user_roles table
      const userRoles = await this.authService.getUserRoles(loginData.id);
      const primaryRole = userRoles.find((r) => r.isPrimary) ?? userRoles[0];
      const roleIds = userRoles.map((r) => r.roleId);

      // Build JWT payload — use roleKey for authorization, not integer IDs
      const jwtPayload: Omit<IDecodeUserDetails, 'iat' | 'exp'> = {
        userId: loginData.id,
        email: loginData.email,
        roleKey: primaryRole?.roleKey ?? 'MEMBER',
        roleIds,
        currentRoleId: primaryRole?.roleId ?? null,
        permissionsVersion: primaryRole?.permissionsVersion ?? 1,
      };

      const accessToken = this.jwtService.sign(jwtPayload, { expiresIn: '15m' });

      // Set HttpOnly access_token cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });

      // Generate opaque refresh token and persist as a session
      const rawRefreshToken = crypto.randomBytes(64).toString('hex');
      const refreshExpiresAt = addDays(new Date(), 7);
      await this.authService.saveSession(
        loginData.id,
        rawRefreshToken,
        refreshExpiresAt,
        req.ip,
        req.headers['user-agent'],
      );

      // Create session signing key for HMAC request signing (7 days TTL matching session)
      await this.sessionKeyService.createSigningKey(loginData.id, 7 * 24 * 3600);

      // Fetch permissions for the primary role to include in the response
      const permissions = await this.authService.getAllUserPermission(
        primaryRole?.roleId,
      );

      logger.info('Method end :: login');

      const responseData = {
        isTwoFactorAuthenticationEnabled: loginData.isTwoFactorAuthenticationEnabled,
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: loginData.id,
          userName: loginData.userName,
          email: loginData.email,
          roleKey: primaryRole?.roleKey ?? 'MEMBER',
          roleName: primaryRole?.roleName ?? '',
          roleIds,
          currentRoleId: primaryRole?.roleId ?? null,
        },
        roles: userRoles,
        permissions,
      };
      this.utilService.sendSuccessResponse(res, 'Login successful', responseData);
    } catch (error) {
      logger.error(`Error in login: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: login');
      res.end();
    }
  }

  @Post('googleLogin')
  async googleLogin(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: { accessToken: string },
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info(`Method Start: Google SSO Login`);
    try {
      if (!data || !data.accessToken) {
        logger.error('Invalid request: accessToken is missing');
        return this.utilService.sendErrorResponse(
          res,
          'AccessToken is required',
        );
      }
      // Step 1: Get OAuth2 Client
      const oauth2Client = this.utilService.getOAuth2Client();
      logger.info('Obtained OAuth2 Client instance');

      logger.info('Obtaining Google Auth Credentials');
      // Step 2: Get Google Auth Credentials
      const { tokens, userProfile, tokenInfo } =
        await this.registrationService.getGoogleAuthCredentials(
          oauth2Client,
          data.accessToken,
          logger,
        );
      logger.info('Attempting SSO login');
      const loginData = await this.registrationService.ssoLogin(
        tokenInfo.sub,
        userProfile.email,
      );
      let userDetails;
      if (!loginData) {
        logger.info('User not found, creating new user');
        const newUser: ICreateUser = {
          userName: userProfile.name,
          email: userProfile.email,
          googleSubId: tokenInfo.sub,
          isVerified: true,
        };

        userDetails = await this.registrationService.saveUser(newUser);
        logger.info('New user created');
      }

      const userAuthPayload = {
        attemptedCount: 0,
        userId: !loginData ? userDetails.id : loginData.id,
        isBlocked: false,
        blockedTime: null,
        masterLoginTypeId: LoginMasterType.LOGIN,
      };

      logger.info('Updating user authentication');
      await this.updateUserAuth(userAuthPayload);

      const payload = {
        email: !loginData ? userDetails.email : loginData.email,
        id: !loginData ? userDetails.id : loginData.id,
        userName: !loginData ? userDetails.userName : loginData.userName,
      };

      const accessToken = this.jwtService.sign(payload);

      const responseData = {
        email: !loginData ? userDetails.email : loginData.email,
        userName: !loginData ? userDetails.userName : loginData.userName,
        id: !loginData ? userDetails.id : loginData.id,
        token: accessToken,
        profileImageUrl: !loginData
          ? userDetails.profileImageKey || null
          : loginData.profileImageKey || null,
      };
      logger.info('SSO Login successful');
      //step 3: save the user profile in the database
      return this.utilService.sendSuccessResponse(
        res,
        'SSO Login Successful',
        responseData,
      );
    } catch (error) {
      logger.error(`Error while loggin in: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, 'Login Unsuccessfull');
    } finally {
      logger.info(`Method end: Google SSO Login`);
      res.end();
    }
  }

  async updateUserAuth(userAuthPayload: IUserAuthData, uAuthId: number = 0) {
    if (uAuthId) {
      return await this.registrationService.updateUserAuth(
        userAuthPayload.userId,
        userAuthPayload.attemptedCount,
        userAuthPayload.isBlocked,
        userAuthPayload.blockedTime,
      );
    } else {
      return await this.registrationService.saveUserAuth(userAuthPayload);
    }
  }

  // 2FA Authentication Implementation

  @ApiTags('MFA')
  @Post('mfa/generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async generateQRCode(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    try {
      logger.info('Method start: generateQRCode');
      const user = req['user'];
      const data = await this.mfa.generateQRcode(user.email.toString());
      logger.info('Method end :: generateQRCode');
      return this.utilService.sendSuccessResponse(
        res,
        'QR code generated successfully',
        data,
      );
    } catch (error) {
      logger.error(`Error in generateQRCode: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, 'Error while genrating QR code');
    } finally {
      logger.info(`Method end: generateQRCode`);
      res.end();
    }
  }

  @ApiTags('MFA')
  @Post('mfa/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async verifyCode(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: VerifyMFADto,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    try {
      logger.info('Method start :: verifyCode');
      const user = req['user'];
      const isValid = await this.mfa.verifyTOTP(data.secret, data.code);
      const payload: IUserInfo = {
        id: user.id,
        secret: data.secret,
        code: data.code,
      };
      await this.mfa.saveMfaRecord(payload, logger);
      logger.info(`Successfully saved MFA record for user: ${user.id}`);

      // Generate User Response Data
      const responseData = await this.generateUserResponseData(
        user.id,
        isValid,
        logger,
      );

      return this.utilService.sendSuccessResponse(
        res,
        'Code verified successfully',
        responseData,
      );
    } catch (error) {
      logger.error(`Error in verifyCode: ${error.message}`, error);
      return this.utilService.sendErrorResponse(
        res,
        `Error occured while verifying the code`,
      );
    } finally {
      logger.info('Method end :: verifyCode');
      res.end();
    }
  }

  @ApiTags('MFA')
  @Post('mfa/validate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async validateMFA(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: ValidateMFADto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    try {
      logger.info('Method start :: validateMFA');
      const user = req['user'];
      const secret = await this.mfa.getOtpSecretById(user.id.toString());
      logger.info(`Successfully fetched secret for user: ${user.id}`);

      const isValid = await this.mfa.verifyTOTP(secret?.data, data.code);
      logger.info(`isValid:: ${isValid}`);

      if (!isValid) {
        logger.error('Method end : validateMFA');
        return this.utilService.sendErrorResponse(res, 'Invalid Code');
      }

      const responseData = await this.generateUserResponseData(
        user.id,
        isValid,
        logger,
      );
      return this.utilService.sendSuccessResponse(
        res,
        'Code verified successfully',
        responseData,
      );
    } catch (error) {
      logger.error(`Error in validateMFA: ${error.message}`, error);
      return this.utilService.sendErrorResponse(
        res,
        'Error while validating MFA',
      );
    } finally {
      logger.info(`Method end: validateMFA`);
      res.end();
    }
  }

  // 2fa reset implementation
  @ApiTags('MFA')
  @Post('mfa/reset')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async resetMFA(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: ResetMFADto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    try {
      logger.info('Method start :: resetMFA');
      const user = req['user'];

      // Verify the new MFA code
      const isNewCodeValid = this.mfa.verifyTOTP(data.newSecret, data.newCode);
      if (!isNewCodeValid) {
        logger.error('Invalid new MFA code');
        return this.utilService.sendErrorResponse(res, 'Invalid new MFA code');
      }

      // Update the MFA secret
      const payload: IUserInfo = {
        id: user.id,
        secret: data.newSecret,
        code: data.newCode,
      };

      await this.mfa.saveMfaRecord(payload, logger);
      logger.info(`Successfully reset MFA for user: ${user.id}`);
      return this.utilService.sendSuccessResponse(
        res,
        `MFA reset successfully`,
      );
    } catch (error) {
      logger.error(`Error in resetMFA: ${error.message}`, error);
      return this.utilService.sendErrorResponse(
        res,
        'Error occured while resetting MFA',
      );
    } finally {
      logger.info('Method end :: resetMFA');
      res.end();
    }
  }

  @Post('verify-email/:token')
  async verifyEmail(
    @Req() req: Request,
    @Res() res: Response,
    @Param('token') token: string,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.registrationService.checkEmailExist(
        payload.email,
      );
      if (!user) {
        logger.error(`Error in verifyEmail: Email Not Found`);
        return this.utilService.sendErrorResponse(res, 'Email Not Found');
      }
      await this.registrationService.updateIsVerified(payload.id);
      logger.info(`Email verified successfully`);
      this.utilService.sendSuccessResponse(res, 'Email verified successfully');
      return;
    } catch (error) {
      logger.error(`Error in verifyEmail: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, 'Error while verifying email');
    }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: ForgotPasswordDto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    try {
      let authenticationDetails: IUserAuthData;
      const userData = await this.registrationService.checkEmailExist(
        data.emailId,
      );

      if (!userData) {
        logger.error(`Method end :: forgotPassword | Email Not Found `);
        return this.utilService.sendErrorResponse(res, 'Email Not Found');
      }

      let authDetails =
        await this.registrationService.checkForgotAuthenticationExist(
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
        authDetails = await this.registrationService.saveUserAuth(
          authenticationDetails,
        );
      }

      if (
        authDetails.updatedOn &&
        isAfter(new Date(), addHours(new Date(authDetails.updatedOn), 24))
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
          logger.error(`Method end :: forgotPassword | Account is blocked`);
          return this.utilService.sendErrorResponse(
            res,
            'Account is blocked. Please try again later.',
          );
        }
      }

      authenticationDetails.attemptedCount += 1;
      if (authenticationDetails.attemptedCount >= 3) {
        authenticationDetails.isBlocked = true;
        // Block time configuration: 1 hour
        authenticationDetails.blockedTime = addHours(new Date(), 1);
      }

      await this.updateUserAuth(authenticationDetails, authDetails.id);

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

      logger.info(
        `Password reset email sent successfully to: ${userData.email}`,
      );
      this.utilService.sendSuccessResponse(
        res,
        'Password reset email sent successfully',
      );
    } catch (error) {
      logger.error(`Error in forgotPassword: ${error.message}`, error);
      this.utilService.sendErrorResponse(
        res,
        'Error while sending forgot password email',
      );
    }
  }

  @Post('reset-password/:token')
  async resetPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Param('token') token: string,
    @Body() data: ResetPasswordDto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.registrationService.checkEmailExist(
        payload.email,
      );
      if (!user) {
        logger.error(`Method end :: resetPassword | Invalid or expired token`);
        return this.utilService.sendErrorResponse(
          res,
          'Invalid or expired token',
        );
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      await this.registrationService.updateUserPassword(
        user.id,
        hashedPassword,
      );

      logger.info(`Password reset successfully for user: ${user.email}`);
      this.utilService.sendSuccessResponse(res, 'Password reset successful');
    } catch (error) {
      logger.error(`Error in resetPassword: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, 'Error while resetting password');
    }
  }

  // ─── IAM / Session Endpoints ───────────────────────────────────────────────

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(RegistrationController.name, req);
    logger.info('Method start :: getMe');
    try {
      const jwtUser = req['user'] as IDecodeUserDetails;
      const userDetails = await this.registrationService.getUserDetailsId(
        jwtUser.userId.toString(),
      );
      const userRoles = await this.authService.getUserRoles(jwtUser.userId);
      const activeRole =
        userRoles.find((r) => r.roleId === jwtUser.currentRoleId) ??
        userRoles.find((r) => r.isPrimary) ??
        userRoles[0];

      const permissions = await this.authService.getAllUserPermission(
        activeRole?.roleId,
      );

      const responseData = {
        user: {
          id: userDetails.id,
          userName: userDetails.userName,
          email: userDetails.email,
          roleKey: activeRole?.roleKey ?? 'MEMBER',
          roleName: activeRole?.roleName ?? '',
          roleIds: userRoles.map((r) => r.roleId),
          currentRoleId: activeRole?.roleId ?? null,
        },
        roles: userRoles,
        permissions,
      };

      return this.utilService.sendSuccessResponse(
        res,
        'Profile and permissions fetched successfully',
        responseData,
      );
    } catch (error) {
      logger.error(`Error in getMe: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { refreshToken: string; roleId?: number },
  ) {
    const logger = this.utilService.createLogger(RegistrationController.name, req);
    logger.info('Method start :: refreshToken');
    try {
      if (!body.refreshToken) {
        return this.utilService.sendErrorResponse(res, 'Refresh token is required');
      }

      const session = await this.authService.findValidSession(body.refreshToken);
      if (!session || isAfter(new Date(), session.expiresAt)) {
        return this.utilService.sendErrorResponse(res, 'Invalid or expired refresh token');
      }

      // Rotate refresh token
      await this.authService.revokeSession(body.refreshToken, 'rotation');
      const newRefreshToken = crypto.randomBytes(64).toString('hex');
      const refreshExpiresAt = addDays(new Date(), 7);

      await this.authService.saveSession(
        session.userId,
        newRefreshToken,
        refreshExpiresAt,
        req.ip,
        req.headers['user-agent'],
      );

      const userRoles = await this.authService.getUserRoles(session.userId);
      const selectedRoleId = body.roleId ?? userRoles.find((r) => r.isPrimary)?.roleId ?? userRoles[0]?.roleId;
      const selectedRole = userRoles.find((r) => r.roleId === selectedRoleId) ?? userRoles[0];

      const userDetails = await this.registrationService.getUserDetailsId(
        session.userId.toString(),
      );

      const jwtPayload: Omit<IDecodeUserDetails, 'iat' | 'exp'> = {
        userId: session.userId,
        email: userDetails.email,
        roleKey: selectedRole?.roleKey ?? 'MEMBER',
        roleIds: userRoles.map((r) => r.roleId),
        currentRoleId: selectedRoleId,
        permissionsVersion: selectedRole?.permissionsVersion ?? 1,
      };

      const accessToken = this.jwtService.sign(jwtPayload, { expiresIn: '15m' });
      const permissions = await this.authService.getAllUserPermission(selectedRoleId);

      // Set updated HttpOnly access_token cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });

      // Issue rotated session signing key
      const newSigningKey = await this.sessionKeyService.createSigningKey(session.userId, 7 * 24 * 3600);

      return this.utilService.sendSuccessResponse(res, 'Token refreshed successfully', {
        accessToken,
        refreshToken: newRefreshToken,
        signingKey: newSigningKey,
        currentRoleId: selectedRoleId,
        permissions,
      });
    } catch (error) {
      logger.error(`Error in refreshToken: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Get('session-key')
  @UseGuards(AuthGuard('jwt'))
  async getSessionKey(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(RegistrationController.name, req);
    try {
      const jwtUser = req['user'] as IDecodeUserDetails;
      let signingKey = await this.sessionKeyService.getSigningKey(jwtUser.userId);
      if (!signingKey) {
        signingKey = await this.sessionKeyService.createSigningKey(jwtUser.userId, 7 * 24 * 3600);
      }
      return this.utilService.sendSuccessResponse(res, 'Session key retrieved', { signingKey });
    } catch (error) {
      logger.error(`Error in getSessionKey: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res() res: Response, @Body() body?: { refreshToken?: string }) {
    const logger = this.utilService.createLogger(RegistrationController.name, req);
    logger.info('Method start :: logout');
    try {
      const jwtUser = req['user'] as IDecodeUserDetails;
      if (body?.refreshToken) {
        await this.authService.revokeSession(body.refreshToken, 'logout');
      } else {
        await this.authService.revokeAllUserSessions(jwtUser.userId);
      }
      await this.sessionKeyService.revokeSigningKey(jwtUser.userId);
      res.clearCookie('access_token', { path: '/' });
      return this.utilService.sendSuccessResponse(res, 'Logged out successfully');
    } catch (error) {
      logger.error(`Error in logout: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  async getSessions(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(RegistrationController.name, req);
    logger.info('Method start :: getSessions');
    try {
      const jwtUser = req['user'] as IDecodeUserDetails;
      const sessions = await this.authService.getUserSessions(jwtUser.userId);
      return this.utilService.sendSuccessResponse(res, 'Active sessions fetched', sessions);
    } catch (error) {
      logger.error(`Error in getSessions: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }

  @Delete('sessions/:id')
  @UseGuards(AuthGuard('jwt'))
  async revokeSession(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) sessionId: number,
  ) {
    const logger = this.utilService.createLogger(RegistrationController.name, req);
    logger.info(`Method start :: revokeSession #${sessionId}`);
    try {
      await this.authService.revokeSessionById(sessionId, 'admin');
      return this.utilService.sendSuccessResponse(res, 'Session revoked successfully');
    } catch (error) {
      logger.error(`Error in revokeSession: ${error.message}`, error);
      return this.utilService.sendErrorResponse(res, error.message);
    }
  }


  private async generateUserResponseData(
    userId: number,
    isValid: boolean,
    logger: { info: (msg: string) => void },
    _sessionId?: string,
  ) {
    // Fetch User Details
    const userDetails = await this.registrationService.getUserDetailsId(
      userId.toString(),
    );
    logger.info(`Successfully fetched user details for user: ${userId}`);

    const payload = {
      email: userDetails.email,
      id: userDetails.id,
      userName: userDetails.userName,
    };
    // Generate Access Token
    const accessToken = this.jwtService.sign(payload);
    logger.info(`Successfully generated access token for user: ${userId}`);

    return {
      id: userId,
      email: userDetails.email,
      userName: userDetails.userName,
      token: accessToken,
      // sessionId: sessionId,
      isValid: isValid,
      profileImageUrl: userDetails.profileImageKey || null,
    };
  }
}
