import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto, UpdateFacilityDto } from 'src/dto/facility.dto';
import { Facility } from 'src/entities/facility.entity';
import { MasterRole } from 'src/enums/casl.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@ApiTags('Facilities')
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new facility (Super Admin & Admin only)' })
  async create(@Req() req: Request, @Body() dto: CreateFacilityDto): Promise<Facility> {
    const user = req['user'] as IDecodeUserDetails;
    if (user?.roleId === MasterRole.USER) {
      throw new ForbiddenException('Regular users cannot create facilities');
    }
    return this.facilitiesService.createFacility(dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active facilities' })
  async findAll(@Query('orgId') orgId?: number): Promise<Facility[]> {
    return this.facilitiesService.getAllFacilities(orgId ? Number(orgId) : undefined);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get facility by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Facility> {
    return this.facilitiesService.getFacilityById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update facility (Super Admin & Admin only)' })
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFacilityDto,
  ): Promise<Facility> {
    const user = req['user'] as IDecodeUserDetails;
    if (user?.roleId === MasterRole.USER) {
      throw new ForbiddenException('Regular users cannot edit facilities');
    }
    return this.facilitiesService.updateFacility(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete facility (Super Admin & Admin only)' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const user = req['user'] as IDecodeUserDetails;
    if (user?.roleId === MasterRole.USER) {
      throw new ForbiddenException('Regular users cannot delete facilities');
    }
    return this.facilitiesService.deleteFacility(id);
  }
}
