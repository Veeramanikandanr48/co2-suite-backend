import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  NotificationHistory,
  Notifications,
} from 'src/entities/notification.entity';
import { NotificationGateway } from './notification.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationGateway, useValue: {} },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
        {
          provide: getRepositoryToken(Notifications),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(NotificationHistory),
          useValue: { createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
