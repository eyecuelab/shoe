import { BaseModel } from './base';

const TABLE_NAME = 'roles';

export class Role extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  get tableName() {
    return Role.TABLE_NAME;
  }

  get hasTimestamps() {
    return true;
  }
}

export default Role;
