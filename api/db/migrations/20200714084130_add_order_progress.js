
exports.up = async (knex) => {
  await knex.schema.alterTable('orders', (table) => {
    table.boolean('shoes_picked_up');
    table.boolean('shoes_cleaned');
    table.boolean('shoes_polished');
    table.boolean('request_payment');
    table.boolean('shoes_dropped_off');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumns(['shoes_picked_up', 'shoes_cleaned', 'shoes_polished', 'request_payment', 'request_dropped_off']);
  });
  await knex.schema.alterTable('cleaners', (table) => {
    table.string('phone_number');
  });
};
