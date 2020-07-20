
exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.timestamp('confirmation_sent_at');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumns(['confirmation_sent_at']);
  });
};
