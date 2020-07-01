import Boom from '@hapi/boom';
import uuid from 'uuid/v4';
import Core from '../../../core';

import BaseController from '../base';
import { Order } from '../../models/order';
import { OrderSerializer } from '../../serializers/order';

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
    const { orderID } = req.params;
    const { id: userID } = req.currentUser;

    const [err, data] = await To(Order.findByID(orderID));
    if (err) {
      return Boom.badRequest(err);
    }
    if (data.attributes.user_id !== userID) {
      return Boom.forbidden();
    }

    return OrderSerializer.jsonAPI(data, req);
  }

  async create(req) {
    const input = this.input(req);
    let imageUrl = '';
    if (req.payload.image_file) {
      imageUrl = await this.uploadFile(req, req.payload.image_file, req.currentUser);
    }

    const [err, item] = await To(Order.forge({
      ...input,
      image_url: imageUrl,
      user_id: req.currentUser.id,
      uuid: uuid(),
    }).save());
    if (err) {
      return Boom.badRequest(err);
    }
    return OrderSerializer.jsonAPI(item, req);
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

  stringify(props) {
    const data = { ...props };
    const jsonProps = ['add_ons', 'shoe_types'];
    jsonProps.forEach((k) => {
      if (data[k]) {
        data[k] = JSON.stringify(data[k]);
      }
    });
    return data;
  }

  input(req) {
    const keys = [
      'shoe_types', 'time_frame', 'note',
      'estimated_price', 'final_price', 'add_ons',
      'street_address', 'city', 'state', 'postal_code',
    ];
    const input = this.stringify(this.cleanInput(req, keys));

    return input;
  }
}

module.exports = new OrderController();
