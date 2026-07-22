import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { MastersService } from './masters.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IResponse } from 'src/utility/base-interface.interface';
import { UtilService } from 'src/utility/util/util.service';
import { Request, Response } from 'express';

@Controller('masters')
export class MastersController {
  constructor(
    private readonly mastersService: MastersService,
    private readonly utilService: UtilService,
  ) {}

  @Get('getMasterCountries')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
        success: {
          type: 'boolean',
        },
        data: {
          type: 'any',
        },
      },
    },
  })
  async getMasterCountries(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    logger.info('Method Start: getMasterCountries');
    try {
      const masterData = await this.mastersService.getMasterCountries();
      logger.info('Master countries fetched successfully');
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched master countries',
        masterData,
      );
    } catch (error) {
      logger.error(`Error in getMasterCountries: ${error.message}`, error);
      this.utilService.sendErrorResponse(
        res,
        'Error in fetching master countries',
      );
    } finally {
      logger.info('Method end: getMasterCountries');
      res.end();
    }
  }

  @Get('getStatesByCountryId/:countryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
        success: {
          type: 'boolean',
        },
        data: {
          type: 'any',
        },
      },
    },
  })
  async getStatesByCountryId(
    @Req() req: Request,
    @Res() res: Response,
    @Param('countryId') countryId: number,
  ) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    try {
      logger.info('Method Start: getStatesByCountryId');
      const masterData =
        await this.mastersService.getStatesByCountryId(countryId);
      logger.info('States fetched successfully');
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched states by country id',
        masterData,
      );
    } catch (error) {
      logger.error(`Error in getStatesByCountryId: ${error.message}`, error);
      this.utilService.sendErrorResponse(
        res,
        'Error in fetching states by country id',
      );
    } finally {
      logger.info('Method end: getStatesByCountryId');
      res.end();
    }
  }

  @Get('getMasterGenders')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getMasterGenders(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    logger.info('Method Start: getMasterGenders');
    try {
      const masterData = await this.mastersService.getMasterGenders();
      logger.info('Genders fetched successfully');
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched all genders',
        masterData,
      );
    } catch (error) {
      logger.error(`Error in getMasterGenders: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, 'Error in fetching all genders');
    } finally {
      logger.info('Method end: getMasterGenders');
      res.end();
    }
  }

  @Get('getMasterHobbies')
  async getMasterHobbies(@Req() req: Request, @Res() res: Response) {
    const logger = this.utilService.createLogger(MastersController.name, req);
    logger.info('Method Start: getMasterHobbies');
    try {
      const masterData = await this.mastersService.getMasterHobbies();
      logger.info('Hobbies fetched successfully');
      this.utilService.sendSuccessResponse(
        res,
        'Successfully fetched all hobbies',
        masterData,
      );
    } catch (error) {
      logger.error(`Error in getMasterHobbies: ${error.message}`, error);
      this.utilService.sendErrorResponse(res, 'Error in fetching all hobbies');
    } finally {
      logger.info('Method end: getMasterHobbies');
      res.end();
    }
  }
}
