import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from 'src/casl-permission/permission/permission.guard';
import { CheckPermissions } from 'src/casl-permission/casl-ability-factory/casl-ability.factory';
import { Action } from 'src/enums/casl.enum';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationModulesDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.CREATE, 'users'])
  create(@Body() dto: CreateOrganizationDto) {
    return this.orgsService.createOrganization(dto);
  }

  @Get()
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'users'])
  findAll() {
    return this.orgsService.findAll();
  }

  @Get('modules/master')
  getMasterModules() {
    return this.orgsService.getMasterModules();
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.READ, 'users'])
  findOne(@Param('id') id: string) {
    return this.orgsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'users'])
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgsService.updateOrganization(id, dto);
  }

  @Put(':id/modules')
  @UseGuards(PermissionGuard)
  @CheckPermissions([Action.UPDATE, 'users'])
  updateModules(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationModulesDto,
  ) {
    return this.orgsService.updateModules(id, dto);
  }
}
