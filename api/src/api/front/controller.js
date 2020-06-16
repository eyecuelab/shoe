import showdown from 'showdown';

import BaseController from '../base';

import { Page } from '../../models/page';

const CONTROLLER = 'FrontController';

class FrontController extends BaseController {
  constructor() {
    super(CONTROLLER);
    this.bindAll(this);
  }

  async home(req, h) {
    const homePage = await Page.forge({ slug: 'home' }).fetch();

    let html = 'shoe';
    if (homePage) {
      const converter = new showdown.Converter();
      html = converter.makeHtml(homePage.attributes.content);
    }

    return h.view('pages/home', {
      content: html,
    });
  }

  // Helpers
}

module.exports = new FrontController();
