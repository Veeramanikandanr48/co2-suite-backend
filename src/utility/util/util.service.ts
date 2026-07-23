import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import sharp from 'sharp';
import { Logger } from 'winston';
import { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  ICommonListPayload,
  ICommonSortFieldObject,
} from '../base-interface.interface';
import { DataSource, QueryRunner } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class UtilService {
  private oauth2Client: OAuth2Client;
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  /**
   * Creates a logger with custom context and request metadata.
   *
   * @param context - The context (module/service name) for the logger.
   * @param req - The optional Express request object to extract metadata.
   * @returns A winston logger instance.
   */
  createLogger(context: string, req?: Request) {
    const correlationId =
      (req?.headers?.['x-correlation-id'] as string) || uuidv4();
    const userId = req?.['user']?.userId || req?.['user']?.id || 'ANONYMOUS';

    return {
      info: (message: string, meta: Record<string, unknown> = {}) => {
        this.logger.info(message, {
          context,
          correlationId,
          userId,
          path: req?.originalUrl,
          method: req?.method,
          ...meta,
        });
      },
      error: (
        message: string,
        error?: unknown,
        meta: Record<string, unknown> = {},
      ) => {
        this.logger.error(message, {
          context,
          correlationId,
          userId,
          path: req?.originalUrl,
          method: req?.method,
          stack: error instanceof Error ? error.stack : undefined,
          ...meta,
        });
      },
      warn: (message: string, meta: Record<string, unknown> = {}) => {
        this.logger.warn(message, {
          context,
          correlationId,
          userId,
          path: req?.originalUrl,
          method: req?.method,
          ...meta,
        });
      },
    };
  }

  /**
   * Compresses an image file buffer.
   *
   * @param fileBuffer - The buffer containing the image file.
   * @returns A promise that resolves to the compressed image buffer.
   */
  async compressImage(fileBuffer: Buffer): Promise<Buffer> {
    return sharp(fileBuffer).resize(300).jpeg({ quality: 60 }).toBuffer();
  }

  sendSuccessResponse(res: Response, message: string, data?: unknown) {
    return res.status(HttpStatus.OK).json({
      message,
      data,
      success: true,
    });
  }

  sendFailureResponse(res: Response, message: string, data?: unknown) {
    return res.status(HttpStatus.OK).json({
      message,
      data,
      success: false,
    });
  }

  sendErrorResponse(res: Response, message: string) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message,
      success: false,
    });
  }

  /**
   * Generates a random OTP of a given length.
   * @param length - The length of the OTP.
   * @returns A string representing the OTP.
   */
  generateOtp(length: number = 6): string {
    return Math.floor(100000 + Math.random() * 900000)
      .toString()
      .slice(0, length);
  }

  /**
   * Generates a random password of a given length with a specified character set.
   * @param length - The length of the password.
   * @param characters - The character set to use for the password.
   * @returns A string representing the password.
   */
  generateRandomPassword(
    length: number = 8,
    characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~',
  ): string {
    return Array.from(
      { length },
      () => characters[Math.floor(Math.random() * characters.length)],
    ).join('');
  }

  processListPayload = async (
    payload: ICommonListPayload,
    tableName: string,
    tableSortCheck: string[],
    sortFieldObject: ICommonSortFieldObject,
    defaultLimit: number,
    defaultSortField: string,
  ): Promise<ICommonListPayload> => {
    const {
      offSet: rawOffset,
      limit: rawLimit,
      sortField: rawSortField,
      sortOrder,
    } = payload;

    const sortCheck: string[] = tableSortCheck;
    const checkSort: boolean = sortCheck?.includes(rawSortField);
    const sortField = !checkSort
      ? `${tableName}.${defaultSortField}`
      : sortFieldObject[rawSortField];
    const limit = !rawLimit ? defaultLimit : rawLimit;
    const offSet = !rawOffset ? 0 : rawOffset * limit;
    return { offSet, limit, sortField, sortOrder };
  };

  generateUniqueId(): string {
    return uuidv4();
  }

  async connectQueryRunner(): Promise<QueryRunner> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    // await queryRunner.startTransaction();
    return queryRunner;
  }

  getOAuth2Client() {
    return this.oauth2Client;
  }
}
