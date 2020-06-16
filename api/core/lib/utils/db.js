const Promise = require('bluebird');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Path = require('path');
const Knex = require('knex');
const Fs = require('fs');
const { spawn } = require('child_process');

const Config = require('../../../config/config');
const GeneralUtil = require('./general');

const UNKNOWN_TYPE = 0;
const PG_TYPE = 1;
const SQLITE_TYPE = 2;

const schemaFilePath = './db/schema.sql';
const migrationsFilePath = './db/knex_migrations.sql';

const dbConfig = Config.get('db');
const environment = Config.get('env');

function resetPrimary(knex, table, num) {
  const seq = `pg_get_serial_sequence('${table}', 'id')`;
  return knex.raw(`SELECT SETVAL(${seq}, ${num});`);
}

function clientType(client) {
  if (client === 'postgresql') {
    return PG_TYPE;
  } if (client === 'sqlite3') {
    return SQLITE_TYPE;
  }

  return UNKNOWN_TYPE;
}

async function deleteAndReset(knex, tables) {
  const promises = [];

  for (let index = 0; index < tables.length; index += 1) {
    const t = tables[index];
    promises.push(new Promise(async (resolve, reject) => {
      try {
        await knex.raw(`DELETE FROM ${t};`);
        await resetPrimary(knex, t, 0);
      } catch (error) {
        return reject(error);
      }
      return resolve();
    }));
  }

  return GeneralUtil.runSeries(promises);
}

function truncateTable(knex, tableNames, excludes = []) {
  const client = knex.client.dialect;
  const tables = tableNames.reduce((accum, table) => (excludes.includes(table)
    ? accum : accum.concat([table])), []);
  const quotedTableNames = tables.map((tableName) => `"${tableName}"`);

  switch (clientType(client)) {
    case PG_TYPE:
      return knex.raw(`TRUNCATE ${quotedTableNames.join()} RESTART IDENTITY CASCADE;`);
    case SQLITE_TYPE:
      return Promise.map(tables, (tableName) => knex(tableName).truncate());
    default:
      throw new Error(`invalid dialect${client}`);
  }
}

function getTablesNameSql(knex) {
  const client = knex.client.dialect;
  switch (clientType(client)) {
    case PG_TYPE:
      return 'SELECT tablename FROM pg_catalog.pg_tables'
        + " WHERE schemaname='public';";
    case SQLITE_TYPE:
      return "SELECT name FROM sqlite_master WHERE type='table';";
    default:
      throw new Error(`table name: ${
        client}`);
  }
}

function getSqlRows(knex, resp) {
  const client = knex.client.dialect;

  switch (clientType(client)) {
    case PG_TYPE:
      return resp.rows;
    case SQLITE_TYPE:
      return resp;
    default:
      throw new Error(`getSqlRows ${client}`);
  }
}

async function getTableNames(knex) {
  const results = await knex.raw(getTablesNameSql(knex));
  return getSqlRows(knex, results)
    .map((table) => table[Object.keys(table)[0]]);
}

