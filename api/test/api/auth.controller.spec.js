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
  const signedInActions = ['logout'];
  const signedInLinks = [
    'users', 'pages',
  ];

  before(async () => {
    await DBUtil.clean(DB.knex);

    users = await seedUsers();
    [user] = users;
    s = await api.server;
  });

  it('login', async () => {
    const payload = { email: user.email, password: 'shoe' };
    let response = await api.postAnon(s, '/login', payload);
    response = await api.postAnon(s, '/login', payload);
    expect(response.statusCode).to.equal(200);
    await schema.validateOne(response.result);
    schema.mustHaveActions(response.result, signedInActions);
    schema.mustHaveLinks(response.result, signedInLinks);

    // case sensitive password
    response = await api.postAnon(s, '/login', { ...payload, password: 'shoe' });
    expect(response.statusCode).to.equal(401);
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
      ['login']);
  });
});
