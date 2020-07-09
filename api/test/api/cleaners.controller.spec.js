import chai from 'chai';

import Core from '../../core';

import api from '../server';
import { seedUsers, seedCleaners } from '../fixtures';
import schema from '../api_schema';

// import { User } from '../../src/models/user';

const { DBUtil } = Core.utils;
const { DB } = Core.models;

const { expect } = chai;

describe('Cleaners API', () => {
  let users = [];
  let user1;
  let user2;
  let user3;
  let cleaner1;
  let cleaner2;
  let s;
  const listActions = ['create'];
  const listLinks = ['self'];
  const detailActions = [
    'update',
    'delete',
  ];
  const detailLinks = ['self'];

  before(async () => {
    await DBUtil.clean(DB.knex);

    users = await seedUsers();
    [user1, user2, user3] = users;
    await seedCleaners();
    s = await api.server;
  });

  it('gets a list of cleaners', async () => {
    // must be signed in
    let response = await api.getAnon(s, '/cleaners');
    expect(response.statusCode).to.equal(401);

    // gets a list of cleaners
    response = await api.get(s, user1, '/cleaners');
    expect(response.statusCode).to.equal(200);
    expect(response.result.data.length).to.equal(1);
    cleaner1 = response.result.data;
    await schema.validateList(response.result);
    schema.mustHaveActions(response.result, listActions);
  });

  it('creates a cleaner', async () => {
    const { first_name, last_name, email } = user1;
    const payload = {
      first_name,
      last_name,
      email,
      street_address: '123 st',
      city: 'portland',
      state: 'or',
      postal_code: '97213',
      phone: '5555555555',
      business_name: 'cleaning service',
      bio: 'just cleaning shoes',
    };
    const response = await api.post(s, user1, '/cleaners', payload);
    expect(response.statusCode).to.equal(200);
    await schema.validateOne(response.result);
    schema.mustHaveActions(response.result, detailActions);
    schema.mustHaveLinks(response.result, detailLinks);
    cleaner2 = response.result.data;
  });

  it('update an existing cleaner', async () => {
    const payload = {
      ...cleaner2.attributes,
      business_name: 'new cleaning service',
    };
    const response = await api.patch(s, user1, `/cleaners/${cleaner2.id}`, payload);
    expect(response.statusCode).to.equal(200);
    await schema.validateOne(response.result);
    schema.mustHaveActions(response.result, detailActions);
    schema.mustHaveLinks(response.result, detailLinks);
    expect(response.result.data.attributes.business_name).to.equal(payload.business_name);
  });

  it('deletes a cleaner', async () => {
    // there should be 2 cleaners
    let response = await api.get(s, user1, '/cleaners');
    expect(response.statusCode).to.equal(200);
    expect(response.result.data.length).to.equal(2);
    await schema.validateList(response.result);

    // delete one
    response = await api.del(s, user1, `/cleaners/${cleaner2.id}`);
    expect(response.statusCode).to.equal(204);

    // list should now return 1 cleaner
    response = await api.get(s, user1, '/cleaners');
    expect(response.statusCode).to.equal(200);
    expect(response.result.data.length).to.equal(1);
  });
});
