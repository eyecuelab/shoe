const constants = {
  AUTH_STRATEGIES: {
    SESSION: 'jwt-with-session',
  },
  EXPIRATION_PERIOD: {
    SHORT: '10m',
    MEDIUM: '8h',
    LONG: '730h',
  },
  QUEUE_LIST: {
    MAIN_QUEUE: {
      name: 'main-queue',
      handlers: {
        SEND_EMAIL: {
          name: 'send-email',
          handler: 'handleSendEmail',
        },
      },
    },
  },
};

module.exports = constants;
