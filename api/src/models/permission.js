import { BaseModel } from './base';

const TABLE_NAME = 'permissions';

export class Permission extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  get tableName() {
    return Permission.TABLE_NAME;
  }

  get hasTimestamps() {
    return true;
  }

  static adminPermissions() {
    return this
      .query((qb) => {
        qb.innerJoin('roles_permissions', 'permissions.id', 'roles_permissions.permission_id');
        qb.innerJoin('roles', 'roles_permissions.role_id', 'roles.id');
        qb.groupBy('permissions.id');
        qb.where('roles.name', '=', 'Admin');
      });
  }
}

export default Permission;
