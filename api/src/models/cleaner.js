import Joi from '@hapi/joi';
import Promise from 'bluebird';
import Boom from '@hapi/boom';
import uuidv4 from 'uuid/v4';

import { BaseModel } from './base';
import { User } from './user';
import { Order } from './order';
// import JSONAPIUtil from '../utils/jsonapi';


const TABLE_NAME = 'cleaners';

export class Cleaner extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  get tableName() {
    return TABLE_NAME;
  }

  get soft() {
    return ['deleted_at'];
  }

  // Relations
  user() {
    return this.belongsTo(User);
  }

  orders() {
    return this.belongsToMany(Order);
  }

  static validate(cleaner) {
    const schema = Joi.object().keys({
      uuid: Joi.string().min(36).max(36).required(),
      business_name: Joi.string().required(),
      image_url: Joi.string().allow(''),
      bio: Joi.string().allow(''),
      street_address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().length(2).required(),
      postal_code: Joi.string.required(),
      phone: Joi.string.required(),
      email: Joi.string().email().required(),
      user_id: Joi.number().required(),
    });
    return Joi.validate(cleaner, schema);
  }

  static async createOne(props) {
    const defaults = {
      uuid: uuidv4(),
      image_url: '',
      bio: '',
    };
    const data = { ...defaults, ...props };
    const { error } = this.validate(data);
    if (error) {
      return Promise.reject(Boom.badRequest('Cleaner validation failed', error.message, null));
    }

    const cleaner = await Cleaner.findByUserID(data.email);
    if (cleaner != null) {
      return Promise.reject(Boom.conflict(`User with email: ${data.email}, already exists`));
    }

    return this.create(data);
  }

  static findByUserID(userID) {
    return this.findOne({}, {
      user_id: userID,
    });
  }

  static signupAttrs(data) {
    return {
      uuid: uuidv4(),
      business_name: data.first_name,
      street_address: data.street_address,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      phone: data.phone,
      email: data.email,
      user_id: data.user_id,
    };
  }

  static async signup({ createdBy, ...data }) {
    const cleaner = await this.findByUserID(createdBy);
    if (cleaner) {
      throw Boom.badRequest('Account with this email is already registered as a cleaner');
    }

    const attrs = this.signupAttrs({ ...data, user_id: createdBy });

    return this.forge(attrs).save();
  }
}

export default Cleaner;
