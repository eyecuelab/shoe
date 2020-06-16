const DBUtil = require('../../lib/utils/db');
const Config = require('../../../config/config');

const dbConfig = Config.get('db');

if (dbConfig.useSchemaFile) {
  DBUtil.importSchema()
    .then(DBUtil.importKnexMigrations)
    .then(() => {
      process.exit();
    }).catch(() => {
      process.exit();
    });
}
