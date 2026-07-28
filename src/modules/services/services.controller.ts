import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ServicesService } from './services.service';
import { AssignServicesDto } from 'src/dto/service.dto';
import { UtilService } from 'src/utility/util/util.service';
import { MasterRole } from 'src/enums/casl.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@ApiTags('Services')
@Controller()
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly utilService: UtilService,
  ) {}

  @Get('services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available master services' })
  async getAllServices(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getAllServices');
    try {
      const result = await this.servicesService.getAllServices();
      this.utilService.sendSuccessResponse(res, 'Successfully fetched services', result);
    } catch (error) {
      logger.error(`Error in getAllServices: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getAllServices');
      res.end();
    }
  }

  @Get('organizations/:id/services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get services subscribed by an organization' })
  async getOrgServices(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: getOrgServices');
    try {
      const user = req['user'] as IDecodeUserDetails;

      // Super Admin can view any org; Admin and User can only view their own org
      const isSuperAdmin = user?.roleId === MasterRole.SUPER_ADMIN;
      const isSameOrg = Number(user?.organizationId) === Number(id);

      if (!isSuperAdmin && !isSameOrg) {
        throw new ForbiddenException('Access denied');
      }

      const result = await this.servicesService.getOrgServices(id);
      this.utilService.sendSuccessResponse(res, 'Successfully fetched organization services', result);
    } catch (error) {
      logger.error(`Error in getOrgServices: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: getOrgServices');
      res.end();
    }
  }

  @Post('organizations/:id/services')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign services to an organization (Super Admin only)' })
  async assignServices(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @Body() dto: AssignServicesDto,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: assignServices');
    try {
      const user = req['user'] as IDecodeUserDetails;

      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin can assign services to organizations');
      }

      const result = await this.servicesService.assignServices(id, dto, user.id);
      this.utilService.sendSuccessResponse(res, 'Services assigned successfully', result);
    } catch (error) {
      logger.error(`Error in assignServices: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: assignServices');
      res.end();
    }
  }

  @Delete('organizations/:id/services/:serviceId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a service from an organization (Super Admin only)' })
  async removeOrgService(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: number,
    @Param('serviceId') serviceId: number,
  ) {
    const logger = this.utilService.createLogger(ServicesController.name, req);
    logger.info('Method Start: removeOrgService');
    try {
      const user = req['user'] as IDecodeUserDetails;

      if (user?.roleId !== MasterRole.SUPER_ADMIN && user?.id !== 1) {
        throw new ForbiddenException('Only Super Admin can remove services from organizations');
      }

      const result = await this.servicesService.removeOrgService(id, serviceId);
      this.utilService.sendSuccessResponse(res, result.message, null);
    } catch (error) {
      logger.error(`Error in removeOrgService: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, error.message);
    } finally {
      logger.info('Method end: removeOrgService');
      res.end();
    }
  }
}
