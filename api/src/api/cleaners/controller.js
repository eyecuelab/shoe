import Boom from '@hapi/boom';

import Core from '../../../core';

import BaseController from '../base';
import { Cleaner } from '../../models/cleaner';
import { CleanerSerializer } from '../../serializers/cleaner';

import { AccountEmailer } from '../../services/emailer';

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

  async create(req) {
    const existingCleaner = await Cleaner.findByUserID(req.currentUser.id);

    if (existingCleaner) {
      return Boom.badRequest('User already has cleaner profile');
    }

    const input = this.input(req);
    input.user_id = req.currentUser.id;
    if (req.payload.image_file) {
      const [err, imageUrl] = await To(this.uploadFile(
        req,
        req.payload.image_file,
        req.currentUser,
      ));
      if (err) {
        return Boom.badRequest(err);
      }
      input.image_url = imageUrl;
    }
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

    if (req.payload.image_file) {
      const [err, imageUrl] = await To(this.uploadFile(
        req,
        req.payload.image_file,
        req.currentUser,
      ));
      if (err) {
        return Boom.badRequest(err);
      }
      input.image_url = imageUrl;
    }

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
