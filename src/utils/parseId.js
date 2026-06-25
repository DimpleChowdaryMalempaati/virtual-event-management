const ApiError = require('./ApiError');

function parseId(value, resourceName = 'Resource') {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest(`Invalid ${resourceName.toLowerCase()} ID. A positive integer is required.`);
  }

  return id;
}

module.exports = parseId;
