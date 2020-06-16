const Path = require('path');
const Fs = require('fs');
const Glob = require('glob');
const Promise = require('bluebird');
const DBUtil = require('../lib/utils/db');
const Config = require('../../config/config');

function linkLibMigrations() {
  const config = DBUtil.getKnexConfig();
  const migrationsPath = Path.resolve(`${__dirname}/../db/migrations`);
  const dir = `${migrationsPath}/**/*.js`;
  return new Promise((resolve, reject) => {
    Glob(dir, (err, files) => {
      if (err) {
        reject(err);
      }
      resolve(Promise.map(files, (file) => {
        const projectMigration = Path.resolve(config.migrations.directory, Path.basename(file));
        const exists = Fs.existsSync(projectMigration);
        // console.log(exists, projectMigration);
        return exists ? Promise.resolve() : Promise.promisify(Fs.symlink)(file, projectMigration);
      }));
    });
  });
}

async function run() {
  const dbConfig = Config.get('db');

  if (!dbConfig.customMigrations) {
    await linkLibMigrations();
  }
  return DBUtil.runMigrations(dbConfig.enableSeeds);
}

run().then((msg) => {
  process.stdout.write(JSON.stringify(msg, null, 2));
  process.exit();
}).catch((error) => {
  throw error;
});
