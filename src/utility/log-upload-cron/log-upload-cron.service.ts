import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

@Injectable()
export class LogUploadCronService {
  constructor() {}

  private readonly logger = new Logger(LogUploadCronService.name);

  @Cron('0 0 * * 0')
  async handleCorn() {
    const logDirPath = process.env.LOG_PATH;
    if (!logDirPath || !fs.existsSync(logDirPath)) {
      return;
    }
    const files = fs
      .readdirSync(logDirPath)
      .filter((file) => file.startsWith('MES-') && file.endsWith('.log'))
      .sort();

    if (files.length === 0) {
      this.logger.warn('No log files found to compress.');
      return;
    }
    const filesToKeep = files.slice(-4);
    const filesToMove = files.slice(0, -4);

    for (const fileName of filesToMove) {
      const originalPath = path.join(logDirPath, fileName);
      const gzippedPath = `${originalPath}.gz`;

      try {
        //compress the file
        await new Promise((resolve, reject) => {
          const input = fs.createReadStream(originalPath);
          const output = fs.createWriteStream(gzippedPath);
          input.pipe(zlib.createGzip()).pipe(output);
          output.on('finish', () => resolve(void 0));
          output.on('error', reject);
        });

        //delete the local uncompressed file
        fs.unlinkSync(originalPath);
        this.logger.log(`Compressed log file: ${fileName} -> ${gzippedPath}`);
      } catch (error) {
        this.logger.error(`Error compressing log file: ${error.message}`);
      }
    }
    this.logger.log(`Log archiving complete. Kept: ${filesToKeep.join(', ')}`);
  }
}
