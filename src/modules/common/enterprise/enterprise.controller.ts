import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UtilService } from 'src/utility/util/util.service';
import { EnterpriseService } from './enterprise.service';
import { Roles } from 'src/auth/roles.decorator';
import { MasterRole } from 'src/enums/casl.enum';

@ApiTags('Enterprise Scale Domain')
@Controller('enterprise')
export class EnterpriseController {
  constructor(
    private readonly enterpriseService: EnterpriseService,
    private readonly utilService: UtilService,
  ) {}

  @Get('tenants')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all platform tenants (Super Admin only)' })
  async getTenants(@Res() res: Response) {
    const result = await this.enterpriseService.getTenants();
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched tenants', result);
  }

  @Post('tenants')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provision new tenant (Super Admin only)' })
  async createTenant(@Body() dto: any, @Res() res: Response) {
    const result = await this.enterpriseService.createTenant(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully created tenant', result);
  }

  @Get('api-keys')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get API keys (Admin only)' })
  @ApiQuery({ name: 'organizationId', required: false })
  async getApiKeys(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : undefined;
    const result = await this.enterpriseService.getApiKeys(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched API keys', result);
  }

  @Post('api-keys')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate new API key secret for partner/ERP integrations (Admin only)' })
  async createApiKey(@Body() dto: any, @Res() res: Response) {
    const result = await this.enterpriseService.createApiKey(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully generated API key', result);
  }

  @Get('webhooks')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get registered webhook endpoints (Admin only)' })
  @ApiQuery({ name: 'organizationId', required: false })
  async getWebhooks(@Query('organizationId') orgId: string, @Res() res: Response) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : undefined;
    const result = await this.enterpriseService.getWebhookEndpoints(parsedOrgId);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched webhook endpoints', result);
  }

  @Post('webhooks')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register new webhook endpoint URL (Admin only)' })
  async createWebhook(@Body() dto: any, @Res() res: Response) {
    const result = await this.enterpriseService.createWebhookEndpoint(dto);
    return this.utilService.sendSuccessResponse(res, 'Successfully registered webhook endpoint', result);
  }

  @Get('audit-logs')
  @UseGuards(AuthGuard('jwt'))
  @Roles(MasterRole.ADMIN, MasterRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get append-only platform audit logs (Admin only)' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'entityName', required: false })
  async getAuditLogs(
    @Query('organizationId') orgId: string,
    @Query('entityName') entityName: string,
    @Res() res: Response,
  ) {
    const parsedOrgId = orgId ? parseInt(orgId, 10) : undefined;
    const result = await this.enterpriseService.getAuditLogs(parsedOrgId, entityName);
    return this.utilService.sendSuccessResponse(res, 'Successfully fetched audit logs', result);
  }
}
