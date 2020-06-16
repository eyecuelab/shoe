import Core from '../core';

const { DB } = Core.models;
const Jsonfile = require('jsonfile');
const path = require('path');

function resetSeq(name) {
  return DB.knex.raw(`select setval('${name}_id_seq', max(id)) from ${name};`);
}

async function seed(name, processor) {
  let list = fixtures(name);

  if (processor) {
    list = processor(list);
  }

  await Promise.all([
    DB.knex(name).insert(list),
  ]);
  await resetSeq(name);

  return list;
}

function fixtures(tableName) {
  let file = path.resolve(__dirname, `../db/fixtures/prod/${tableName}.json`);
  let results = [];
  try {
    results = results.concat(Jsonfile.readFileSync(file));
  } catch (err) {
    // ok if no file
  }
  file = path.resolve(__dirname, `../db/fixtures/dev/${tableName}.json`);
  try {
    results = results.concat(Jsonfile.readFileSync(file));
  } catch (err) {
    // ok if no file
  }

  return results;
}

export async function seedUsers() {
  await seed('roles');
  return seed('users', (results) => {
    const list = results;
    list.forEach((u, i) => {
      list[i].password = Core.utils.DBUtil.generatePassword(u.password);
    });
    return list;
  });
}

export async function seedData() {
  await seed('pages');
}
