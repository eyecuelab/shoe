import moment from 'moment';

const DateFormats = {
  short: 'L',
  long: 'LL',
};

module.exports = (h) => {
  h.registerHelper('dateFormat', (date, format) => {
    const f = DateFormats[format] || format;
    return moment(date).format(f);
  });
};
