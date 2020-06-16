// eslint-disable-next-line
import Sinon from 'sinon';
// import Core from '../../core';
// import uuidv4 from 'uuid/v4';

import Emailer from '../src/integrations/email';

function emailSendStub(cb = null) {
  return Sinon.stub(Emailer.prototype, 'sendEmail').callsFake(function(options, template, context) {
    if (cb) {
      return cb(template, context);
    }

    return this.renderTemplate(template, context);
  });
}

export default {
  emailSendStub,
};
