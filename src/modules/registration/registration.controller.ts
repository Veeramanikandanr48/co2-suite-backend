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
  GoogleLoginDto,
  LoginDto,
  ResetMFADto,
  ResetPasswordDto,
  ValidateMFADto,
  VerifyMFADto,
} from 'src/dto/user.dto';
import { UtilService } from 'src/utility/util/util.service';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserId } from 'src/utility/decorators/userid.decorator';

@ApiTags('Registration')
@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly utilService: UtilService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 200, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Registration failed' })
  async createUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: CreateUserDto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method started: createUser');
    try {
      const result = await this.registrationService.registerUser(data);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        result.message,
        result.user,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Registration failed. Please try again later.',
      );
    } finally {
      logger.info('Method ended: createUser');
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Login failed' })
  async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: LoginDto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method started: login');
    try {
      const result = await this.registrationService.loginUser(
        data.emailId,
        data.password,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Login successful',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Invalid credentials. Please try again.',
      );
    } finally {
      logger.info('Method ended: login');
    }
  }

  @Post('googleLogin')
  @ApiOperation({ summary: 'Login with Google SSO' })
  @ApiResponse({ status: 200, description: 'SSO Login successful' })
  @ApiResponse({ status: 400, description: 'SSO Login failed' })
  async googleLogin(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: GoogleLoginDto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method started: googleLogin');
    try {
      const result = await this.registrationService.googleLogin(
        data.accessToken,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'SSO login successful',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'SSO login failed. Please try again.',
      );
    } finally {
      logger.info('Method ended: googleLogin');
    }
  }

  @Post('mfa/generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate MFA QR code' })
  @ApiResponse({ status: 200, description: 'QR code generated successfully' })
  async generateQRCode(
    @Req() req: Request,
    @Res() res: Response,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method started: generateQRCode');
    try {
      const result = await this.registrationService.generateQRCode(userId);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'QR code generated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to generate QR code.',
      );
    } finally {
      logger.info('Method ended: generateQRCode');
    }
  }

  @Post('mfa/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
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
    logger.info('Method started: verifyCode');
    try {
      const result = await this.registrationService.verifyMfaCode(userId, data);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Code verified successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to verify the code.',
      );
    } finally {
      logger.info('Method ended: verifyCode');
    }
  }

  @Post('mfa/validate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate MFA code' })
  @ApiResponse({ status: 200, description: 'Code validated successfully' })
  async validateMFA(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: ValidateMFADto,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method started: validateMFA');
    try {
      const result = await this.registrationService.validateMfaCode(
        userId,
        data,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Code validated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Invalid code.');
    } finally {
      logger.info('Method ended: validateMFA');
    }
  }

  @Post('mfa/reset')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset MFA code' })
  @ApiResponse({ status: 200, description: 'MFA reset successfully' })
  async resetMFA(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: ResetMFADto,
    @UserId() userId: number,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method started: resetMFA');
    try {
      const result = await this.registrationService.resetMfaCode(userId, data);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'MFA reset successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(res, 'Failed to reset MFA.');
    } finally {
      logger.info('Method ended: resetMFA');
    }
  }

  @Post('verify-email/:token')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiParam({
    name: 'token',
    type: String,
    description: 'Email verification token',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(
    @Req() req: Request,
    @Res() res: Response,
    @Param('token') token: string,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method started: verifyEmail');
    try {
      await this.registrationService.verifyEmailToken(token);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Email verified successfully',
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Invalid or expired verification token.',
      );
    } finally {
      logger.info('Method ended: verifyEmail');
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send forgot password email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
  })
  async forgotPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: ForgotPasswordDto,
  ) {
    const logger = this.utilService.createLogger(
      RegistrationController.name,
      req,
    );
    logger.info('Method started: forgotPassword');
    try {
      const result = await this.registrationService.forgotPassword(
        data.emailId,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(res, result.message);
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to send password reset email.',
      );
    } finally {
      logger.info('Method ended: forgotPassword');
    }
  }

  @Post('reset-password/:token')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiParam({
    name: 'token',
    type: String,
    description: 'Password reset token',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
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
    logger.info('Method started: resetPassword');
    try {
      await this.registrationService.resetPassword(token, data.password);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Password reset successful',
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to reset password. Please try again.',
      );
    } finally {
      logger.info('Method ended: resetPassword');
    }
  }
}
