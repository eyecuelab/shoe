const NAME = 'AdminPlugin';

class AdminPlugin {
  constructor() {
    this.register = this.register.bind(this);
    // this.log = LogUtil.getLogger(NAME);
  }

  register = () => {
    // this.log.info(`Register ${NAME}`);
  }
}

module.exports = (() => {
  const plugin = new AdminPlugin();
  return {
    name: NAME,
    register: plugin.register,

    instance: plugin,
    AdminPlugin,
  };
})();
