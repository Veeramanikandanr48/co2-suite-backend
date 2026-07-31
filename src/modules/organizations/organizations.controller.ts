import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  AddOrganizationMemberDto,
  UpdateOrganizationDto,
  UpdateOrganizationMemberDto,
} from 'src/dto/organization.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UtilService } from 'src/utility/util/util.service';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly utilService: UtilService,
  ) {}

  @Post('onboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Onboard Organization (Super Admin only)',
    description:
      'Creates a new Organization and provisions its initial Admin user (roleId: 2). Restricted strictly to Super Admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization onboarded successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to onboard organization' })
  async onboardOrganization(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateOrganizationDto,
  ) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: onboardOrganization');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.organizationsService.onboardOrganization(
        dto,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Organization onboarded successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to onboard organization. Please try again later.',
      );
    } finally {
      logger.info('Method ended: onboardOrganization');
    }
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active organizations' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched organizations',
  })
  async getAllOrganizations(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: getAllOrganizations');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.organizationsService.getAllOrganizations(user);
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organizations',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch organizations. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getAllOrganizations');
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization details by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched organization details',
  })
  async getOrganizationById(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: getOrganizationById');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.organizationsService.getOrganizationById(
        id,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organization details',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch organization. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getOrganizationById');
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization details' })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated organization',
  })
  async updateOrganization(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: updateOrganization');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.organizationsService.updateOrganization(
        id,
        dto,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully updated organization',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to update organization. Please try again later.',
      );
    } finally {
      logger.info('Method ended: updateOrganization');
    }
  }

  @Post(':id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate organization (Super Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully deactivated organization',
  })
  async deactivateOrganization(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: deactivateOrganization');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.organizationsService.deactivateOrganization(
        id,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully deactivated organization',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to deactivate organization. Please try again later.',
      );
    } finally {
      logger.info('Method ended: deactivateOrganization');
    }
  }

  @Post('filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated and filtered organization list' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched organizations',
  })
  async getOrganizationFilterList(
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: getOrganizationFilterList');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.organizationsService.getOrganizationFilterList(
        payload,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organizations',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch organizations. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getOrganizationFilterList');
    }
  }

  @Post(':id/users/filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get paginated and filtered users for an organization',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched organization users',
  })
  async getOrganizationUsersFilterList(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: getOrganizationUsersFilterList');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result =
        await this.organizationsService.getOrganizationUsersFilterList(
          id,
          payload,
          user,
        );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organization users',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to fetch organization users. Please try again later.',
      );
    } finally {
      logger.info('Method ended: getOrganizationUsersFilterList');
    }
  }

  @Post(':id/users')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a new Admin or User member to an organization',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Member user added to organization successfully',
  })
  async addMemberToOrganization(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddOrganizationMemberDto,
  ) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: addMemberToOrganization');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.organizationsService.addMemberToOrganization(
        id,
        dto,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Member added to organization successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to add member. Please try again later.',
      );
    } finally {
      logger.info('Method ended: addMemberToOrganization');
    }
  }

  @Put(':id/users/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization member user details' })
  @ApiParam({ name: 'id', type: Number, description: 'Organization ID' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Member user updated successfully' })
  async updateOrganizationMember(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateOrganizationMemberDto,
  ) {
    const logger = this.utilService.createLogger(
      OrganizationsController.name,
      req,
    );
    logger.info('Method started: updateOrganizationMember');
    try {
      const user = req['user'] as IDecodeUserDetails;
      const result = await this.organizationsService.updateOrganizationMember(
        id,
        userId,
        dto,
        user,
      );
      logger.info('Operation successful');
      return this.utilService.sendSuccessResponse(
        res,
        'Member updated successfully',
        result,
      );
    } catch (error) {
      logger.error('Error occurred', error);
      return this.utilService.sendErrorResponse(
        res,
        'Failed to update member. Please try again later.',
      );
    } finally {
      logger.info('Method ended: updateOrganizationMember');
    }
  }
}
