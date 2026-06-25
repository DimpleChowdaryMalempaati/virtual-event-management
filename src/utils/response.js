function sendSuccess(res, { statusCode = 200, message, data, meta }) {
  const response = { success: true };

  if (message) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  if (meta !== undefined) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
}

module.exports = { sendSuccess };
