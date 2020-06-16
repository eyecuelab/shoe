import Handlebars from 'handlebars';
import pdf from 'html-pdf';

function registerHelper(conditionName, callback) {
  Handlebars.registerHelper(conditionName, callback);
}

function create (document, options) {
  return new Promise((resolve, reject) => {
    if (!document || !document.template || !document.context) {
      reject(Error('Some, or all, options are missing.'));
    }

    if (document.type !== 'buffer' && !document.path) {
      reject(Error("Please provide path parameter to save file or if you want buffer as output give parameter type = 'buffer'"));
    }

    const html = Handlebars.compile(document.template)(document.context);
    const pdfPromise = pdf.create(html, options);

    if (document.type === 'buffer') {
      pdfPromise.toBuffer((err, buff) => {
        if (!err) {
          resolve(buff);
        } else {
          reject(err);
        }
      });
    } else {
      pdfPromise.toFile(document.path, (err, res) => {
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    }
  });
}

module.exports = {
  registerHelper,
  create,
};
