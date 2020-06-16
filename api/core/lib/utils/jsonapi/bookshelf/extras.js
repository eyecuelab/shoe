// Bookshelf Collection Type Guard
// https://basarat.gitbooks.io/typescript/content/docs/types/typeGuard.html
function isCollection(data) {
  // Type recognition based on duck-typing
  return data ? data.models !== undefined : false;
}

// Bookshelf Model Type Guard
// https://basarat.gitbooks.io/typescript/content/docs/types/typeGuard.html
function isModel(data) {
  return data ? !isCollection(data) : false;
}

exports.isModel = isModel;
exports.isCollection = isCollection;
