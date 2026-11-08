/**
 * Request validation helper middleware
 */

function validateBody(requiredFields) {
  return (req, res, next) => {
    const missing = [];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Missing required field(s): ${missing.join(', ')}`,
        missingFields: missing,
        status: 400
      });
    }

    next();
  };
}

function validateEnum(field, allowedValues, source = 'body') {
  return (req, res, next) => {
    const val = req[source][field];
    if (val && !allowedValues.includes(val)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid value '${val}' for '${field}'. Allowed values: ${allowedValues.join(', ')}`,
        status: 400
      });
    }
    next();
  };
}

module.exports = {
  validateBody,
  validateEnum
};
