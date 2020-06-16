import Boom from '@hapi/boom';
import DB from './db';

export class BaseModel extends DB.Model {
  static create(data, options = {}) {
    return this.forge(data).save(null, options);
  }

  // Find Model by some properties
  static findOne(selectData, filter = {}) {
    return this.forge(selectData).where(filter).fetch();
  }

  // Find many Model by filter
  static findAll(filter = {}, pagination = {}) {
    return this.forge()
      .where(filter)
      .orderBy(this.idAttribute)
      .fetchPage(pagination);
  }

  static findByID(id) {
    return this.findOne({}, {
      id,
    });
  }

  static async get(id, useBoom = true) {
    const model = await this.findByID(id);

    if (model == null) {
      const msg = `get ${this.TABLE_NAME} Not Found: ${id}`;
      if (useBoom) {
        return Boom.notFound(msg);
      }

      throw new Error(msg);
    }

    return model.attributes;
  }

  static destroyById(id, options = {}) {
    return this.destroyBy({
      [this.prototype.idAttribute]: id,
    }, options);
  }

  static destroyBy(filter, options = {}) {
    return this.forge(filter)
      .destroy(options);
  }

  static async updateById(id, data, options = { method: 'update', patch: true }) {
    const model = await this.forge({
      [this.prototype.idAttribute]: id,
    }).fetch();

    return model ? model.save(data, options) : undefined;
  }

  static async upsert(selectData, updateData) {
    const existingModel = await this.findOne(selectData);
    if (existingModel) {
      return existingModel.set(updateData).save();
    }
    return new this(updateData).save();
  }
}

export default BaseModel;
