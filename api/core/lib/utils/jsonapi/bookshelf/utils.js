import lodash from 'lodash';
import links from './links';
import extras from './extras';

// Recursively adds data-related properties to the
// template to be sent to the serializer
function processSample(info, sample) {
  var bookOpts = info.bookOpts, linkOpts = info.linkOpts;
  var enableLinks = bookOpts.enableLinks;
  var template = {
      // Add list of valid attributes
      attributes: getAttrsList(sample, bookOpts)
  };
  // Nested relations (recursive) template generation
  lodash.forOwn(sample.relations, function (relSample, relName) {
    if (!relationAllowed(bookOpts, relName)) {
        return;
    }
    var relLinkOpts = lodash.assign(lodash.clone(linkOpts), { type: relName });
    var relTemplate = processSample({ bookOpts: bookOpts, linkOpts: relLinkOpts }, relSample);
    relTemplate.ref = 'id'; // Add reference in nested resources
    // Related links
    if (enableLinks) {
        relTemplate.relationshipLinks = links.relationshipLinks(linkOpts, relName);
        relTemplate.includedLinks = links.includedLinks(relLinkOpts);
    }
    // Include links as compound document
    if (!includeAllowed(bookOpts, relName)) {
      relTemplate.included = false;
    }
    template[relName] = relTemplate;
    template.attributes.push(relName);
  });
  return template;
}

// Convert any data into a model representing
// a complete sample to be used in the template generation
function sample(data) {
  if (extras.isModel(data)) {
    // Override type because we will overwrite relations
    var sampled = lodash.cloneDeep(lodash.omit(data, 'relations'));
    sampled.relations = lodash.mapValues(data.relations, sample);
    return sampled;
  } else if (extras.isCollection(data)) {
    var first = data.head();
    var rest = data.tail();
    return lodash.reduce(rest, mergeSample, sample(first));
  }
  else {
    return {};
  }
}

// Start the data processing with top level information,
// then handle resources recursively in processSample
function processData(info, data) {
  const { enableLinks } = info.bookOpts;
  const { linkOpts } = info;
  const template = processSample(info, sample(data));
  if (enableLinks) {
    template.dataLinks = links.dataLinks(linkOpts);
    template.topLevelLinks = links.topLinks(linkOpts);
  }
  return template;
}
exports.processData = processData;

// Merge two models into a representation of both
function mergeSample(main, toMerge) {
  var sampled = sample(toMerge);
  main.attributes = lodash.merge(main.attributes, sampled.attributes);
  main.relations = lodash.merge(main.relations, sampled.relations);
  return main;
}

function matches(matcher, str) {
  var reg;
  if (typeof matcher === 'string') {
    reg = RegExp("^" + lodash.escapeRegExp(matcher) + "$");
  }
  else {
    reg = matcher;
  }
  return reg.test(str);
}

// Retrieve model's attribute names
// following filtering rules
function getAttrsList(data, bookOpts) {
  let idAttr = data.idAttribute;
  if (lodash.isString(idAttr)) {
    idAttr = [idAttr];
  } else if (lodash.isUndefined(idAttr)) {
    idAttr = [];
  }
  var attrs = lodash.keys(data.attributes);
  var outputVirtuals = data.outputVirtuals;
  if (!lodash.isNil(bookOpts.outputVirtuals)) {
    outputVirtuals = bookOpts.outputVirtuals;
  }
  if (data.virtuals && outputVirtuals) {
    attrs = attrs.concat(lodash.keys(data.virtuals));
  }
  var _a = bookOpts.attributes, attributes = _a === void 0 ? { omit: idAttr } : _a;
  // cast it to the object version of the option
  if (attributes instanceof Array) {
    attributes = { include: attributes };
  }
  var omit = attributes.omit, include = attributes.include;
  return lodash.filter(attrs, function (attr) {
    var included = true;
    var omitted = false;
    if (include) {
      included = lodash.some(include, function (m) { return matches(m, attr); });
    }
    if (omit) {
      omitted = lodash.some(omit, function (m) { return matches(m, attr); });
    }
    // `omit` has more precedence than `include` option
    return !omitted && included;
  });
}

// Based on Bookshelf options, determine if a relation must be included
function relationAllowed(bookOpts, relName) {
  const { relations } = bookOpts;
  if (typeof relations === 'boolean') {
    return relations;
  }
  const { fields } = relations;
  return !fields || lodash.includes(fields, relName);
}

// Based on Bookshelf options, determine if a relation must be included
function includeAllowed(bookOpts, relName) {
  const { relations } = bookOpts;
  if (typeof relations === 'boolean') {
    return relations;
  }
  const { fields, included } = relations;
  if (typeof included === 'boolean') {
    return included;
  }
  // If included is an array, only allow relations that are in that array
  let allowed = included;
  if (fields) {
    // If fields specified, ensure that the included relations
    // are listed as one of the relations to be serialized
    allowed = lodash.intersection(fields, included);
  }
  return lodash.includes(allowed, relName);
}
// Convert a bookshelf model or collection to
// json adding the id attribute if missing
function toJSON(data) {
  let json = null;
  if (extras.isModel(data)) {
    json = data.toJSON({ shallow: true }); // serialize without the relations
    // When idAttribute is a composite id, calling .id returns `undefined`
    const idAttr = data.idAttribute;
    if (lodash.isArray(idAttr)) {
      // the id will be the values in order separated by comma
      data.id = lodash.map(idAttr, attr => data.attributes[attr]).join(',');
    }
    // Assign the id for the model if it's not present already
    if (!lodash.has(json, 'id')) {
      json.id = data.id;
    }
    lodash.update(json, 'id', lodash.toString);
    // Loop over model relations to call toJSON recursively on them
    lodash.forOwn(data.relations, (relData, relName) => {
      json[relName] = toJSON(relData);
    });
  } else if (extras.isCollection(data)) {
    // Run a recursive toJSON on each model of the collection
    json = data.map(toJSON);
  }
  return json;
}

exports.toJSON = toJSON;
