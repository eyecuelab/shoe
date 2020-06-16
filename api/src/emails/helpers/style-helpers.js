module.exports = (h) => {
  h.registerHelper('body-header', function(options) {
    const content = options.fn(this);
    const style = `
      color: #666;
      font-weight: normal;
      font-size: 20px;
      margin: 0px;
      margin-bottom: 10px;
    `;
    return new h.SafeString(`<h2 style="${style}">${content || ''}</h2>`);
  });

  h.registerHelper('section-header', function(options) {
    const content = options.fn(this);
    const style = `
      color: #666;
      font-weight: normal;
      font-size: 16px;
      margin: 0px;
      margin-bottom: 10px;
    `;
    return new h.SafeString(`<h3 style="${style}">${content || ''}</h3>`);
  });

  h.registerHelper('body-text', function(options) {
    const content = options.fn(this);
    const style = `
      color: #666;
      margin: 0px;
      margin-bottom: 8px;
    `;
    return new h.SafeString(`<p style="${style}">${content || ''}</p>`);
  });

  h.registerHelper('body-sub-text', function(options) {
    const content = options.fn(this);
    const style = `
      color: #a0a0a0;
      margin: 0px;
      margin-bottom: 8px;
      font-style: italic;
    `;
    return new h.SafeString(`<p style="${style}">${content || ''}</p>`);
  });

  h.registerHelper('body-section', function(options) {
    const content = options.fn(this);
    const style = `
      margin-bottom: 20px;
    `;
    return new h.SafeString(`<div style="${style}">${content || ''}</div>`);
  });

  h.registerHelper('body-link', function(options) {
    const content = options.fn(this);
    const { href, label } = options.hash;
    const style = `
      display: inline-block;
      color: #666;
      text-decoration: none;
      margin-top: 8px;
    `;
    const labelStyle = `
      color: #009BFF;
    `;
    return new h.SafeString(`
      <a style="${style}" href="${href || '#'}">
        <span style="${labelStyle}">${label || ''}</span>
        ${content || ''}
      </a><br />`);
  });
};
