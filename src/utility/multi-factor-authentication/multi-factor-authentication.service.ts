import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserDetails } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as CryptoJS from 'crypto-js';
import {
  IQRGnerateResponse,
  IUserInfo,
} from 'src/interfaces/registration.interface';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';

export interface MfaResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable()
export class MultiFactorAuthenticationService {
  private issuer: string = 'kaynes-mes';
  private numberOfBytes: number = 20;
  constructor(
    @InjectRepository(UserDetails)
    private readonly userDetailsRepository: Repository<UserDetails>,
  ) {}

  public async getOtpSecretById(id: number): Promise<MfaResponse<string>> {
    try {
      const encryptionKey = process.env.CRYPTO_SECRET_KEY;

      const record = await this.userDetailsRepository.findOne({
        where: { id, isActive: true },
      });

      if (!record?.isActive) {
        return {
          message: 'User not found',
          success: false,
        };
      }

      const secret: string = CryptoJS.AES.decrypt(
        record.twoFactorAuthenticationSecret,
        encryptionKey,
      ).toString(CryptoJS.enc.Utf8);

      return {
        data: secret,
        success: true,
      };
    } catch (error) {
      return {
        message: (error as Error).message,
        success: false,
        data: error as string,
      };
    }
  }

  public async getMfaRecordById(id: number): Promise<MfaResponse<UserDetails>> {
    try {
      const record = await this.userDetailsRepository.findOne({
        where: { id, isActive: true },
      });

      if (!record) {
        return {
          message: 'User not found',
          success: false,
        };
      }

      return {
        success: true,
        data: record,
      };
    } catch (error) {
      return {
        message: (error as Error).message,
        success: false,
      };
    }
  }

  public async saveMfaRecord(
    record: IUserInfo,
    logger: {
      info: (msg: string) => void;
      error: (msg: string, ...args: unknown[]) => void;
    },
  ): Promise<UserDetails | undefined> {
    try {
      logger.info('Method start :: saveMfaRecord');
      const encryptionKey = process.env.CRYPTO_SECRET_KEY;
      const { id, secret, code } = record;
      const encryptedSecret = CryptoJS.AES.encrypt(secret, encryptionKey);
      const hashBackupCode = CryptoJS.SHA256(code).toString(CryptoJS.enc.Hex);

      const payload = {
        id,
        twoFactorAuthenticationSecret: encryptedSecret.toString(),
        hashBackupCode, // no column in the entity
        isTwoFactorAuthenticationEnabled: true,
      };
      const userData = await this.userDetailsRepository.save(payload);
      logger.info('Method end :: saveMfaRecord');
      return userData;
    } catch (error) {
      logger.error(
        `Error in saveMfaRecord: ${(error as Error).message}`,
        error,
      );
    }
  }

  public async generateQRcode(email: string): Promise<IQRGnerateResponse> {
    const secretKey: string = generateSecret({ length: this.numberOfBytes });
    const qrUri: string = generateURI({ label: email, issuer: this.issuer, secret: secretKey });
    const qrcode: string = await QRCode.toDataURL(qrUri);
    const data: IQRGnerateResponse = {
      secretKey,
      qrcode,
    };
    return data;
  }

  public async verifyTOTP(secret: string, token: string): Promise<boolean> {
    const result = await verify({ token, secret });
    return result.valid;
  }

  public async generateBackupCode(num: number = 8): Promise<string> {
    const randomBytes = CryptoJS.lib.WordArray.random(num);
    return randomBytes.toString(CryptoJS.enc.Hex);
  }
}
