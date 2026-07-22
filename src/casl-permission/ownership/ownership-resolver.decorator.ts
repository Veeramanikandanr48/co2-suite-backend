import { SetMetadata } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces';
import { IOwnershipResolver } from './ownership-resolver.interface';

export const OWNERSHIP_RESOLVER_KEY = 'ownership_resolver_key';

/**
 * @OwnershipResolver(ResolverClass)
 *
 * Attaches an injectable resolver class to a route handler.
 * PermissionGuard reads this metadata and, when present, calls
 * resolver.resolve(req) to obtain the resource owner's userId.
 * If the resolved owner !== req.user.userId, the request is denied (403).
 *
 * Usage:
 *   @CheckPermissions([Action.UPDATE, 'users:profile'])
 *   @OwnershipResolver(UserProfileOwnershipResolver)
 *   async updateProfile(...) { ... }
 *
 * The resolver is retrieved from the NestJS DI container via ModuleRef,
 * so it can inject any service (repository, cache, etc.) normally.
 */
export const OwnershipResolver = (
  resolverClass: Type<IOwnershipResolver>,
): MethodDecorator => SetMetadata(OWNERSHIP_RESOLVER_KEY, resolverClass);
