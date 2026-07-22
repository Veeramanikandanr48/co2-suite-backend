import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { encryptPayload, decryptPayload } from './crypto.utility';

@Injectable()
export class CryptoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // 1. Decrypt incoming request body if encrypted payload
    if (request.body) {
      if (request.body.encrypted && typeof request.body.data === 'string') {
        request.body = decryptPayload(request.body.data);
      } else if (typeof request.body === 'string') {
        try {
          const parsed = JSON.parse(request.body);
          if (parsed.encrypted && typeof parsed.data === 'string') {
            request.body = decryptPayload(parsed.data);
          }
        } catch {
          // Keep body as-is if not JSON encrypted
        }
      }
    }

    // 2. Encrypt outgoing response payload into ciphertext
    return next.handle().pipe(
      map((data) => {
        const skipCrypto = request.headers['x-skip-crypto'] === 'true';

        if (skipCrypto || data === undefined || data === null) {
          return data;
        }

        return {
          encrypted: true,
          data: encryptPayload(data),
        };
      }),
    );
  }
}
