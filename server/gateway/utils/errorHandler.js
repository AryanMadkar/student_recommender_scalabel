const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Axios errors (from microservice calls)
  if (err.response) {
    return res.status(err.response.status || 500).json({
      success: false,
      message: err.response.data?.message || 'Microservice error',
      details: err.response.data
    });
  }

  // Network errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      service: err.address
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;
