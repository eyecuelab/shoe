import Boom from '@hapi/boom';
import Joi from '@hapi/joi';

import Core from '../../core';

const { GeneralUtil, LogUtil } = Core.utils;
const { To } = GeneralUtil;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ROUTING_HELPERS = {
  joi: {
    email: Joi.string()
      .email({ minDomainSegments: 2 })
      .lowercase()
      .error(new Error('Must be a valid email address')),
  },
};

class BaseController {
  constructor(controllerName) {
    this.controllerName = controllerName;
    this.log = LogUtil.getLogger(controllerName);
    this.log.debug('constructor');
  }

  bindAll(self, context) {
    GeneralUtil.BindAll(self, context);
  }

  get DB() {
    return Core.models.DB;
  }

  get routing() {
    return ROUTING_HELPERS;
  }

  currentUserID(req) {
    return req.auth.credentials.user_id;
  }

  async getByScope(scope, withRelated) {
    const [err, model] = await To(scope.fetch({ withRelated }));
    if (err) {
      this.log.error(err);
      throw Boom.badRequest(err);
    }

    if (model == null) {
      throw Boom.notFound();
    }

    return model;
  }

  async getBy(attrs, Model, withRelated) {
    const [err, model] = await To(Model.forge(attrs).fetch({ withRelated }));
    if (err) {
      this.log.error(err);
      throw Boom.badRequest(err);
    }

    if (model == null) {
      throw Boom.notFound(`Not Found: ${Model.TABLE_NAME} ${JSON.stringify(attrs)}`);
    }

    return model;
  }

  getByID(id, Model, withRelated) {
    return this.getBy({ id }, Model, withRelated);
  }

  cleanInput(req, allowedKeys) {
    const data = {};

    allowedKeys.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(req.payload, k)) {
        data[k] = req.payload[k];
      }
    });

    return data;
  }

  paginate(req, Model, scopes = [], opts = {}) {
    const {
      filtering, select,
    } = opts;
    let { pagination, sorting, related } = opts;

    if (!pagination) {
      let pageSize = req.query.pageSize || this.pageSize || DEFAULT_PAGE_SIZE;
      if (pageSize > MAX_PAGE_SIZE) {
        pageSize = MAX_PAGE_SIZE;
      }
      pagination = { pageSize, page: req.query.page };
    }
    if (!related) {
      related = [];
    }

    if (!sorting) {
      sorting = req.query.sorting || [`${Model.idAttribute || 'id'}`, 'desc'];
    }

    return Model
      .query((qb) => {
        // qb.debug(true);
        if (select) {
          qb.select(select);
        }
        scopes.forEach((scope) => scope(qb));

        if (filtering != null) {
          Object.keys(filtering).forEach((k) => {
            const v = filtering[k];
            const op = Array.isArray(v) ? 'in' : '=';
            qb.where(k, op, v);
          });
        }

        if (sorting) {
          const [sortKey, sortOrder] = sorting;
          qb.orderBy(sortKey, sortOrder);
        }
      })
      .fetchPage({
        ...pagination,
        withRelated: related,
      });
  }

  filtering(req, available) {
    const filters = {};
    Object.keys(available).forEach((k) => {
      const val = req.query[k];
      if (val !== undefined) {
        filters[k] = val;
      } else if (available[k].default !== undefined) {
        filters[k] = available[k].default;
      }
    });

    return filters;
  }

  isTruthy(v) {
    return v === true || v === 'true' || v === '1' || v === 1 || v === 'yes';
  }

  isFalsy(v) {
    return v === false || v === 'false' || v === '0' || v === 0 || v === 'no';
  }

  async updateInstance(req, item, input) {
    const [err, updated] = await To(item.update(this.currentUserID(req), input));
    if (err) {
      throw Boom.badRequest(err);
    }

    return updated;
  }
}

module.exports = BaseController;
