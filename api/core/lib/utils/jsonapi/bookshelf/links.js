import lodash from 'lodash';
import inflection from 'inflection';
import qs from 'qs';

function urlConcat() {
  const parts = [];
  for (let i = 0; i < arguments.length; i++) {
    parts[i] = arguments[i];
  }
  return parts.join('/');
}

// Create links object, for pagination links.
// Since its used only inside other functions in this model, its not exported
function pagLinks(linkOpts) {
  const { baseUrl, type, pag } = linkOpts;
  let { query } = linkOpts;
  query = query === void 0 ? {} : query;
  if (pag === undefined) {
    return undefined;
  }
  const { offset, limit, total } = pag;
  // All links are based on the resource type
  let baseLink = urlConcat(baseUrl, inflection.pluralize(type));
  // Stringify the query string without page element
  query = lodash.omit(query, ['page', 'page[limit]', 'page[offset]']);
  baseLink = baseLink + '?' + qs.stringify(query, { encode: false });
  const obj = {};
  // Add leading pag links if not at the first page
  if (offset > 0) {
    obj.first = () => {
      const page = { page: { limit, offset: 0 } };
      return baseLink + qs.stringify(page, { encode: false });
    };
    obj.prev = () => {
      const page = { page: { limit, offset: offset - limit } };
      return baseLink + qs.stringify(page, { encode: false });
    };
  }
  // Add trailing pag links if not at the last page
  if (total && (offset + limit < total)) {
    obj.next = () => {
      const page = { page: { limit, offset: offset + limit } };
      return baseLink + qs.stringify(page, { encode: false });
    };
    obj.last = () => {
      // Avoiding overlapping with the penultimate page
      let lastLimit = (total - (offset % limit)) % limit;
      // If the limit fits perfectly in the total, reset it to the original
      lastLimit = lastLimit === 0 ? limit : lastLimit;
      const lastOffset = total - lastLimit;
      const page = { page: { limit: lastLimit, offset: lastOffset } };
      return baseLink + qs.stringify(page, { encode: false });
    };
  }
  return !lodash.isEmpty(obj) ? obj : undefined;
}

// Creates top level links object, for primary data and pagination links.
function topLinks(linkOpts) {
  const { baseUrl, type, pag } = linkOpts;
  const obj = {
    self: urlConcat(baseUrl, inflection.pluralize(type)),
  };
  // Build pagination if available
  if (!lodash.isNil(pag)) {
    // Support Bookshelf's built-in paging parameters
    if (!lodash.isNil(pag.rowCount)) {
      pag.total = pag.rowCount;
    }
    // Only add pagination links when more than 1 page
    if (!lodash.isNil(pag.total) && pag.total > 0 && pag.total > pag.limit) {
      lodash.assign(obj, pagLinks(linkOpts));
    }
  }
  return obj;
}
exports.topLinks = topLinks;

// Creates links object for a resource
function dataLinks(linkOpts) {
  const { baseUrl, type } = linkOpts;
  const baseLink = urlConcat(baseUrl, inflection.pluralize(type));
  return {
    self: resource => urlConcat(baseLink, resource.id),
  };
}
exports.dataLinks = dataLinks;

// Creates links object for a relationship
function relationshipLinks(linkOpts, related) {
  const { baseUrl, type } = linkOpts;
  const baseLink = urlConcat(baseUrl, inflection.pluralize(type));
  return {
    self: (resource, current, parent) => urlConcat(baseLink, parent.id, 'relationships', related),
    related: (resource, current, parent) => urlConcat(baseLink, parent.id, related),
  };
}
exports.relationshipLinks = relationshipLinks;

// Creates links object for a related resource, to be used for the included's array
function includedLinks(linkOpts) {
  const { baseUrl, type } = linkOpts;
  const baseLink = urlConcat(baseUrl, inflection.pluralize(type));
  return {
    self: (primary, current) => urlConcat(baseLink, current.id),
  };
}

exports.includedLinks = includedLinks;
