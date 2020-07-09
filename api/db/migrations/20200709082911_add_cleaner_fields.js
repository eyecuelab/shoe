
exports.up = async (knex) => {
  await knex.schema.alterTable('cleaners', (table) => {
    table.dropColumns(['phone_number']);
  });
  await knex.schema.alterTable('cleaners', (table) => {
    table.string('first_name');
    table.string('last_name');
    table.string('phone');
    table.timestamp('deleted_at');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('cleaners', (table) => {
    table.dropColumns(['first_name', 'last_name', 'phone', 'deleted_at']);
  });
  await knex.schema.alterTable('cleaners', (table) => {
    table.string('phone_number');
  });
};
