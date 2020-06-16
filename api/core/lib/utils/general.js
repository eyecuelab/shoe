import Tokens from 'csrf';
import Moment from 'moment';

export class GeneralUtil {
  static To(promise) {
    return promise.then(data => [null, data])
      .catch(err => [err, null]);
  }

  static GenerateAntiForgery() {
    const csrf = new Tokens();
    const secret = csrf.secretSync();
    return {
      secret,
      csrf: csrf.create(secret),
    };
  }

  static BindAll(obj, context) {
    const self = obj;
    const ctx = context || self;
    const keys = Object.getOwnPropertyNames(self.constructor.prototype);

    keys.forEach((key) => {
      const val = self[key];

      if (key !== 'constructor' && typeof val === 'function') {
        self[key] = val.bind(ctx);
      }
    });

    return self;
  }

  static Json2csv(items) {
    const replacer = (_key, value) => (value === null ? '' : value);
    const header = Object.keys(items[0]);
    let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');
    return csv;
  }

  static CurrencyFormat(val) {
    return val.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }

  static DateFormat(val) {
    return Moment(val).format('LL');
  }

  static roundTotal(num) {
    return Math.round((num * 100).toFixed(2)) / 100;
  }

  static async runSeries(promises) {
    // eslint-disable-next-line max-len
    return promises.reduce((promiseChain, currentTask) => promiseChain.then(chainResults => currentTask.then(currentResult => [...chainResults, currentResult])), Promise.resolve([]));
  }

  static getDayOfYear(date) {
    // eslint-disable-next-line max-len
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
  }

  static getCharCode(ch) {
    return ch.charCodeAt(0);
  }

  static getCharByNumber(num) {
    const A_OFFSET = 65 - 1;
    const BASE = 26;

    const digit2Num = Math.round(num / BASE);
    const digit2 = digit2Num === 0 ? '' : String.fromCharCode(A_OFFSET + digit2Num);

    const digit1Num = num % BASE;
    const digit1 = digit1Num === 0 ? '' : String.fromCharCode(A_OFFSET + digit1Num);

    return `${digit2}${digit1}`;
  }
}

export default GeneralUtil;
