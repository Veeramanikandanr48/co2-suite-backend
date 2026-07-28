import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, AddOrganizationMemberDto } from 'src/dto/organization.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UtilService } from 'src/utility/util/util.service';
import { MasterRole } from 'src/enums/casl.enum';
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
  async onboardOrganization(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CreateOrganizationDto,
  ) {
    const logger = this.utilService.createLogger(OrganizationsController.name, req);
    logger.info('Method Start: onboardOrganization');
    try {
      const user = req['user'] as IDecodeUserDetails;

      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException(
          'Only Super Admin can onboard organizations and create organization Admins',
        );
      }

      const result = await this.organizationsService.onboardOrganization(
        dto,
        user.id,
      );

      logger.info(
        `Organization onboarded successfully: ID ${result.organization.id}, Admin ID ${result.adminUser.id}`,
      );
      this.utilService.sendSuccessResponse(
        res,
        'Organization onboarded successfully with Admin user',
        result,
      );
    } catch (error) {
      logger.error(`Error in onboardOrganization: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: onboardOrganization');
      res.end();
    }
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active organizations' })
  async getAllOrganizations(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(OrganizationsController.name, req);
    logger.info('Method Start: getAllOrganizations');
    try {
      const orgs = await this.organizationsService.getAllOrganizations();
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organizations',
        orgs,
      );
    } catch (error) {
      logger.error(`Error in getAllOrganizations: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getAllOrganizations');
      res.end();
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization details by ID' })
  async getOrganizationById(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    const logger = this.utilService.createLogger(OrganizationsController.name, req);
    logger.info('Method Start: getOrganizationById');
    try {
      const org = await this.organizationsService.getOrganizationById(id);
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organization details',
        org,
      );
    } catch (error) {
      logger.error(`Error in getOrganizationById: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getOrganizationById');
      res.end();
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization details' })
  async updateOrganization(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @Body() body: any,
  ) {
    const logger = this.utilService.createLogger(OrganizationsController.name, req);
    logger.info('Method Start: updateOrganization');
    try {
      const updated = await this.organizationsService.updateOrganization(id, body);
      this.utilService.sendSuccessResponse(
        res,
        'Successfully updated organization',
        updated,
      );
    } catch (error) {
      logger.error(`Error in updateOrganization: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: updateOrganization');
      res.end();
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate organization (Super Admin only)' })
  async deleteOrganization(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    const logger = this.utilService.createLogger(OrganizationsController.name, req);
    logger.info('Method Start: deleteOrganization');
    try {
      const user = req['user'] as IDecodeUserDetails;

      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin can deactivate organizations');
      }

      const result = await this.organizationsService.deleteOrganization(id);
      this.utilService.sendSuccessResponse(
        res,
        'Successfully deactivated organization',
        result,
      );
    } catch (error) {
      logger.error(`Error in deleteOrganization: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: deleteOrganization');
      res.end();
    }
  }

  @Post('filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated and filtered organization list' })
  async getOrganizationFilterList(
    @Req() req: Request,
    @Res() res: Response,
    @Body() payload: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(OrganizationsController.name, req);
    logger.info('Method Start: getOrganizationFilterList');
    try {
      const result = await this.organizationsService.getOrganizationFilterList(payload);
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organizations',
        result,
      );
    } catch (error) {
      logger.error(`Error in getOrganizationFilterList: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getOrganizationFilterList');
      res.end();
    }
  }

  @Post(':id/users/filter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated and filtered users for an organization' })
  async getOrganizationUsersFilterList(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @Body() payload: CommonListPayloadDto,
  ) {
    const logger = this.utilService.createLogger(OrganizationsController.name, req);
    logger.info('Method Start: getOrganizationUsersFilterList');
    try {
      const result = await this.organizationsService.getOrganizationUsersFilterList(id, payload);
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched organization users',
        result,
      );
    } catch (error) {
      logger.error(`Error in getOrganizationUsersFilterList: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getOrganizationUsersFilterList');
      res.end();
    }
  }

  @Post(':id/users')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new Admin or User member to an organization' })
  async addMemberToOrganization(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @Body() dto: AddOrganizationMemberDto,
  ) {
    const logger = this.utilService.createLogger(OrganizationsController.name, req);
    logger.info('Method Start: addMemberToOrganization');
    try {
      const user = req['user'] as IDecodeUserDetails;

      if (user?.roleId !== MasterRole.SUPER_ADMIN && (user?.roleId !== MasterRole.ADMIN || Number(user?.organizationId) !== Number(id))) {
        throw new ForbiddenException('Only Organization Admin or Super Admin can add members to this organization');
      }

      const result = await this.organizationsService.addMemberToOrganization(id, dto, user.id);
      this.utilService.sendSuccessResponse(
        res,
        'Member user added to organization successfully',
        result,
      );
    } catch (error) {
      logger.error(`Error in addMemberToOrganization: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: addMemberToOrganization');
      res.end();
    }
  }
}
