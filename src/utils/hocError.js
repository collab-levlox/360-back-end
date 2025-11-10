const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    status: status,
    message: err.message ?? "Internal Server Error",
    error: err.error,
  });
};

module.exports = errorHandler;
