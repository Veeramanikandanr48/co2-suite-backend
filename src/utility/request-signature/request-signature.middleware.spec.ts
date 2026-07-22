import { Test, TestingModule } from '@nestjs/testing';
import { RequestSignatureMiddleware } from './request-signature.middleware';
import { SessionSigningKeyService } from './session-signing-key.service';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { canonicalJsonStringify } from './canonical-json';

describe('RequestSignatureMiddleware', () => {
  let middleware: RequestSignatureMiddleware;
  let sessionKeyService: Partial<SessionSigningKeyService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    sessionKeyService = {
      checkAndMarkNonce: jest.fn().mockResolvedValue(true),
      getSigningKey: jest.fn().mockResolvedValue('test_signing_key_32_bytes_hex_1234'),
    };

    jwtService = {
      verify: jest.fn().mockReturnValue({ userId: 1, email: 'test@example.com' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestSignatureMiddleware,
        { provide: SessionSigningKeyService, useValue: sessionKeyService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    middleware = module.get<RequestSignatureMiddleware>(RequestSignatureMiddleware);
  });

  it('should allow excluded routes without signature headers', async () => {
    const req = {
      path: '/api/v1/registration/login',
      method: 'POST',
      headers: {},
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should throw ForbiddenException if signature headers are missing on protected route', async () => {
    const req = {
      path: '/api/v1/user/profile',
      method: 'GET',
      headers: {},
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if timestamp is expired (> 60 seconds old)', async () => {
    const oldTimestamp = (Date.now() - 70000).toString();
    const req = {
      path: '/api/v1/user/profile',
      method: 'GET',
      headers: {
        'x-request-timestamp': oldTimestamp,
        'x-request-nonce': 'nonce-123',
        'x-request-signature': 'sig-123',
      },
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if nonce is duplicate', async () => {
    (sessionKeyService.checkAndMarkNonce as jest.Mock).mockResolvedValue(false);
    const now = Date.now().toString();
    const req = {
      path: '/api/v1/user/profile',
      method: 'GET',
      headers: {
        'x-request-timestamp': now,
        'x-request-nonce': 'duplicate-nonce',
        'x-request-signature': 'sig-123',
      },
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
  });

  it('should pass valid request signature', async () => {
    const signingKey = 'test_signing_key_32_bytes_hex_1234';
    const timestamp = Date.now().toString();
    const nonce = 'unique-nonce-789';
    const method = 'POST';
    const path = '/api/v1/user/profile';
    const body = { name: 'John Doe', age: 30 };
    const canonicalBody = canonicalJsonStringify(body);
    const bodyHash = crypto.createHash('sha256').update(canonicalBody).digest('hex');
    const message = [method, path, '', timestamp, nonce, bodyHash].join('\n');
    const validSignature = crypto.createHmac('sha256', signingKey).update(message).digest('hex');

    const req = {
      path,
      method,
      query: {},
      body,
      cookies: { access_token: 'valid_jwt' },
      headers: {
        'x-request-timestamp': timestamp,
        'x-request-nonce': nonce,
        'x-request-signature': validSignature,
      },
    } as unknown as Request;

    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
