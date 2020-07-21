import Boom from '@hapi/boom';
import Core from '../../core';

export class BaseModel extends Core.models.DB.Model {
  static create(data, options = {}) {
    return this.forge(data).save(null, options);
  }

  static findOne(selectData, filter = {}) {
    return this.forge(selectData).where(filter).fetch();
  }

  static async any(filter) {
    const count = await this.where(filter).count();
    return Number.parseInt(count, 10) > 0;
  }

  static findAll(filter = {}, pagination = {}) {
    return this.forge()
      .where(filter)
      .orderBy(this.idAttribute)
      .fetchPage(pagination);
  }

  static findAllWhereIn(param, array) {
    return this.query((qb) => {
      qb.whereIn(param, array);
    }).fetchAll();
  }

  static search(keys, query) {
    return (qb) => {
      if (query.length > 0) {
        const qs = [];
        keys.forEach((key) => {
          qs.push(`${this.TABLE_NAME}.${key} ilike ?`);
        });
        qb.whereRaw(`(${qs.join(' or ')})`, qs.map(() => `%${query}%`));
      }
    };
  }

  static findByID(id) {
    return this.findOne({}, {
      id,
    });
  }

  static async get(id) {
    const model = await this.findByID(id);

    if (model == null) {
      return Boom.notFound(`get Not Found: ${id}`);
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

  static updateById(id, data, options = {}) {
    return this.forge({
      [this.prototype.idAttribute]: id,
    }).fetch(options)
      .then((model) => (model ? model.save(data, options) : undefined));
  }

  async update(userID, input) {
    const data = {
      ...input,
      updated_by: userID,
      updated_at: new Date(),
    };

    const item = await this.save(data, { patch: true });
    item.attributes.updated_at = new Date();

    return item;
  }

  static async upsert(selectData, updateData) {
    const existingModel = await this.findOne(selectData);
    if (existingModel) {
      return existingModel.set(updateData).save();
    }
    return new this(updateData).save();
  }

  softDel(userID) {
    if (this.attributes.deleted_at) {
      return null;
    }
    return this.save(
      {
        deleted_by: userID,
        deleted_at: new Date(),
      },
      { patch: true },
    );
  }
}

export default BaseModel;
