import { Test, TestingModule } from '@nestjs/testing';
import { LogUploadCronService } from './log-upload-cron.service';

describe('LogUploadCronService', () => {
  let service: LogUploadCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogUploadCronService],
    }).compile();

    service = module.get<LogUploadCronService>(LogUploadCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
