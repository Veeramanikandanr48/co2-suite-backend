import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto, UpdateFacilityDto } from 'src/dto/facility.dto';
import { Facility } from 'src/entities/facility.entity';

@ApiTags('Facilities')
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new facility' })
  async create(@Body() dto: CreateFacilityDto): Promise<Facility> {
    return this.facilitiesService.createFacility(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active facilities' })
  async findAll(@Query('orgId') orgId?: number): Promise<Facility[]> {
    return this.facilitiesService.getAllFacilities(orgId ? Number(orgId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facility by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Facility> {
    return this.facilitiesService.getFacilityById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update facility' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFacilityDto,
  ): Promise<Facility> {
    return this.facilitiesService.updateFacility(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete facility' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.facilitiesService.deleteFacility(id);
  }
}
