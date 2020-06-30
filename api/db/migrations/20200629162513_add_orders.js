exports.up = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.string('street_address');
    table.string('city');
    table.string('state', 2);
    table.string('postal_code');
    table.uuid('uuid');
  });

  await knex.schema.createTable('cleaners', (table) => {
    table.increments('id').primary();
    table.string('business_name');
    table.string('image_url');
    table.text('bio');
    table.string('street_address');
    table.string('city');
    table.string('state', 2);
    table.string('postal_code');
    table.string('phone_number').notNullable().unique();
    table.string('email').notNullable().unique();
    table.integer('user_id').unsigned().notNullable()
      .references('id')
      .inTable('users');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.uuid('uuid');
    table.string('image_url');
    table.jsonb('shoe_types');
    table.string('time_frame');
    table.text('note');
    table.decimal('estimated_price', 5, 2);
    table.decimal('final_price', 5, 2);
    table.jsonb('add_ons');
    table.string('street_address');
    table.string('city');
    table.string('state', 2);
    table.string('postal_code');
    table.timestamps(true, true);
    table.timestamp('published_at');
    table.timestamp('quote_accepted_at');
    table.integer('cleaner_id').unsigned()
      .references('id')
      .inTable('cleaners');
    table.integer('user_id').unsigned()
      .notNullable()
      .references('id')
      .inTable('users');
    table.timestamp('completed_at');
    table.timestamp('deleted_at');
  });
  await knex.schema.createTable('quotes', (table) => {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('order_id').unsigned()
      .notNullable()
      .references('id')
      .inTable('orders');
    table.integer('cleaner_id').unsigned()
      .notNullable()
      .references('id')
      .inTable('cleaners');
    table.decimal('quoted_price');
    table.timestamp('expires_at');
    table.timestamp('accepted_at');
    table.timestamp('delivery_by');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('quotes');
  await knex.schema.dropTable('orders');
  await knex.schema.dropTable('cleaners');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumns(['street_address', 'city', 'state', 'postal_code', 'uuid']);
  });
};
