const Core = require('../../core');
const seeder = require('../seeder');

const TABLE_NAME = 'users';

exports.seed = async (knex) => {
  await knex(TABLE_NAME).del().then(
    seeder.seed(knex, TABLE_NAME, (results) => {
      const items = results;
      items.forEach((r, i) => {
        items[i].password = Core.utils.DBUtil.generatePassword(r.password);
      });
      return items;
    }),
  );

  return knex('roles').del().then(
    seeder.seed(knex, 'roles'),
  );
};
