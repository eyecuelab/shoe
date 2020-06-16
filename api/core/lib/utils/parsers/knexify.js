/* eslint-disable */
// TODO: replace this

const _ = require('lodash');
const resourceContext = require('./context');

let buildWhere;
let whereType;

_.mixin(require('./lodash-stmt'));

const processFilter = function processFilter(filter, context) {
  const joins = [];

  const addJoin = function addJoin(join) {
    if (joins.indexOf(join) === -1) {
      joins.push(join);
    }
  };

  const expandAlias = function expandAlias(property) {
    let p = property;
    if (context.propAliases && context.propAliases[property]) {
      p = context.propAliases[property];
    }

    return p;
  };

  const processProperty = function processProperty(property) {
    let p = expandAlias(property);

    const parts = p.split('.');

    if (parts.length === 1) {
      p = `${context.name}.${p}`;
    }

    if (parts.length > 1) {
      addJoin(parts[0]);
    }

    return p;
  };

  _.eachStatement(filter.statements, (statement) => {
    statement.prop = processProperty(statement.prop);
  });

  filter.joins = joins;

  return filter;
};

whereType = function whereType(statement, index) {
  let whereFunc = 'andWhere';
  if (index === 0) {
    whereFunc = 'where';
  } else if (statement.func === 'or') {
    whereFunc = 'orWhere';
  }

  if (statement.value === null) {
    if (statement.func === 'or') {
      whereFunc = statement.op === 'IS NOT' ? 'orWhereNotNull' : 'orWhereNull';
    } else {
      whereFunc = statement.op === 'IS NOT' ? 'whereNotNull' : 'whereNull';
    }
  }

  return whereFunc;
};

buildWhere = function buildWhere(qb, statements) {
  _.eachStatement(
    statements,
    (statement, index) => {
      if (statement.op === 'LIKE') {
        const val = statement.value.toLowerCase();
        qb.whereRaw(`LOWER(${statement.prop}) LIKE ?`, [`${val}`])
      } else {
        qb[whereType(statement, index)](statement.prop, statement.op, statement.value);
      }
    },
    (statement, index) => {
      qb[whereType(statement, index)]((_qb) => {
        buildWhere(_qb, statement.group);
      });
    },
  );
};

module.exports = function knexify(qb, filter) {
  filter = processFilter(filter, resourceContext[qb._single.table]);
  buildWhere(qb, filter.statements);
  return qb;
};

module.exports._buildWhere = buildWhere;
