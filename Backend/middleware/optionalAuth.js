const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_matall');
    console.log('optionalAuth identified user:', decoded.id || decoded._id);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('optionalAuth token missing/invalid, proceeding as guest');
    // If token is invalid, we just proceed as guest
    next();
  }
};

module.exports = optionalAuth;
