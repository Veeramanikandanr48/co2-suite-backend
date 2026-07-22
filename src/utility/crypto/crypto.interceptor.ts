import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Pass-through interceptor. Transport layer security (TLS/HTTPS) guarantees payload confidentiality.
 * Dual JSON body wrapping/encryption at the application layer was removed to eliminate redundant CPU overhead.
 */
@Injectable()
export class CryptoInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}
