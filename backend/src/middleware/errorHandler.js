const { fail } = require('../utils/apiResponse');

function notFoundHandler(req, res) {
  return fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return fail(res, 400, 'Validation error', err.errors?.map((e) => e.message));
  }
  if (err.isJoi) {
    return fail(res, 400, 'Validation error', err.details?.map((d) => d.message));
  }

  const status = err.status || 500;
  return fail(res, status, err.message || 'Internal server error');
}

module.exports = { notFoundHandler, errorHandler };
