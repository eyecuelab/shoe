import Joi from '@hapi/joi';
import _ from 'lodash';

const links = Joi.object().pattern(/^/, Joi.string().allow(null));
const attributes = Joi.object().pattern(/^/, Joi.any());
const relationships = Joi.object().pattern(/^/, Joi.object());

function schemaError(message) {
  throw new Error(message);
}

const actionField = Joi.object().keys({
  name: Joi.string().required(),
  type: Joi.string().valid(['text', 'number', 'bool', 'password', 'array', 'file', 'object']).required(),
  value: Joi.any(),
  options: Joi.any(),
  schema: Joi.any(),
  required: Joi.boolean(),
  nulls: Joi.boolean(),
});

const action = Joi.object().keys({
  name: Joi.string().required(),
  method: Joi.string().valid(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']).required(),
  url: Joi.string().required(),
  fields: Joi.array().items(actionField),
});

const meta = Joi.object().keys({
  actions: Joi.array().items(action),
  pagination: Joi.object().keys({
    page: Joi.number(),
    pageSize: Joi.number(),
    rowCount: Joi.number(),
    pageCount: Joi.number(),
  }),
  attributes,
});

const listData = Joi.object().keys({
  type: Joi.string().required(),
  id: Joi.string().required(),
  links,
  meta,
  attributes,
  relationships,
});

const data = Joi.object().keys({
  links,
  meta,
  included: Joi.array().items(listData),
  data: Joi.object().keys({
    type: Joi.string().required(),
    id: Joi.string().required(),
    attributes,
    relationships,
    links,
  }),
});

const list = Joi.object().keys({
  links,
  meta,
  data: Joi.array().items(listData),
  included: Joi.array().items(listData),
});

function validateOne(res) {
  return Joi.validate(res, data);
}

function validateList(res) {
  return Joi.validate(res, list);
}

function validateError(res, code, messageRegex) {
  const keys = {
    statusCode: Joi.number().integer().valid([code]).required(),
    error: Joi.string().required(),
    message: Joi.string().required(),
    validation: Joi.any(),
    warning: Joi.string(),
  };
  if (messageRegex !== undefined) {
    keys.message = Joi.string().regex(messageRegex);
  }
  const errorData = Joi.object().keys(keys);

  return Joi.validate(res, errorData);
}

function mustHaveLinks(json, expectedNames) {
  expectedNames.forEach((name) => {
    if (!json.links[name] || !json.links[name].length) {
      schemaError(`Expected to include a link '${name}'`);
    }
  });
}

function mustNotHaveLinks(json, expectedNames) {
  expectedNames.forEach((name) => {
    if (json.links[name]) {
      schemaError(`Unexpected included link '${name}'`);
    }
  });
}

function mustHaveAttrs(json, expectedAttrs) {
  const attrs = Object.keys(json.attributes);
  if (_.difference(expectedAttrs, attrs).length !== 0) {
    schemaError(`Expected [${attrs}] to include [${expectedAttrs}]`);
  }
}

function mustHaveActions(json, expectedNames) {
  const names = [];
  json.meta.actions.map((a) => names.push(a.name));
  expectedNames.forEach((name) => {
    if (!names.includes(name)) {
      schemaError(`Expected meta actions to include '${name}'`);
    }
  });
}

function mustNotHaveActions(json, expectedNames) {
  const names = [];
  json.meta.actions.map((a) => names.push(a.name));
  expectedNames.forEach((name) => {
    if (names.includes(name)) {
      schemaError(`Unexpected meta action included '${name}'`);
    }
  });
}

function mustHaveActionFields(json, actionName, fieldNames) {
  const lookupAction = json.meta.actions.find((a) => a.name === actionName);
  if (!lookupAction) {
    schemaError(`Meta action '${actionName}' is not found`);
  }
  const names = [];
  lookupAction.fields.map((a) => names.push(a.name));
  fieldNames.forEach((name) => {
    if (!names.includes(name)) {
      schemaError(`Expected meta action '${actionName}' to include field: '${name}'`);
    }
  });
}

function mustInclude(jsonIncluded, expectedIncludes) {
  const includes = {};
  jsonIncluded.forEach((inc) => {
    if (!includes[inc.type]) {
      includes[inc.type] = [];
    }
    includes[inc.type].push(inc.id);
  });

  Object.keys(expectedIncludes).forEach((name) => {
    if (_.difference(expectedIncludes[name], includes[name]).length !== 0) {
      schemaError(`Expected '${name}' [${includes[name]}] to include [${expectedIncludes[name]}]`);
    }
  });
}

export default {
  links,
  actionField,
  action,
  meta,
  listData,
  data,
  list,
  validateOne,
  validateList,
  validateError,
  mustHaveAttrs,
  mustHaveLinks,
  mustNotHaveLinks,
  mustHaveActions,
  mustNotHaveActions,
  mustHaveActionFields,
  mustInclude,
};
