import Glue from '@hapi/glue';
import Path from 'path';
import fs from 'fs';
import glob from 'glob';
import Handlebars from 'handlebars';
import Manifest from '../config/manifest';
import Log from './utils/log';
import Config from '../../config/config';
import DBUtil from './utils/db';

const VIEWS_PATH = 'views';

const name = Config.get('projectName');
const env = Config.get('env');
const log = Log.getLogger(name);

const outputMessage = (m) => {
  const msg = `[${env}] ${name}: ${m}`;
  log.info(msg);
  process.stdout.write(msg);
};

const composeOptions = {
  relativeTo: __dirname,
};

const registerHandlebarsTemplates = () => {
  const partialsPath = Path.join(__dirname, '../../src', VIEWS_PATH);

  glob(`${partialsPath}/**/*.hbs.html`, (globError, paths) => {
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
        const filename = Path.basename(filepath, '.hbs.html');
        Handlebars.registerPartial(filename, file);
      });
    });
  });
};

const startServer = async (manifest) => {
  try {
    outputMessage('Starting...\n');
    const server = await Glue.compose(manifest || Manifest, composeOptions);

    registerHandlebarsTemplates();

    server.views({
      engines: {
        html: Handlebars,
      },
      relativeTo: Path.resolve('./src'),
      path: VIEWS_PATH,
      helpersPath: `${VIEWS_PATH}/helpers`,
    });

    await server.start();
    const startedMsg = `Running at => ${server.info.uri}\n`;
    outputMessage(startedMsg);
    return server;
  } catch (err) {
    log.error(err);
    // console.log('** startServer');
    return process.exit(1);
  }
};

const init = async (manifest) => {
  if (Config.get('startupMigrations')) {
    const msg = 'Running migrations...';
    outputMessage(msg);
    await DBUtil.runMigrations(false);
    process.stdout.write('done\n');
  }
  return startServer(manifest);
};

module.exports = {
  init,
  startServer,
};
