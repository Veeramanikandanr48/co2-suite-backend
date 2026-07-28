import {
  Body,
  Controller,
  Param,
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
import { addHours, isAfter } from 'date-fns';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from 'src/utility/email/email.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MultiFactorAuthenticationService } from 'src/utility/multi-factor-authentication/multi-factor-authentication.service';
import { UserId } from 'src/utility/decorators/userid.decorator';
import { EmailTemplate } from 'src/enums/base.enum';

@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly utilService: UtilService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly mfa: MultiFactorAuthenticationService,
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
        roleId: data.roleId || 3,
        firstName: data.firstName || data.userName,
        lastName: data.lastName || undefined,
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

      const payload = {
        email: loginData.email,
        id: loginData.id,
        userName: loginData.userName,
        roleId: loginData.roleId || 3,
        organizationId: loginData.organizationId || null,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '5h' });
      logger.info('Method end :: login');

      const responseData = {
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
      this.utilService.sendSuccessResponse(
        res,
        'Login successfull',
        responseData,
      );
      logger.info('Method end: login');
      res.end();
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
