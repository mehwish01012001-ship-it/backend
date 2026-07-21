const helmet = require('helmet');

exports.securityMiddleware = () => {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
};
