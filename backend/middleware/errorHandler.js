export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal server error',
    statusCode: err.statusCode || 500
  };

  // Validation error
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // Duplicate key error (MySQL)
  if (err.code === 'ER_DUP_ENTRY') {
    error.statusCode = 400;
    error.message = 'Duplicate entry. This record already exists.';
  }

  // Foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.statusCode = 400;
    error.message = 'Referenced record does not exist.';
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
