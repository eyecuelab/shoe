const bunyan = require('bunyan');
const bformat = require('bunyan-format');
const Config = require('../../../config/config');

class Logger {
  static instance = null;

  static create() {
    this.instance = this.instance == null ? new Logger() : this.instance;
    return this.instance;
  }

  constructor() {
    const formatOut = bformat({
      outputMode: 'short',
    });

    const streams = Config.get('logging');
    // const logAll = Config.get('log_all');
    //
    // if (logAll) {
    //   streams = [{
    //     stream: process.stderr,
    //     // level: 'error',
    //     // stream: process.stderr,
    //   }];
    // }

    if (Config.get('env') !== 'production') {
      streams.unshift({
        level: 'error',
        stream: formatOut,
      });
    }

    this.logger = bunyan.createLogger({
      name: Config.get('projectName'),
      streams,
    });
  }
}

module.exports = {
  getAppLogger() {
    const appLogger = Logger.create();
    return appLogger.logger;
  },
  getLogger(name) {
    const appLogger = Logger.create();
    const log = appLogger.logger.child({ feature: name });
    return log;
  },
};
