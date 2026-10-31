const app = require('../backend/database.js');

module.exports = (req, res) => {
  // Ensure that /api prefix is preserved for Express router
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};

