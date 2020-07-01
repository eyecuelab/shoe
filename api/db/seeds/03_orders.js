const seeder = require('../seeder');

exports.seed = async (knex) => {
  await knex('orders').del();
  await seeder.seed(knex, 'orders')();
};
