import chai from 'chai';

import Core from '../../core';

import api from '../server';
import { seedUsers, seedOrders } from '../fixtures';
import schema from '../api_schema';

// import { User } from '../../src/models/user';

const { DBUtil } = Core.utils;
const { DB } = Core.models;

const { expect } = chai;

describe('Session API', () => {
  let users = [];
  let patchOrderID;
  let deleteOrderID;
  let user1;
  let user2;
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
    [user1, user2] = users;
    await seedOrders();
    s = await api.server;
  });

  it('gets a list of orders for the user', async () => {
    // must be signed in
    let response = await api.getAnon(s, '/orders');
    expect(response.statusCode).to.equal(401);

    // actions but no orders for user with no orders
    response = await api.get(s, user1, '/orders');
    expect(response.statusCode).to.equal(200);
    expect(response.result.data.length).to.equal(0);
    await schema.validateList(response.result);
    schema.mustHaveActions(response.result, listActions);

    // actions and orders for user with orders
    response = await api.get(s, user2, '/orders');
    expect(response.statusCode).to.equal(200);
    expect(response.result.data.length).to.equal(2);
    await schema.validateList(response.result);
    schema.mustHaveActions(response.result, listActions);
    schema.mustHaveLinks(response.result, listLinks);
    patchOrderID = response.result.data[0].id;
  });

  it('creates an order', async () => {
    const payload = {
      shoe_types: ['outdoor', 'liesure'],
      time_frame: 'thursday',
      add_ons: {
        polish: true,
      },
      estimated_price: 34.99,
      note: 'some note',
      street_address: '123 st',
      city: 'portland',
      state: 'or',
      postal_code: '97213',
    };
    const response = await api.post(s, user1, '/orders', payload);
    expect(response.statusCode).to.equal(200);
    await schema.validateOne(response.result);
    schema.mustHaveActions(response.result, detailActions);
    schema.mustHaveLinks(response.result, detailLinks);
    deleteOrderID = response.result.data.id;
  });

  it('update an existing order', async () => {
    const payload = {
      shoe_types: ['Indoor', 'Travel'],
      time_frame: 'A few days',
      note: 'a brand new note',
      estimated_price: 34.99,
      street_address: '123 st',
      city: 'portland',
      state: 'or',
      postal_code: '97213',
    };
    const response = await api.patch(s, user2, `/orders/${patchOrderID}`, payload);
    expect(response.statusCode).to.equal(200);
    await schema.validateOne(response.result);
    schema.mustHaveActions(response.result, detailActions);
    schema.mustHaveLinks(response.result, detailLinks);
    expect(response.result.data.attributes.note).to.equal(payload.note);
  });

  it('deletes an order', async () => {
    // user should have 1 order
    let response = await api.get(s, user1, '/orders');
    expect(response.statusCode).to.equal(200);
    expect(response.result.data.length).to.equal(1);
    await schema.validateList(response.result);
    schema.mustHaveActions(response.result, listActions);

    // delete it
    response = await api.del(s, user1, `/orders/${deleteOrderID}`);
    expect(response.statusCode).to.equal(204);

    // list should now return no orders
    response = await api.get(s, user1, '/orders');
    expect(response.statusCode).to.equal(200);
    expect(response.result.data.length).to.equal(0);
  });
});
