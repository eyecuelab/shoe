import Core from '../core';

import Session from '../src/models/session';

const { manifest } = Core;

const { server } = Core;

async function apiAuthCall(s, method, as, url, payload, headerOpts = {}) {
  const jwt = await Session.createTokenByUser(as, ['other']);
  const headers = {
    ...headerOpts,
    authorization: `Bearer ${jwt}`,
  };

  return s.inject({ method, url, payload, headers });
}

async function apiAnonCall(s, method, url, payload, headers) {
  const options = { method, url, payload, headers };

  return s.inject(options);
}

async function get(s, as, url, query = {}) {
  let urlWithQuery = url;
  const keys = Object.keys(query);
  if (keys.length) {
    let qs = '';
    keys.forEach((k) => {
      qs += `${k}=${query[k]}&`;
    });
    urlWithQuery = `${urlWithQuery}?${qs}`;
  }

  return apiAuthCall(s, 'GET', as, urlWithQuery, query);
}

async function post(s, as, url, payload, headers) {
  return apiAuthCall(s, 'POST', as, url, payload, headers);
}

async function patch(s, as, url, payload, headers) {
  return apiAuthCall(s, 'PATCH', as, url, payload, headers);
}

async function del(s, as, url, payload) {
  return apiAuthCall(s, 'DELETE', as, url, payload);
}

async function getAnon(s, url) {
  return apiAnonCall(s, 'GET', url);
}

async function postAnon(s, url, payload, headers) {
  return apiAnonCall(s, 'POST', url, payload, headers);
}

async function patchAnon(s, url, payload, headers) {
  return apiAnonCall(s, 'PATCH', url, payload, headers);
}

export default {
  server: server(manifest),
  get,
  post,
  patch,
  del,
  getAnon,
  postAnon,
  patchAnon,
};
