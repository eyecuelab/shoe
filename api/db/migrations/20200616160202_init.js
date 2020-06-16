exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('first_name');
    table.string('last_name');
    table.string('phone');
    table.string('image_url');
    table.string('email').notNullable().index().unique();
    table.string('password').notNullable();
    table.specificType('scope', 'text[]').notNullable().default('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
  });

  await knex.schema.createTable('sessions', (table) => {
    table.increments('id').primary();
    table.string('key').notNullable().index().unique();
    table.integer('user_id').unsigned().notNullable()
      .references('id')
      .inTable('users');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.text('description');
  });

  await knex.schema.createTable('pages', (table) => {
    table.increments('id').primary();
    table.string('slug').notNullable().index().unique();
    table.string('name').notNullable().unique();
    table.text('content').notNullable();
    table.timestamps(true, true);
    table.integer('updated_by').unsigned()
      .references('id')
      .inTable('users');
    table.timestamp('deleted_at');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('pages');
  await knex.schema.dropTable('roles');
  await knex.schema.dropTable('sessions');
  await knex.schema.dropTable('users');
};
