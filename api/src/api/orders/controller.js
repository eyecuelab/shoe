import Boom from '@hapi/boom';
import uuid from 'uuid/v4';
import Core from '../../../core';

import BaseController from '../base';
import { Order } from '../../models/order';
import { OrderSerializer } from '../../serializers/order';
// import Quote from '../../models/quote';

const { S3API } = Core.integrations.S3API;
const { GeneralUtil } = Core.utils;
const { To } = GeneralUtil;


const CONTROLLER = 'OrderController';

class OrderController extends BaseController {
  constructor() {
    super(CONTROLLER);
    this.bindAll(this);
  }

  async getList(req) {
    const { id } = req.currentUser;
    const data = await Order.findOrdersForUserID(id);

    return OrderSerializer.jsonAPI(data, req);
  }

  async get(req) {
    const { id: userID } = req.currentUser;

    const [err, data] = await To(this.fetch(req));
    if (err) {
      return Boom.badRequest(err);
    }
    if (data.attributes.user_id !== userID) {
      return Boom.forbidden();
    }

    // if (data.attributes.published_at) {
    //   const quotes = await Quote.findAllForOrder(req.params);

    //   data.relations.quotes = quotes.models;
    // }

    return OrderSerializer.jsonAPI(data, req);
  }

  async create(req) {
    const input = this.input(req);
    input.user_id = req.currentUser.id;

    const [err, item] = await To(Order.forge({
      ...input,
      uuid: uuid(),
    }).save());
    if (err) {
      return Boom.badRequest(err);
    }
    return OrderSerializer.jsonAPI(item, req);
  }

  async update(req) {
    const [er, item] = await To(this.fetch(req));
    if (er) {
      return Boom.badRequest(er);
    }
    if (item.attributes.user_id !== req.currentUser.id) {
      return Boom.forbidden();
    }
    const input = this.input(req);

    const [error, updated] = await To(item.save(input, { patch: true }));

    if (error) {
      return Boom.badRequest(error);
    }

    return OrderSerializer.jsonAPI(updated, req);
  }

  async del(req, h) {
    const { orderID } = req.params;
    const { id: userID } = req.currentUser;

    const [er, item] = await To(Order.findByID(orderID));
    if (er) {
      return Boom.badRequest(er);
    }

    if (item.attributes.user_id !== userID) {
      return Boom.forbidden();
    }

    await item.save(
      { deleted_at: Core.models.DB.knex.fn.now() },
      { patch: true },
    );

    return h.response().code(204);
  }
  // Helpers

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

  input(req) {
    const keys = [
      'shoe_types', 'time_frame', 'note', 'published_at',
      'cleaner_id', 'quote_accepted_at', 'image_url',
      'estimated_price', 'final_price', 'add_ons',
      'street_address', 'city', 'state', 'postal_code',
    ];
    const input = this.cleanInput(req, keys);

    return input;
  }

  fetch(req) {
    return this.getByID(req.params.orderID, Order);
  }
}

module.exports = new OrderController();
