
exports.up = async (knex) => {
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumns(['shoe_types']);
  });
  await knex.schema.alterTable('orders', (table) => {
    table.specificType('shoe_types', 'text ARRAY');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumns(['shoe_types']);
  });
  await knex.schema.alterTable('orders', (table) => {
    table.jsonb('shoe_types').alter();
  });
};
