// import Core from '../../core';
import { BaseModel } from './base';

const TABLE_NAME = 'pages';

export class Page extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  get tableName() {
    return TABLE_NAME;
  }

  get soft() {
    return ['deleted_at'];
  }
}

export default Page;
