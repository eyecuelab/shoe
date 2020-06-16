import lodash from 'lodash';
import inflection from 'inflection';
import serializer from '../serializer';
import utils from './utils';

// Mapper class for Bookshelf sources
class Bookshelf {
  constructor(baseUrl, serialOpts) {
    this.baseUrl = baseUrl;
    this.serialOpts = serialOpts;
  }

  // Maps bookshelf data to a JSON-API 1.0 compliant object
  map(data, type, mapOpts) {
    if (mapOpts === undefined) {
      mapOpts = {};
    }
    // Set default values for the options
    const {
      attributes, pagination, query, meta, outputVirtuals,
    } = mapOpts;
    let {
      keyForAttr, relations, typeForModel, enableLinks,
    } = mapOpts;
    keyForAttr = keyForAttr === undefined ? lodash.identity : keyForAttr;
    relations = relations === undefined ? true : relations;
    if (typeForModel === undefined) {
      typeForModel = (attr) => inflection.pluralize(attr);
    }
    enableLinks = enableLinks === undefined ? true : enableLinks;

    const bookOpts = {
      attributes,
      keyForAttr,
      relations,
      typeForModel,
      enableLinks,
      pagination,
      query,
      outputVirtuals,
    };
    const linkOpts = { baseUrl: this.baseUrl, type, pag: pagination };
    const info = { bookOpts, linkOpts };
    const template = utils.processData(info, data);
    const typeForAttribute = typeof typeForModel === 'function'
      ? typeForModel
      : (attr) => (typeForModel[attr] || inflection.pluralize(attr)); // pluralize when falsy
    // Override the template with the provided serializer options
    lodash.assign(
      template,
      { typeForAttribute, keyForAttribute: keyForAttr, meta },
      this.serialOpts);
    // Return data in JSON API format
    const json = utils.toJSON(data);

    return new serializer.Serializer(type, template).serialize(json);
  }
}

exports.Bookshelf = Bookshelf;
