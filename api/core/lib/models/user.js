import { BaseModel } from './base';

const TABLE_NAME = 'users';

export class User extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  get tableName() {
    return TABLE_NAME;
  }
}

export default User;
