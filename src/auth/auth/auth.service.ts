import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor() {}

  async getAllUserPermission(_roleId: number): Promise<unknown[]> {
    return [];
  }
}
