import Log from '../../core/lib/utils/log';

const LOG_NAME = 'RoleService';

export class RoleService {
  static instance = null;

  static create() {
    this.instance = this.instance == null ? new RoleService() : this.instance;
    return this.instance;
  }

  constructor() {
    this.log = Log.getLogger(LOG_NAME);
  }
}

export default RoleService;
