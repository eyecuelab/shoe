import Boom from '@hapi/boom';

const fileHandler = (file, processFileFunc) => new Promise(async (resolve, reject) => {
  if (!file) return reject(Boom.badRequest());

  const fileResult = await processFileFunc(file);

  const ret = {
    filename: file.filename,
    data: fileResult,
    headers: file.headers,
  };

  return resolve(ret);
});

module.exports = {
  fileUploader(request, processFileFunc) {
    const {
      payload,
    } = request;

    const f = payload.file;

    const isArray = Array.isArray(f);
    if (!isArray) {
      return fileHandler(f, processFileFunc);
    }

    const results = [];

    for (let index = 0; index < f.length; index += 1) {
      const ff = f[index];
      results.push(fileHandler(ff, processFileFunc));
    }

    return results;
  },
};
