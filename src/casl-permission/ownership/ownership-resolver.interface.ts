import { Request } from 'express';

/**
 * OwnershipResolver — injectable class interface for centralized ownership
 * resolution in the PermissionGuard.
 *
 * Implement this interface in a service class and register it with
 * @OwnershipResolver(MyResolver) on any controller route that requires
 * `scope: 'own'` enforcement.
 *
 * The resolver returns the userId of the resource owner.
 * The guard compares this against req.user.userId to decide access.
 *
 * Example:
 *   @Injectable()
 *   export class UserProfileOwnershipResolver implements IOwnershipResolver {
 *     constructor(private readonly usersService: UsersService) {}
 *
 *     async resolve(req: Request): Promise<number> {
 *       const profile = await this.usersService.findOne(+req.params.id);
 *       return profile.userId;
 *     }
 *   }
 */
export interface IOwnershipResolver {
  resolve(req: Request): Promise<number> | number;
}
