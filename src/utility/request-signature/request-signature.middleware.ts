import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { SessionSigningKeyService } from './session-signing-key.service';
import { canonicalJsonStringify } from './canonical-json';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@Injectable()
export class RequestSignatureMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSignatureMiddleware.name);

  constructor(
    private readonly sessionKeyService: SessionSigningKeyService,
    private readonly jwtService: JwtService,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    // Generate or propagate Request ID for logging and tracing
    const requestId =
      (req.headers['x-request-id'] as string) || crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    const rawUrlPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
    const path = rawUrlPath;
    const method = req.method.toUpperCase();

    // Skip verification for OPTIONS preflight requests & public excluded routes
    if (method === 'OPTIONS' || this.isExcludedRoute(path, req.originalUrl)) {
      return next();
    }

    // Read required signature headers
    const timestampHeader = req.headers['x-request-timestamp'] as string;
    const nonce = req.headers['x-request-nonce'] as string;
    const signature = req.headers['x-request-signature'] as string;

    if (!timestampHeader || !nonce || !signature) {
      this.logger.warn(
        `[RequestID: ${requestId}] Missing signature headers on protected route: ${method} ${path}`,
      );
      throw new ForbiddenException('Missing request signature headers');
    }

    // 1. Validate Timestamp Tolerance (±60 seconds)
    const requestTimestamp = parseInt(timestampHeader, 10);
    const now = Date.now();
    if (isNaN(requestTimestamp) || Math.abs(now - requestTimestamp) > 60_000) {
      this.logger.warn(
        `[RequestID: ${requestId}] Signature expired. Client timestamp: ${requestTimestamp}, Server time: ${now}`,
      );
      throw new ForbiddenException('Request signature expired');
    }

    // 2. Validate Nonce (Replay Protection via SETNX)
    const isNewNonce = await this.sessionKeyService.checkAndMarkNonce(
      nonce,
      60,
    );
    if (!isNewNonce) {
      this.logger.warn(
        `[RequestID: ${requestId}] Replay attempt detected. Nonce already used: ${nonce}`,
      );
      throw new ForbiddenException('Duplicate request nonce detected');
    }

    // 3. Extract Session Context & Session Signing Key
    const token =
      req.cookies?.access_token ||
      this.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      this.logger.warn(
        `[RequestID: ${requestId}] Unauthenticated request to protected route: ${path}`,
      );
      throw new ForbiddenException('Authentication token missing');
    }

    let payload: IDecodeUserDetails;
    try {
      payload = this.jwtService.verify<IDecodeUserDetails>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      this.logger.warn(`[RequestID: ${requestId}] Invalid JWT token`);
      throw new ForbiddenException('Invalid session token');
    }

    // Session key lookup key is user's session identifier (userId / currentRoleId session)
    const sessionId = (payload as any).sessionId || payload.userId;
    const signingKey = await this.sessionKeyService.getSigningKey(sessionId);

    if (!signingKey) {
      this.logger.warn(
        `[RequestID: ${requestId}] No active signing key found for session: ${sessionId}`,
      );
      throw new ForbiddenException('Session signing key invalid or expired');
    }

    // 4. Compute Canonical Message & HMAC
    const canonicalBody =
      req.body && Object.keys(req.body).length > 0
        ? canonicalJsonStringify(req.body)
        : '';
    const bodyHash = crypto
      .createHash('sha256')
      .update(canonicalBody)
      .digest('hex');

    // Canonical query string (sorted by key)
    const queryKeys = Object.keys(req.query || {}).sort();
    const canonicalQuery = queryKeys
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(req.query[key]))}`,
      )
      .join('&');

    const message = [
      method,
      path,
      canonicalQuery,
      timestampHeader,
      nonce,
      bodyHash,
    ].join('\n');

    const keyBuffer = Buffer.from(signingKey, 'hex');
    const expectedSignature = crypto
      .createHmac('sha256', keyBuffer)
      .update(message)
      .digest('hex');

    // 5. Timing-Safe Comparison
    const isValid = this.timingSafeEquals(signature, expectedSignature);
    if (!isValid) {
      this.logger.warn(
        `[RequestID: ${requestId}] HMAC signature mismatch for ${method} ${path}`,
      );
      throw new ForbiddenException('Invalid request signature');
    }

    next();
  }

  private isExcludedRoute(path: string, originalUrl?: string): boolean {
    const rawUrlPath = originalUrl ? originalUrl.split('?')[0] : path;
    const excludedPatterns = [
      '/health',
      '/api-doc',
      '/registration/login',
      '/api/v1/registration/login',
      '/registration/register',
      '/api/v1/registration/register',
      '/registration/googleLogin',
      '/api/v1/registration/googleLogin',
      '/registration/forgot-password',
      '/api/v1/registration/forgot-password',
      '/registration/reset-password',
      '/api/v1/registration/reset-password',
      '/registration/verify-email',
      '/api/v1/registration/verify-email',
      '/registration/refresh',
      '/api/v1/registration/refresh',
      '/registration/session-key',
      '/api/v1/registration/session-key',
      '/registration/mfa/validate',
      '/api/v1/registration/mfa/validate',
      '/registration/mfa/generate',
      '/api/v1/registration/mfa/generate',
      '/sidebar',
      '/api/v1/sidebar',
    ];
    return excludedPatterns.some(
      (pattern) => path.startsWith(pattern) || rawUrlPath.startsWith(pattern),
    );
  }

  private extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
    return null;
  }

  private timingSafeEquals(a: string, b: string): boolean {
    if (!a || !b || a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
      return false;
    }
  }
}
