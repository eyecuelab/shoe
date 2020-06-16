const Promise = require('bluebird');
const { spawn } = require('child_process');

const Config = require('../../../config/config');

const dbConfig = Config.get('db');
const environment = Config.get('env');

if (!dbConfig.useSchemaFile || environment !== 'development') {
  process.exit();
}

process.stdout.write('\nexporting db schema ...');

const pgDumpSchema = spawn(
  'pg_dump', [dbConfig.name, '--schema-only', '-f', './db/schema.sql']);

async function exec(command) {
  return new Promise((resolve, reject) => {
    command.stdout.on('data', (data) => {
      resolve(data);
    });
    command.stderr.on('data', (data) => {
      reject(data);
    });
  });
}

function run() {
  return Promise.all([
    exec(pgDumpSchema),
  ]);
}

run().then((msg) => {
  process.stdout.write(`stdout: ${msg}\n`);
  process.exit();
}).catch((e) => {
  process.stdout.write(`stderr: ${e}\n`);
  process.exit();
});
