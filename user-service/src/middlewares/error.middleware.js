const { AppError } = require("../utils/error");
const logger = require("../config/logger");

module.exports = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
    });
  }

  logger.error(`Unexpected error: ${err.message}`);

  return res.status(500).json({
    success: false,
    error: "SERVER_ERROR",
    message: "Internal Server Error",
  });
};
