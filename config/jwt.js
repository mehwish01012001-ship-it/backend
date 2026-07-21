const jwt = require('jsonwebtoken');

exports.signToken = (payload, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
