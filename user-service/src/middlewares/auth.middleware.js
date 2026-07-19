const authMiddleware = (req, res, next) => {
  // TODO: Add JWT/session validation and user context assignment.
  next();
};

module.exports = {
  authMiddleware,
};
