import path from 'path';
import fs from 'fs';
import Promise from 'bluebird';
import Handlebars from 'handlebars';
import Markdown from 'nodemailer-markdown';
import Nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import glob from 'glob';

import Core from '../../core';

const { LogUtil } = Core.utils;
const Config = Core.config;

const EMAIL_TEMPLATE = 'emails';
const HELPER_TEMPLATE = 'helpers';
const PARTIAL_TEMPLATE = 'partials';
const NAME = 'EmailerAPI';

const TYPE_SMTP = 'SMTP';
// const TYPE_SENDGRID = 'SENDGRID';

class EmailAPI {
  templateCache = {};

  constructor() {
    this.emails = Config.get('emails');
    this.emailer = Config.get('emailer');

    if (this.emailer.mode === TYPE_SMTP) {
      this.config = this.emailer;
      this.transport = Nodemailer.createTransport(this.config);

      this.transport.use('compile', Markdown.markdown({
        useEmbeddedImages: true,
      }));
    } else {
      this.config = Config.get('sendgrid');
    }

    this.renderTemplate = this.renderTemplate.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
  }

  static templatePath = path.join(__dirname, `/../${EMAIL_TEMPLATE}/`);

  static log = LogUtil.getLogger(NAME);

  static registerHelpers() {
    const helpersPath = path.join(EmailAPI.templatePath, HELPER_TEMPLATE);

    glob(`${helpersPath}/**/*.js`, (err, files) => {
      if (err) {
        throw Error(err);
      }
      files.forEach((file) => {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        require(file)(Handlebars);
      });
    });
  }

  static registerPartials() {
    const partialsPath = path.join(EmailAPI.templatePath, PARTIAL_TEMPLATE);

    glob(`${partialsPath}/**/*.hbs.md`, (globError, paths) => {
      if (globError) {
        throw Error(globError);
      }
      paths.forEach((filepath) => {
        const options = {
          encoding: 'utf-8',
        };
        fs.readFile(filepath, options, (fileError, file) => {
          if (fileError) {
            throw new Error(fileError);
          }
          const filename = path.basename(filepath, '.hbs.md');
          Handlebars.registerPartial(filename, file);
        });
      });
    });
  }

  renderTemplate(signature, context) {
    return new Promise((resolve, reject) => {
      if (this.templateCache[signature]) {
        return resolve(this.templateCache[signature](context));
      }

      const filePath = path.join(EmailAPI.templatePath, `${signature}.hbs.md`);
      const options = {
        encoding: 'utf-8',
      };

      return fs.readFile(filePath, options, (err, source) => {
        if (err) {
          return reject(err);
        }

        this.templateCache[signature] = Handlebars.compile(source);
        return resolve(this.templateCache[signature](context));
      });
    });
  }

  sendEmail(options, template, context, attachment) {
    if (typeof template !== 'string') return Promise.reject(new Error('invalid template'));
    return this.renderTemplate(template, context)
      .then((content) => this.sendEmailWithHtml(options, content, attachment));
  }

  sendEmailWithHtml(options, content, attachment = null) {
    let opts = options;

    if (!('to' in opts)) {
      const defaultEmail = this.emails.defaults;
      opts.to = defaultEmail;
    }

    if (!Array.isArray(opts.to)) {
      opts.to = [opts.to];
    }

    if (!('subject' in opts)) {
      throw Error('subject: required');
    }

    if (attachment) {
      this.addAttachment(opts, attachment);
    }

    if (this.emailer.mode === TYPE_SMTP) {
      opts = {
        ...opts,
        from: this.emails.system.fromAddress,
        markdown: content,
      };

      opts = this.checkDebugEmail(opts, this.emails.debug);

      EmailAPI.log.debug(opts);
      return this.transport.sendMail(opts);
    }

    sgMail.setApiKey(this.config.apiKey);
    opts = {
      ...opts,
      from: this.emails.system.fromAddress,
      html: content,
    };

    opts = this.checkDebugEmail(opts, this.emails.debug);

    EmailAPI.log.debug(opts, this.emails.debug);
    if (!opts.to || !opts.to.length) {
      return null;
    }

    if (opts.to.length > 1) {
      return sgMail.sendMultiple(opts);
    }

    return sgMail.send(opts);
  }

  checkDebugEmail(options, debug) {
    const opts = options;
    if (debug != null && debug.length) {
      opts.to = opts.to.filter((em) => em && em.match(debug));
    }
    const env = Config.get('env');
    const isProd = env === 'staging' || env === 'production';
    if (!isProd) {
      opts.subject = `${env}: ${opts.subject}`;
    }
    return opts;
  }

  addAttachment(options, filePath) {
    const opts = options;
    opts.attachments = opts.attachments || [];

    if (this.emailer.mode === TYPE_SMTP) {
      const attach = {
        filename: path.basename(filePath),
        path: filePath,
      };

      opts.attachments.push(attach);
    } else {
      const fileContent = fs.readFileSync(filePath);
      const fileBase64 = Buffer.from(fileContent).toString('base64');

      const attach = {
        filename: path.basename(filePath),
        content: fileBase64,
      };
      opts.attachments.push(attach);
    }

    return opts;
  }
}

EmailAPI.registerHelpers();
EmailAPI.registerPartials();

module.exports = EmailAPI;
