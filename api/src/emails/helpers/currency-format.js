module.exports = (h) => {
  h.registerHelper('currencyFormat', (value) => value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,'));
};
