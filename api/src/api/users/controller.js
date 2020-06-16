import Boom from '@hapi/boom';

import Core from '../../../core';

import BaseController from '../base';
import { User } from '../../models/user';
import { UserSerializer } from '../../serializers/user';

import { AccountEmailer } from '../../services/emailer';

const { S3API } = Core.integrations.S3API;
const { GeneralUtil } = Core.utils;
const { To } = GeneralUtil;

const CONTROLLER = 'UsersController';

class UsersController extends BaseController {
  constructor() {
    super(CONTROLLER);
    this.accountEmailer = AccountEmailer.create();
    this.bindAll(this);
  }

  async getList(req) {
    const scopes = [];
    if (req.query.search) {
      scopes.push(User.search(['first_name', 'last_name', 'email'], req.query.search));
    }
    const list = await this.paginate(req, User, scopes);

    return UserSerializer.jsonAPI(list, req);
  }

  async get(req) {
    const item = await this.fetch(req, true);

    return UserSerializer.jsonAPI(item, req);
  }

  // async create(req) {
  //   const input = this.input(req);
  //   const { password } = req.payload;
  //   input.password = User.encrypt(password);
  //   const [err, item] = await To(User.forge(input).save());
  //   if (err) {
  //     return Boom.badRequest(err);
  //   }
  //
  //   await this.accountEmailer.sendSignupEmail(item);
  //
  //   return UserSerializer.jsonAPI(item, req);
  // }

  async update(req) {
    let item = req.currentUser;
    const input = this.input(req);
    if (req.payload.image_file) {
      const imageUrl = await this.uploadFile(req, req.payload.image_file, item);
      item = await this.updateInstance(req, item, { image_url: imageUrl });
    }

    const { password } = req.payload;
    if (password && password.length) {
      input.password = User.encrypt(password);
    }
    const [err, updated] = await To(item.save(input, { patch: true }));
    if (err) {
      return Boom.badRequest(err);
    }

    return UserSerializer.jsonAPI(updated, req);
  }

  // async del(req, h) {
  //   const item = await this.fetch(req);
  //   await item.save(
  //     { deleted_at: Core.models.DB.knex.fn.now() },
  //     { patch: true },
  //   );
  //
  //   return h.response().code(204);
  // }

  // Helpers

  input(req) {
    const keys = [
      'first_name', 'last_name', 'email',
    ];

    const input = this.cleanInput(req, keys);
    if (input.email) {
      input.email = input.email.toLowerCase();
    }

    return input;
  }

  fetch(req) {
    return this.getByID(req.params.userID, User);
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

module.exports = new UsersController();
