const Jsonfile = require('jsonfile');
const path = require('path');

class Seeder {
  seed(knex, tableName, processor) {
    let results = this.fixtures(tableName);
    if (!results.length) {
      process.stdout.write(`\nWarning: empty data for ${tableName}\n`);
      return () => {};
    }

    if (processor) {
      results = processor(results);
    }

    return async () => {
      await knex(tableName).insert(results);

      return knex.raw(`select setval('${tableName}_id_seq', max(id)) from ${tableName};`);
    };
  }

  fixtures(tableName) {
    const env = process.env.NODE_ENV || 'development';
    let file = path.resolve(`./db/fixtures/prod/${tableName}.json`);
    let results = [];
    try {
      results = results.concat(Jsonfile.readFileSync(file));
    } catch (err) {
      // ok if no file
    }
    if (env !== 'production') {
      file = path.resolve(`./db/fixtures/dev/${tableName}.json`);
      try {
        results = results.concat(Jsonfile.readFileSync(file));
      } catch (err) {
        // ok if no file
      }
    }

    return results;
  }
}

module.exports = (() => {
  const seeder = new Seeder();
  return seeder;
})();
