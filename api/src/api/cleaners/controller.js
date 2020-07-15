import Boom from '@hapi/boom';

import Core from '../../../core';

import BaseController from '../base';
import { Cleaner } from '../../models/cleaner';
import { CleanerSerializer } from '../../serializers/cleaner';

import { AccountEmailer } from '../../services/emailer';
import Order from '../../models/order';
import OrderSerializer from '../../serializers/order';
import Quote from '../../models/quote';

const { S3API } = Core.integrations.S3API;
const { GeneralUtil } = Core.utils;
const { To } = GeneralUtil;

const CONTROLLER = 'CleanersController';

class CleanersController extends BaseController {
  constructor() {
    super(CONTROLLER);
    this.accountEmailer = AccountEmailer.create();
    this.bindAll(this);
  }

  async getList(req) {
    const scopes = [];
    if (req.query.search) {
      scopes.push(Cleaner.search(['first_name', 'last_name', 'email', 'business_name'], req.query.search));
    }
    const list = await this.paginate(req, Cleaner, scopes);

    return CleanerSerializer.jsonAPI(list, req);
  }

  async get(req) {
    const item = await this.fetch(req, true);

    return CleanerSerializer.jsonAPI(item, req);
  }

  async getOrders(req) {
    const { id: userID } = req.currentUser;
    const [err, cleaner] = await To(this.fetch(req));
    if (err) {
      return Boom.badRequest(err);
    }
    if (cleaner.attributes.user_id !== userID) {
      return Boom.forbidden('Only cleaner owner can request cleaner orders');
    }
    const scopes = [Order.publishedScope];
    if (req.query.quotable) {
      scopes.push(Order.quotableScope);
    } else if (req.query.quoted) {
      scopes.push(Order.quotableScope(cleaner.id));
    } else if (req.query.in_progress) {
      scopes.push(Order.cleanerScope(cleaner.id));
      scopes.push(Order.inProgressScope);
    } else if (req.query.completed) {
      scopes.push(Order.cleanerScope(cleaner.id));
      scopes.push(Order.completedScope);
    } else {
      scopes.push(Order.cleanerScope(cleaner.id));
    }

    const items = await this.paginate(req, Order, scopes);
    return OrderSerializer.jsonAPI(items, req);
  }

  async getOrderDetail(req) {
    const { orderID } = req.params;
    const [error, cleaner] = await To(this.fetch(req));
    if (error) {
      return Boom.badRequest(error);
    }
    if (cleaner.attributes.user_id !== req.currentUser.id) {
      return Boom.forbidden();
    }
    const [err, order] = await To(Order.findByID(orderID));

    if (err) {
      return Boom.badRequest(err);
    }
    if (order.attributes.cleaner_id && order.attributes.cleaner_id !== cleaner.id) {
      return Boom.forbidden();
    }

    order.relations.cleaner = cleaner;

    return OrderSerializer.jsonAPI(order, req);
  }

  async updateOrder(req) {
    const { orderID } = req.params;
    const [error, cleaner] = await To(this.fetch(req));
    if (error) {
      return Boom.badRequest(error);
    }
    if (cleaner.attributes.user_id !== req.currentUser.id) {
      return Boom.forbidden();
    }
    const [err, order] = await To(Order.findByID(orderID));
    if (err) {
      return Boom.badRequest(err);
    }
    if (order.attributes.cleaner_id !== cleaner.id) {
      return Boom.forbidden();
    }
    const input = this.orderInput(req);

    const [er, updated] = await To(order.save(input, { patch: true }));
    if (er) {
      return Boom.badData(er);
    }

    updated.relations.cleaner = cleaner;

    return OrderSerializer.jsonAPI(updated, req);
  }

  async quoteOrder(req, h) {
    const quote = await Quote.findByCleanerAndOrder(req.params);
    if (quote) {
      return Boom.forbidden('Quote already submitted');
    }
    const { orderID } = req.params;
    const [error, cleaner] = await To(this.fetch(req));
    if (error) {
      return Boom.badRequest(error);
    }
    if (cleaner.attributes.user_id !== req.currentUser.id) {
      return Boom.forbidden();
    }
    const [err, order] = await To(Order.findByID(orderID));

    if (err) {
      return Boom.badRequest(err);
    }
    if (order.attributes.cleaner_id) {
      return Boom.forbidden();
    }

    const input = this.quoteInput(req);

    input.order_id = orderID;
    input.cleaner_id = cleaner.id;

    const [er] = await To(Quote.forge(input).save());
    if (err) {
      return Boom.badData(er);
    }

    return h.response().code(204);
  }

  async create(req) {
    const existingCleaner = await Cleaner.findByUserID(req.currentUser.id);

    if (existingCleaner) {
      return Boom.badRequest('User already has cleaner profile');
    }

    const input = this.input(req);
    input.user_id = req.currentUser.id;

    const [err, item] = await To(Cleaner.forge(input).save());
    if (err) {
      return Boom.badRequest(err);
    }

    return CleanerSerializer.jsonAPI(item, req);
  }

  async update(req) {
    const item = await this.fetch(req);
    if (item.attributes.user_id !== req.currentUser.id) {
      return Boom.forbidden('Cannot update unless owner');
    }

    const input = this.input(req);

    const [err, updated] = await To(item.save(input, { patch: true }));
    if (err) {
      return Boom.badRequest(err);
    }

    return CleanerSerializer.jsonAPI(updated, req);
  }

  async del(req, h) {
    const item = await this.fetch(req);

    if (item.attributes.user_id !== req.currentUser.id) {
      return Boom.forbidden('Only owner can delete');
    }
    await item.save(
      { deleted_at: Core.models.DB.knex.fn.now() },
      { email: `deleted_at_${Core.models.DB.knex.fn.now()}_${item.attributes.email}` },
      { patch: true },
    );

    return h.response().code(204);
  }

  // Helpers

  input(req) {
    const keys = [
      'business_name', 'bio', 'street_address', 'city', 'state',
      'postal_code', 'email', 'first_name', 'last_name', 'phone',
      'image_url',
    ];

    const input = this.cleanInput(req, keys);
    if (input.email) {
      input.email = input.email.toLowerCase();
    }

    return input;
  }

  orderInput(req) {
    const keys = [
      'shoes_picked_up',
      'shoes_cleaned',
      'shoes_polished',
      'request_payment',
      'shoes_dropped_off',
    ];

    const input = this.cleanInput(req, keys);
    if (input.email) {
      input.email = input.email.toLowerCase();
    }

    return input;
  }


  quoteInput(req) {
    const keys = [
      'quoted_price',
      'expires_at',
      'delivery_by',
    ];

    const input = this.cleanInput(req, keys);
    if (input.email) {
      input.email = input.email.toLowerCase();
    }

    return input;
  }

  fetch(req) {
    return this.getByID(req.params.cleanerID, Cleaner);
  }

  async uploadFile(req, fileData, user) {
    const { filename, headers } = fileData.hapi;
    /* eslint-disable-next-line no-underscore-dangle */
    const buffer = fileData._data;
    const s3Integration = S3API.create();
    const uploadResponse = await s3Integration.uploadStream(
      buffer,
      `users/${user.id}/${filename}`,
      null,
      // TODO: need to set private and presign on fetch
      { isPublic: true, contentType: headers['content-type'] },
    );

    return uploadResponse.Location;
  }
}

module.exports = new CleanersController();
