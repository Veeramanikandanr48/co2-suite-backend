import { Request } from 'express';

export type FileFilterCallback = (
  error: Error | null,
  acceptFile: boolean,
) => void;

interface UploadedFileParams {
  originalname: string;
}

export const imageFileFilter = (
  req: Request & {
    logger?: {
      info: (msg: string) => void;
      warn: (msg: string) => void;
      error: (msg: string, ...args: unknown[]) => void;
    };
  },
  file: UploadedFileParams,
  callback: FileFilterCallback,
  allowedFileTypes: RegExp,
  fileErrorMessage: string,
): void => {
  const logger = req.logger || console;
  logger.info('Starting imageFileFilter');

  const isValidFileType = allowedFileTypes.test(file.originalname);

  if (!isValidFileType) {
    logger.warn(`Invalid file type: ${file.originalname}`);
    const error = new Error(fileErrorMessage);
    handleFilterError(req, error, callback, logger);
    return;
  }

  logger.info(`Valid file type: ${file.originalname}`);
  callback(null, true);
  logger.info('Finished imageFileFilter');
};

const handleFilterError = (
  req: Request & {
    res?: { status: (code: number) => { send: (body: unknown) => void } };
  },
  error: Error,
  callback: FileFilterCallback,
  logger: { error: (msg: string, ...args: unknown[]) => void },
): void => {
  logger.error('Error in imageFileFilter:', error.message);
  if (req.res) {
    req.res.status(400).send({
      statusCode: 400,
      message: [error.message],
      error: 'Bad Request',
    });
  }
  callback(error, false);
};

export const customFileName = (
  fileName: string,
  logger?: {
    info: (msg: string) => void;
    error: (msg: string, ...args: unknown[]) => void;
  },
): string => {
  try {
    logger?.info('Starting customFileName function');

    if (!fileName || typeof fileName !== 'string') {
      throw new Error('Invalid file name provided');
    }

    const trimmedFileName = fileName.trim();
    if (trimmedFileName.length === 0) {
      throw new Error('File name cannot be empty');
    }

    const customName = `/${Date.now()}-${trimmedFileName.replace(/\s+/g, '-')}`;

    logger?.info(`Custom file name generated: ${customName}`);
    logger?.info('Finished customFileName function');

    return customName;
  } catch (error) {
    logger?.error(
      'Error in customFileName function:',
      (error as Error).message,
    );
    throw error;
  }
};

export const uploadPublicFile = (
  fileName: string,
  path: string,
  logger?: {
    info: (msg: string) => void;
    error: (msg: string, ...args: unknown[]) => void;
  },
): string => {
  try {
    logger?.info('Starting customFileName function');

    if (!fileName || typeof fileName !== 'string') {
      throw new Error('Invalid file name provided');
    }

    const trimmedFileName = fileName.trim();
    if (trimmedFileName.length === 0) {
      throw new Error('File name cannot be empty');
    }

    const customName = `${path}/${Date.now()}-${trimmedFileName.replace(/\s+/g, '-')}`;

    logger?.info(`Custom file name generated: ${customName}`);
    logger?.info('Finished customFileName function');

    return customName;
  } catch (error) {
    logger?.error(
      'Error in customFileName function:',
      (error as Error).message,
    );
    throw error;
  }
};
