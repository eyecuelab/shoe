const seeder = require('../seeder');

const TABLE_NAME = 'cleaners';

exports.seed = async (knex) => {
  await knex(TABLE_NAME).del().then(
    seeder.seed(knex, TABLE_NAME, (results) => {
      const items = results;
      return items;
    }),
  );
};
