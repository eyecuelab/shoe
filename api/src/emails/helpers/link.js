module.exports = (h) => {
  h.registerHelper('link', (text, options) => {
    const attrs = [];

    Object.keys(options.hash).forEach((prop) => {
      attrs.push(
        `${h.escapeExpression(prop)}="${options.hash[prop]}"`);
    });

    return new h.SafeString(
      `<a ${attrs.join(' ')}>${h.escapeExpression(text)}</a>`,
    );
  });
};
