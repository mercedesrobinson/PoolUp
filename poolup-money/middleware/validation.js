const logger = require('../utils/logger');

function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.warn('Validation error:', { errors: validationErrors, body: req.body });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors
      });
    }
    
    req.body = value;
    next();
  };
}

module.exports = { validateRequest };