function clean(knex, more = []) {
  const excludes = ['knex_migrations', 'knex_migrations_lock'].concat(more);
  return new Promise(async (resolve, reject) => {
    try {
      const tables = await getTableNames(knex);
      if (tables.length > 0) {
        await truncateTable(knex, tables, excludes);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function randomPassword() {
  const id = crypto.randomBytes(10).toString('hex');
  const pw = id + getRandomInt(1000000);
  return pw;
}

function generatePassword(pw) {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync(pw, salt);
  return hash;
}

// used in migrations

function dropColumnsForTable(knex, tableName, columnsToDrop) {
  return Promise
    .filter(columnsToDrop, columnName => knex.schema.hasColumn(tableName, columnName))
    .then(existingColumns => knex.schema.table(tableName, (t) => {
      existingColumns.forEach(columnName => t.dropColumn(columnName));
    }));
}

async function addNewColumn(knex, tableName, columnName, columnCallback) {
  const exists = await knex.schema.hasColumn(tableName, columnName);

  if (!exists) {
    await knex.schema.table(tableName, (t) => {
      columnCallback(t);
    });
  }
}

function insertMany(list, tableName, knex) {
  const all = [];
  for (let index = 0; index < list.length; index += 1) {
    const item = list[index];
    all.push(knex(tableName).insert(item));
  }

  return Promise.all(all);
}


async function withTransaction(knex, callback) {
  await knex.transaction(async (t) => {
    try {
      await callback(t);

      await t.commit();
      return Promise.resolve();
    } catch (error) {
      await t.rollback();
      return Promise.reject(error);
    }
  });
}

// ====================================

function getKnexFile() {
  const KNEXFILE = 'knexfile.js';
  const libKnexfile = Path.resolve(`${__dirname}/../../../${KNEXFILE}`);
  return libKnexfile;
}

function getKnexConfig(migrationsPath = null) {
  const libKnexfile = getKnexFile();
  const env = process.env.NODE_ENV || 'development';
  // eslint-disable-next-line import/no-dynamic-require,global-require
  const config = require(libKnexfile)[env];
  config.migrations.directory = migrationsPath || config.migrations.directory;
  return config;
}

async function exec(command, printProcessOutput = false) {
  return new Promise((resolve, reject) => {
    command.stdout.on('data', (data) => {
      if (printProcessOutput) {
        process.stdout.write(data);
      }
    });
    command.stderr.on('data', (data) => {
      process.stdout.write(`stderr: ${data}\n`);
      process.exit();
      reject();
    });
    command.on('close', () => {
      resolve();
    });
  });
}

function importSchema() {
  const filePath = Path.resolve(schemaFilePath);
  if (!Fs.existsSync(filePath)) {
    process.stdout.write('skipping db schema import ...\n');
    return new Promise(resolve => resolve());
  }

  const command = spawn(
    'psql', ['-h', dbConfig.host, '-U', 'postgres', '-d', dbConfig.name, '-p', dbConfig.port, '-f', schemaFilePath]);
  return exec(command, true);
}

function importKnexMigrations() {
  const config = getKnexConfig();
  const knex = Knex(config);

  const filePath = Path.resolve(migrationsFilePath);
  if (!Fs.existsSync(filePath)) {
    process.stdout.write('skipping schema migrations import ...\n');
    return new Promise(resolve => resolve());
  }

  const sql = Fs.readFileSync(filePath).toString();

  return knex.raw(sql);
}

function exportKnexMigrations() {
  if (!dbConfig.useSchemaFile || environment !== 'development') {
    return new Promise(resolve => resolve());
  }
  process.stdout.write('exporting knex migrations ...\n');

  const command = spawn(
    'pg_dump', [
      '-h', dbConfig.host,
      '-U', 'postgres',
      '-p', dbConfig.port,
      '-t', 'knex_migrations',
      '--data-only',
      '--column-inserts',
      dbConfig.name,
      '-f', migrationsFilePath]);
  return exec(command, true);
}

async function cleanupKnexMigrations(knex, config) {
  const filePath = Path.resolve(migrationsFilePath);
  if (!Fs.existsSync(filePath)) {
    return new Promise(resolve => resolve());
  }

  const files = Fs.readdirSync(config.migrations.directory);

  return knex.raw(`delete from ${config.migrations.tableName} where not (name = any(?))`, [files]);
}

async function runMigrations(runSeeds = true, migrationsPath = null) {
  const config = getKnexConfig(migrationsPath);
  const db = Knex(config);

  let result;
  try {
    await cleanupKnexMigrations(db, config);
  } catch (err) {
    process.stdout.write(`error: ${err}.\n`);
  }

  try {
    result = await db.migrate.latest();
    if (runSeeds) {
      await db.seed.run();
    }

    await exportKnexMigrations();
  } catch (err) {
    process.stdout.write(`error: ${err}.\n`);
  }

  return result;
}

async function rollbackMigrations() {
  const config = getKnexConfig();
  const db = Knex(config);

  let result;
  try {
    result = await db.migrate.rollback();

    await exportKnexMigrations();
  } catch (err) {
    process.stdout.write(`error: ${err}.\n`);
  }

  return result;
}

module.exports = {
  clean,
  deleteAndReset,

  resetPrimary,
  truncateTable,
  generatePassword,
  randomPassword,
  clientType,

  dropColumnsForTable,
  addNewColumn,
  withTransaction,

  insertMany,

  getKnexFile,
  getKnexConfig,
  runMigrations,
  rollbackMigrations,

  importSchema,
  importKnexMigrations,
  exportKnexMigrations,
};
