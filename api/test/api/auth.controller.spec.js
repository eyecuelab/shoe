import chai from 'chai';

import Core from '../../core';

import api from '../server';
import { seedUsers } from '../fixtures';
import schema from '../api_schema';

// import { User } from '../../src/models/user';

const { DBUtil } = Core.utils;
const { DB } = Core.models;

const { expect } = chai;

describe('Session API', () => {
  let users = [];
  let user;
  let s;
  const signedInActions = ['logout', 'update'];
  const signedInLinks = [
    'self', 'orders',
  ];

  before(async () => {
    await DBUtil.clean(DB.knex);

    users = await seedUsers();
    [user] = users;
    s = await api.server;
  });

  it('login', async () => {
    // no password rejects
    const payload = { email: user.email };
    let response = await api.postAnon(s, '/login', payload);
    response = await api.postAnon(s, '/login', payload);

    expect(response.statusCode).to.equal(400);
    expect(response.result.message).to.equal('child "password" fails because ["password" is required]');

    // case sensitive password
    response = await api.postAnon(s, '/login', { ...payload, password: 'THESHOE' });
    expect(response.statusCode).to.equal(401);
    expect(response.result.message).to.equal('Wrong email/password');

    // successful login
    response = await api.postAnon(s, '/login', { ...payload, password: 'theshoe' });
    await schema.validateOne(response.result);
    schema.mustHaveActions(response.result, signedInActions);
    schema.mustHaveLinks(response.result, signedInLinks);
  });

  it('get current auth session jsonapi', async () => {
    const response = await api.get(s, user, '/session');

    expect(response.statusCode).to.equal(200);
    await schema.validateOne(response.result);
    schema.mustHaveActions(response.result, signedInActions);
    schema.mustHaveLinks(response.result, signedInLinks);
  });

  it('get anon session jsonapi', async () => {
    const response = await api.getAnon(s, '/');

    expect(response.statusCode).to.equal(200);
    await schema.validateOne(response.result);
    schema.mustHaveActions(response.result,
      ['login', 'signup']);
  });

  it('signs up a user', async () => {
    const payload = {
      first_name: 'Edward',
      last_name: 'Scissor Hands',
      email: 'test@example.com',
      password: 'testPassword',
    };
    const response = await api.postAnon(s, '/signup', payload);

    expect(response.statusCode).to.equal(204);
  });
});
