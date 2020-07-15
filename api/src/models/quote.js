import Joi from '@hapi/joi';
import Promise from 'bluebird';
import Boom from '@hapi/boom';
import uuidv4 from 'uuid/v4';

import { BaseModel } from './base';
import { Order } from './order';
import Cleaner from './cleaner';
// import JSONAPIUtil from '../utils/jsonapi';


const TABLE_NAME = 'quotes';

export class Quote extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  get tableName() {
    return TABLE_NAME;
  }

  // Relations
  order() {
    return this.belongsTo(Order);
  }

  cleaner() {
    return this.belongsTo(Cleaner);
  }

  static validate(quote) {
    const schema = Joi.object().keys({
      uuid: Joi.string().min(36).max(36).required(),
      order_id: Joi.number.min(1).required(),
      cleaner_id: Joi.number.min(1).required(),
      quoted_price: Joi.number().required(),
      expires_at: Joi.string().required(),
      delivery_by: Joi.string().required(),
    });
    return Joi.validate(quote, schema);
  }

  static async createOne(props) {
    const defaults = {
      uuid: uuidv4(),
    };
    const data = { ...defaults, ...props };
    const { error } = this.validate(data);
    if (error) {
      return Promise.reject(Boom.badRequest('Quote validation failed', error.message, null));
    }

    return this.create(data);
  }

  static findByCleanerAndOrder({ cleanerID, orderID }) {
    return this.findOne({}, {
      cleaner_id: cleanerID,
      order_id: orderID,
    });
  }

  static findAllForOrder({ orderID }) {
    return this.findAll({
      order_id: orderID,
    });
  }
}

export default Quote;
