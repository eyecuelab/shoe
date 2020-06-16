module.exports = (h) => {
  h.registerHelper('concat', (str1 = '', str2 = '') => str1 + str2);
};
