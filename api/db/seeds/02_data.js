const seeder = require('../seeder');

exports.seed = async (knex) => {
  await knex('pages').del();
  await seeder.seed(knex, 'pages')();
};
