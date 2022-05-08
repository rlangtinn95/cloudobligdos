const { validationResult } = require('express-validator');

const ValidationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    return next();
}

// In case we add more middleware to validator
const validator = {
    ValidationHandler
}

module.exports = validator;