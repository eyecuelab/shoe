import Jsonfile from 'jsonfile';

import Core from '../../../core';

const { LogUtil, GeneralUtil } = Core.utils;

const CONTROLLER = 'VersionController';

class VersionController {
  constructor() {
    this.log = LogUtil.getLogger(CONTROLLER);
    this.log.debug('ctor');
    GeneralUtil.BindAll(this);
  }

  async get() {
    this.log.debug('get');
    const packageJson = await Jsonfile.readFileSync('package.json');

    const dbVersionResult = await Core.models.DB.knex.raw('SHOW server_version_num;'); // SELECT version()
    const [dbVersion] = dbVersionResult.rows;

    const dbMigrationResult = await Core.models.DB.knex.raw('SELECT * FROM knex_migrations;');
    const migrationsCount = dbMigrationResult.rows.length;

    const versions = {
      node: process.versions.node,
      v8: process.versions.v8,
      app: packageJson.version,
      db: {
        dialect: Core.models.DB.knex.client.dialect,
        version: dbVersion,
      },
      migrationsCount,
    };
    return versions;
  }
}

module.exports = new VersionController();
