const knex = require('knex');
const bookshelf = require('bookshelf');
const cascadeDelete = require('bookshelf-cascade-delete');
const softDelete = require('bookshelf-soft-delete');
const Config = require('../../../config/config');

const environment = Config.get('env');
const knexConfig = require('../../../knexfile.js')[environment];

const knexDB = knex(knexConfig);
const b = bookshelf(knexDB);

// add plugins here
b.plugin('pagination');
b.plugin(cascadeDelete);
b.plugin(softDelete);
b.plugin('virtuals');

module.exports = b;
